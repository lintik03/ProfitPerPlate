// PROFITPERPLATE - FIREBASE IMPLEMENTATION
// =============================================================================
// FIREBASE CONFIGURATION - REPLACE WITH YOUR PROJECT CREDENTIALS
// =============================================================================

const firebaseConfig = {
  apiKey: "AIzaSyD4ygdPyx7M7NPsxOiO_v3rg1wUabIOT_A",
  authDomain: "profitperplate-4c898.firebaseapp.com",
  projectId: "profitperplate-4c898",
  storageBucket: "profitperplate-4c898.firebasestorage.app",
  messagingSenderId: "1050472555866",
  appId: "1:1050472555866:web:4cea0f82a857ef3885ff63",
  measurementId: "G-53QPJ23DWX"
};

// =============================================================================
// SIMPLIFIED APPROACH: Clean reset with basic error handling
// =============================================================================

let firebaseReady = false;
let currentUser = null;
let isPasswordResetFlow = false;
let auth = null;
let db = null;

// Initialize data loading state
window.dataLoadingState = {
    isLoading: false,
    hasUserData: false,
    lastLoadTime: null,
    lastSaveTime: null
};

// Initialize Firebase
(async function initializeFirebase() {
    try {
        if (!window.firebase) {
            console.warn("Firebase SDK not available");
            firebaseReady = false;
            return;
        }
        
        // Initialize Firebase if not already initialized
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        
        // Initialize auth and db instances
        auth = firebase.auth();
        db = firebase.firestore();
        
        firebaseReady = true;
        
        // Set up auth state listener
        setupAuthStateListener();
        
        console.log("✅ Firebase initialized successfully");
    } catch (error) {
        console.error("❌ Failed to initialize Firebase:", error);
        firebaseReady = false;
    }
})();

// =============================================================================
// RESET DATA MANAGEMENT - SIMPLIFIED
// =============================================================================

function hasMeaningfulData(data) {
    if (!data) return false;
    
    const hasRawMaterials = data.rawMaterials?.length > 0 && 
        data.rawMaterials.some(item => item.name && item.name.trim() !== '');

    const hasRecipes = data.recipes?.length > 0 && 
        data.recipes.some(recipe => recipe.name && recipe.name.trim() !== '');

    const hasDirectLabor = data.directLabor?.length > 0 && 
        data.directLabor.some(labor => labor.name && labor.name.trim() !== '');

    return hasRawMaterials || hasRecipes || hasDirectLabor;
}

// SIMPLIFIED: Data recovery mechanism
function attemptDataRecovery() {
    console.log("🔄 Attempting data recovery...");
    
    try {
        // Check for backup in localStorage
        const backupData = localStorage.getItem('profitPerPlate_userData_backup');
        const currentData = localStorage.getItem('profitPerPlate_userData');
        
        const backupValid = backupData && backupData !== '{}' && backupData !== 'null';
        const currentEmpty = !currentData || currentData === '{}' || currentData === 'null';
        
        if (backupValid && currentEmpty) {
            console.log("✅ Restoring from backup");
            localStorage.setItem('profitPerPlate_userData', backupData);
            return { success: true, recovered: true };
        }
        
        return { success: true, recovered: false };
    } catch (error) {
        console.error("❌ Data recovery failed:", error);
        return { success: false, error: error.message };
    }
}

// =============================================================================
// DATA PERSISTENCE - SIMPLIFIED
// =============================================================================

function saveUserData(data) {
    // Don't save if we're still loading data
    if (window.dataLoadingState.isLoading) {
        console.log("⏳ Save skipped - data still loading");
        return { success: false, error: "Data loading in progress" };
    }
    
    // Create backup before any save operation
    try {
        const currentData = localStorage.getItem('profitPerPlate_userData');
        if (currentData) {
            localStorage.setItem('profitPerPlate_userData_backup', currentData);
        }
    } catch (backupError) {
        console.warn("⚠️ Backup creation failed:", backupError);
    }
    
    console.log("💾 MANUAL SAVE: Saving user data to localStorage...");
    
    try {
        const payload = {
            ...data,
            dataVersion: data.dataVersion || 2,
            lastSaved: new Date().toISOString(),
            savedBy: currentUser ? currentUser.email : 'anonymous'
        };
        
        localStorage.setItem('profitPerPlate_userData', JSON.stringify(payload));
        console.log("✅ Data saved to localStorage");
        
        // Update state
        window.dataLoadingState.hasUserData = hasMeaningfulData(payload);
        window.dataLoadingState.lastSaveTime = new Date().toISOString();
        
        // If logged in, try to save to cloud (but don't block on errors)
        if (currentUser && firebaseReady && db) {
            console.log("💾 MANUAL CLOUD SAVE: Triggering cloud save...");
            saveToCloud(payload).catch(error => {
                console.error("❌ Cloud save error:", error);
            });
        }
        
        return { success: true, local: true };
    } catch (error) {
        console.error("❌ Failed to save data:", error);
        return { success: false, error: error.message };
    }
}

// Async cloud save with Firebase
async function saveToCloud(payload) {
    if (!currentUser || !firebaseReady || !db) {
        return { success: false, error: "Not authenticated or Firebase not ready" };
    }
    
    try {
        console.log("💾 MANUAL CLOUD SAVE: Starting Firebase save operation...");
        
        // Use Firestore
        await db
            .collection('user_data')
            .doc(currentUser.uid)
            .set({
                user_id: currentUser.uid,
                data: payload,
                data_version: payload.dataVersion || 2,
                updated_at: firebase.firestore.FieldValue.serverTimestamp(),
                last_saved: new Date().toISOString()
            }, { merge: true });
            
        console.log("✅ MANUAL CLOUD SAVE: Firebase save successful");
        return { success: true };
    } catch (error) {
        console.error("❌ Firebase save exception:", error);
        return { 
            success: false, 
            error: error.message,
            code: 'EXCEPTION'
        };
    }
}

// SIMPLIFIED: Load from cloud with Firebase
async function syncFromCloud() {
    if (!currentUser || !firebaseReady || !db) {
        return { success: false, error: "Not available" };
    }
    
    try {
        console.log("🔄 MANUAL CLOUD SYNC: Triggering Firebase sync...");
        
        const doc = await db
            .collection('user_data')
            .doc(currentUser.uid)
            .get();
            
        if (!doc.exists) {
            console.log("📝 No cloud data found for user");
            return { success: true, updated: false };
        }
        
        const data = doc.data();
        if (data) {
            const cloudData = migrateDataToVersion(data.data, data.data_version || 1);
            const localData = loadFromLocalStorage();
            
            // Use cloud data if it exists
            const finalData = {
                ...cloudData,
                lastSaved: new Date().toISOString(),
                savedBy: currentUser.email,
                syncedFromCloud: true
            };
            
            localStorage.setItem('profitPerPlate_userData', JSON.stringify(finalData));
            return { success: true, updated: true, data: finalData };
        }
        
        return { success: true, updated: false };
    } catch (error) {
        console.error("❌ Firebase sync failed:", error);
        return { 
            success: false, 
            error: error.message
        };
    }
}

// SIMPLIFIED: Load user data
async function loadUserData() {
    console.log("📥 Loading user data...");
    
    // Attempt data recovery first
    attemptDataRecovery();
    
    // Set loading state
    window.dataLoadingState.isLoading = true;
    window.dataLoadingState.lastLoadTime = new Date().toISOString();
    
    try {
        // Always load from localStorage first (immediate)
        const localData = loadFromLocalStorage();
        console.log("✅ Loaded from localStorage");
        
        // Update state
        window.dataLoadingState.hasUserData = hasMeaningfulData(localData);
        
        // If logged in, try to sync from cloud in background
        if (currentUser && firebaseReady && !isPasswordResetFlow && db) {
            console.log("🔄 MANUAL CLOUD SYNC: Attempting Firebase sync...");
            syncFromCloud().then(result => {
                if (result.success && result.updated) {
                    console.log("✅ Firebase data loaded");
                    window.dataLoadingState.hasUserData = true;
                    
                    if (window.showNotification) {
                        window.showNotification("✅ Cloud profit analysis data synced", "success");
                    }
                    
                    // Refresh UI if cloud data was newer
                    if (window.renderAllData) {
                        window.renderAllData();
                    }
                }
            }).catch(error => {
                console.error("❌ Firebase sync failed:", error);
            });
        }
        
        return localData;
    } catch (error) {
        console.error("❌ Error loading user profit analysis data:", error);
        window.dataLoadingState.hasUserData = false;
        return getDefaultData();
    } finally {
        window.dataLoadingState.isLoading = false;
    }
}

// Enhanced data loading with UI sync
async function loadUserDataWithUISync() {
    console.log("📥 Loading user data with UI synchronization...");
    
    const data = await loadUserData();
    
    // Trigger UI refresh if global functions are available
    if (window.refreshAllUI) {
        setTimeout(() => {
            window.refreshAllUI();
        }, 100);
    }
    
    return data;
}

// Load from localStorage
function loadFromLocalStorage() {
    try {
        const localData = localStorage.getItem('profitPerPlate_userData');
        if (localData) {
            const parsed = JSON.parse(localData);
            console.log("📁 Loaded existing profit analysis data from localStorage");
            return migrateDataToVersion(parsed, parsed.dataVersion || 1);
        }
    } catch (error) {
        console.error('❌ Error loading profit analysis data from localStorage:', error);
    }
    
    console.log("📝 No existing profit analysis data, returning default structure");
    return getDefaultData();
}

function getDefaultData() {
    return {
        rawMaterials: [],
        directLabor: [],
        recipes: [],
        currency: "₱",
        currentRecipeState: null,
        dataVersion: 2
    };
}

function migrateDataToVersion(data, targetVersion) {
    let migratedData = { ...data };
    
    if (targetVersion >= 2) {
        if (migratedData.rawMaterials && Array.isArray(migratedData.rawMaterials)) {
            migratedData.rawMaterials = migratedData.rawMaterials.map(material => ({
                ...material,
                yieldPercentage: material.yieldPercentage || 100
            }));
        }
    }
    
    migratedData.dataVersion = targetVersion;
    return migratedData;
}

// =============================================================================
// AUTH MANAGEMENT - SIMPLIFIED (FIREBASE)
// =============================================================================

async function signUp(email, password) {
    if (!firebaseReady || !auth) {
        return { success: false, error: "Authentication service unavailable" };
    }
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        return { success: true, data: { user: userCredential.user } };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function signIn(email, password) {
    if (!firebaseReady || !auth) {
        return { success: false, error: "Authentication service unavailable" };
    }
    
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        return { success: true, data: { user: userCredential.user } };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function signOut() {
    if (!firebaseReady || !auth) {
        return { success: false, error: "Authentication service unavailable" };
    }
    
    try {
        console.log("🚪 Logging out...");
        await auth.signOut();
        // Reload page to reset all states
        window.location.reload();
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function resetPassword(email) {
    if (!firebaseReady || !auth) {
        return { success: false, error: "Authentication service unavailable" };
    }
    
    try {
        await auth.sendPasswordResetEmail(email, {
            url: window.location.origin
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// =============================================================================
// AUTH STATE MANAGEMENT (FIREBASE)
// =============================================================================

// MISSING PIECE 1: Updated checkAuthState method
async function checkAuthState() {
    console.log("🔍 Checking auth state...");
    
    if (!firebaseReady || !auth) {
        console.warn("Firebase not ready");
        currentUser = null;
        updateAuthUI();
        return null;
    }
    
    return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            currentUser = user;
            updateAuthUI();
            unsubscribe();
            resolve(user);
        });
    });
}

function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    const userInfo = document.getElementById('userInfo');
    const userEmail = document.getElementById('userEmail');
    
    if (currentUser && !isPasswordResetFlow) {
        if (authButtons) authButtons.classList.add('hidden');
        if (userInfo) userInfo.classList.remove('hidden');
        if (userEmail) userEmail.textContent = currentUser.email;
    } else {
        if (authButtons) authButtons.classList.remove('hidden');
        if (userInfo) userInfo.classList.add('hidden');
    }
}

// Auth state listener (Firebase)
function setupAuthStateListener() {
    if (!firebaseReady || !auth) {
        console.warn("Firebase not ready - cannot set up auth state listener");
        return;
    }
    
    console.log("🎧 Setting up Firebase auth state listener...");
    
    auth.onAuthStateChanged(async (user) => {
        console.log("🔄 Firebase auth state changed:", user ? user.email : "Logged Out");
        
        currentUser = user || null;
        
        if (user) {
            console.log('✅ User signed in:', user.email);
            
            // Check if this might be a password reset flow
            const hasResetToken = checkForResetTokenInURL();
            if (hasResetToken) {
                console.log('🔄 Password reset flow detected');
                handlePasswordResetFlow();
            } else {
                isPasswordResetFlow = false;
                updateAuthUI();
                
                // Normal login flow - sync data
                setTimeout(() => {
                    syncFromCloud().then(result => {
                        if (result.success && result.updated) {
                            console.log("✅ Cloud profit analysis data loaded after login");
                            if (window.showNotification) {
                                window.showNotification("✅ Cloud profit analysis data synced", "success");
                            }
                            if (window.renderAllData) {
                                window.renderAllData();
                            }
                        }
                    });
                }, 300);
            }
        } else {
            console.log('🚪 User signed out');
            isPasswordResetFlow = false;
            sessionStorage.removeItem('reset_access_token');
            updateAuthUI();
        }
    });
}

// =============================================================================
// SIMPLIFIED PASSWORD RESET HANDLING - DIRECT APPROACH
// =============================================================================

function checkForResetTokenInURL() {
    // Firebase doesn't use tokens in URL like Supabase
    // But we can check for any reset indicators
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    
    return (mode === 'resetPassword');
}

function handlePasswordResetFlow() {
    console.log('🔄 Starting password reset flow...');
    
    isPasswordResetFlow = true;
    
    // Clean the URL if needed
    if (window.history && window.history.replaceState) {
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        console.log('✅ URL cleaned');
    }
    
    // Update UI to show auth state (not logged in during reset flow)
    updateAuthUI();
    
    // Show reset modal with multiple attempts
    showResetPasswordModalWithRetry();
}

function showResetPasswordModalWithRetry(attempt = 1) {
    const maxAttempts = 5;
    
    console.log(`🔄 Attempting to show reset password modal (attempt ${attempt}/${maxAttempts})...`);
    
    if (window.showResetPasswordModal) {
        window.showResetPasswordModal();
        console.log('✅ Reset password modal shown via global function');
        return;
    }
    
    // Fallback: try direct DOM manipulation
    const modal = document.getElementById('resetPasswordModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        console.log('✅ Reset password modal shown via direct DOM');
        return;
    }
    
    // If not found, retry after delay
    if (attempt < maxAttempts) {
        setTimeout(() => {
            showResetPasswordModalWithRetry(attempt + 1);
        }, 500);
    } else {
        console.error('❌ Failed to show reset password modal after', maxAttempts, 'attempts');
        
        // Last resort: try to find any modal and show it
        const allModals = document.querySelectorAll('[id*="reset"], [id*="password"], [class*="modal"]');
        console.log('Available modals:', allModals);
        
        if (allModals.length > 0) {
            allModals[0].classList.remove('hidden');
            allModals[0].style.display = 'block';
            console.log('✅ Showing first available modal as fallback');
        }
    }
}

// Direct password reset handler
async function handlePasswordResetDirect() {
    console.log('🔍 Direct password reset check...');
    
    // Check if we're coming from a password reset email
    // Firebase handles this automatically through continueUrl
    
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    
    if (mode === 'resetPassword' || mode === 'verifyEmail') {
        console.log('✅ Password reset or verification detected');
        // Firebase will automatically handle the reset when user clicks the continue button
        return true;
    }
    
    console.log('📭 No password reset detected');
    return false;
}

// =============================================================================
// ENHANCED INITIALIZATION WITH PASSWORD RESET SUPPORT
// =============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 Initializing Firebase authentication...");
    
    try {
        // Set up auth state listener FIRST
        setupAuthStateListener();
        
        // Then check auth state
        await checkAuthState();
        
        // Check for password reset immediately
        console.log("🔄 Running password reset check...");
        const resetHandled = await handlePasswordResetDirect();
        
        console.log("✅ Firebase auth initialization completed");
        
    } catch (error) {
        console.error("💥 Firebase auth initialization failed:", error);
        currentUser = null;
        updateAuthUI();
    }
});

// =============================================================================
// SUBSCRIPTION MANAGEMENT (FIREBASE)
// =============================================================================

async function updateUserSubscription(subscriptionData) {
    if (!firebaseReady || !currentUser || !db) {
        return { success: false, error: "Not authenticated" };
    }
    
    try {
        await db
            .collection('user_subscriptions')
            .doc(currentUser.uid)
            .set({
                user_id: currentUser.uid,
                ...subscriptionData,
                updated_at: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
        console.log("✅ User subscription updated in Firebase");
        return { success: true };
    } catch (error) {
        console.error("❌ Error updating subscription in Firebase:", error);
        return { success: false, error: error.message };
    }
}

// MISSING PIECE 2: Updated getUserUsage method
async function getUserUsage() {
    if (!firebaseReady || !currentUser || !db) {
        return { success: false, error: "Not authenticated" };
    }
    
    try {
        const doc = await db
            .collection('user_usage')
            .doc(currentUser.uid)
            .get();
            
        if (doc.exists) {
            return { success: true, data: doc.data() };
        } else {
            // Create default usage record
            const defaultUsage = {
                user_id: currentUser.uid,
                raw_materials_count: 0,
                direct_labor_count: 0,
                main_recipes_count: 0,
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await db
                .collection('user_usage')
                .doc(currentUser.uid)
                .set(defaultUsage);
                
            return { success: true, data: defaultUsage };
        }
    } catch (error) {
        console.error("❌ Error getting user usage from Firebase:", error);
        return { success: false, error: error.message };
    }
}

// =============================================================================
// EXPORT - MAINTAIN SAME INTERFACE AS SUPABASE CLIENT
// =============================================================================

window.supabaseClient = {
    ready: firebaseReady,
    initialized: firebaseReady,
    
    // Auth State
    isAuthenticated: () => currentUser !== null && !isPasswordResetFlow,
    getUserId: () => currentUser?.uid || null,
    getCurrentUser: () => currentUser,
    
    // Auth Actions
    signUp,
    signIn,
    signOut,
    resetPassword,
    checkAuthState,
    handlePasswordReset: handlePasswordResetDirect,
    setupAuthStateListener,
    
    // Data Management
    saveUserData,
    loadUserData,
    loadUserDataWithUISync,
    loadFromLocalStorage,
    
    // Data Helpers
    hasMeaningfulData,
    attemptDataRecovery,
    getDataState: () => window.dataLoadingState,
    
    // Subscription Management
    updateUserSubscription,
    getUserUsage,
    
    // Password Reset Flow
    isPasswordResetFlow: () => isPasswordResetFlow,
    
    // Firebase-specific (for backward compatibility)
    getSubscriptionStatus: async () => {
        if (!currentUser || !db) return { plan_type: 'free', is_active: false };
        
        try {
            const doc = await db
                .collection('user_subscriptions')
                .doc(currentUser.uid)
                .get();
                
            if (doc.exists) {
                const data = doc.data();
                const isActive = data.status === 'active' && 
                    (!data.expiry || new Date(data.expiry) > new Date());
                return { ...data, is_active: isActive };
            }
            return { plan_type: 'free', is_active: false };
        } catch (error) {
            return { plan_type: 'free', is_active: false };
        }
    },
    
    // Debug functions
    debugReset: () => {
        console.log('=== FIREBASE DEBUG ===');
        console.log('URL:', window.location.href);
        console.log('Current User:', currentUser?.email);
        console.log('Is Reset Flow:', isPasswordResetFlow);
        console.log('Firebase Ready:', firebaseReady);
        console.log('Auth instance:', auth);
        console.log('DB instance:', db);
        console.log('showResetPasswordModal exists:', typeof window.showResetPasswordModal === 'function');
        console.log('Reset Modal Element:', document.getElementById('resetPasswordModal'));
    }
};

// Initialize the Firebase bridge
if (firebaseReady && auth && db) {
    console.log("✅ Firebase client exported - MANUAL SAVE SYSTEM ENABLED");
    
    // Additional auth observer for auto-sync on login
    auth.onAuthStateChanged((user) => {
        if (user && window.renderAllData) {
            // Small delay to ensure data is loaded
            setTimeout(() => {
                window.renderAllData();
            }, 500);
        }
    });
} else {
    console.warn("⚠️ Firebase not ready - bridge may be incomplete");
}

// Export for direct access if needed
window.firebaseAuth = auth;
window.firebaseDB = db;

// GOOGLE AUTHENTICATION SYSTEM
window.signInWithGoogle = async function() {
    if (!firebaseReady || !auth) {
        if (typeof window.showNotification === 'function') {
            window.showNotification("Auth system not ready. Please refresh.", "error");
        }
        return;
    }

    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        
        // Optional: Force account selection
        provider.setCustomParameters({
            prompt: 'select_account'
        });

        console.log("🚀 Initiating Google Sign-In...");
        const result = await auth.signInWithPopup(provider);
        
        // Success handling
        const user = result.user;
        console.log("✅ Google Sign-In successful:", user.email);
        
        if (typeof window.closeAuthModal === 'function') {
            window.closeAuthModal();
        }
        
        if (typeof window.showNotification === 'function') {
            window.showNotification(`Welcome, ${user.displayName || user.email}!`, "success");
        }

    } catch (error) {
        console.error("❌ Google Sign-In Error:", error);
        
        let errorMessage = "Failed to sign in with Google.";
        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = "Sign-in cancelled.";
        } else if (error.code === 'auth/auth-domain-config-required') {
            errorMessage = "Google Auth not configured in Firebase Console.";
        }

        if (typeof window.showNotification === 'function') {
            window.showNotification(errorMessage, "error");
        }
        
        const errorDisplay = document.getElementById('authError');
        if (errorDisplay) {
            errorDisplay.textContent = errorMessage;
            errorDisplay.classList.remove('hidden');
        }
    }
};