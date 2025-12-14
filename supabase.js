// NEW SUPABASE CONFIGURATION - REPLACE WITH YOUR PROJECT CREDENTIALS
const SUPABASE_URL = 'https://mrtvmoxhtmpbptkvklfj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ydHZtb3hodG1wYnB0a3ZrbGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NTY1MjUsImV4cCI6MjA3OTAzMjUyNX0.9cwIXYvQqYn-x0nR9RIh0N1xWvVxIPpXlJYZ-BsXU_E';

// =============================================================================
// SIMPLIFIED APPROACH: Clean reset with basic error handling
// =============================================================================

let supabase;
let supabaseReady = false;
let currentUser = null;
let isPasswordResetFlow = false;

// Initialize data loading state
window.dataLoadingState = {
    isLoading: false,
    hasUserData: false,
    lastLoadTime: null,
    lastSaveTime: null
};

// Initialize Supabase
(async function initializeSupabase() {
    try {
        if (!window.supabase) {
            console.warn("Supabase script not available");
            supabase = createFallbackClient();
            supabaseReady = false;
            return;
        }
        
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        supabaseReady = true;
        
        // 🟢 FIX: Set up the listener immediately after Supabase is ready
        window.supabaseClient?.setupAuthStateListener();
        
        console.log("✅ NEW Supabase client initialized successfully");
    } catch (error) {
        console.error("❌ Failed to initialize Supabase client:", error);
        supabase = createFallbackClient();
        supabaseReady = false;
    }
})();

function createFallbackClient() {
    return {
        auth: {
            signUp: () => ({ data: null, error: new Error("Device is Offline") }),
            signIn: () => ({ data: null, error: new Error("Device is Offline") }),
            signOut: () => ({ error: new Error("Device is Offline") }),
            resetPasswordForEmail: () => ({ data: null, error: new Error("Device is Offline") }),
            getSession: () => ({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            updateUser: () => ({ data: null, error: new Error("Device is Offline") })
        }
    };
}

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
        if (currentUser && supabaseReady) {
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

// Async cloud save with proper column names
async function saveToCloud(payload) {
    if (!currentUser || !supabaseReady) {
        return { success: false, error: "Not authenticated or Supabase not ready" };
    }
    
    try {
        console.log("💾 MANUAL CLOUD SAVE: Starting cloud save operation...");
        const { data, error } = await supabase
            .from('user_data')
            .upsert({
                user_id: currentUser.id,
                data: payload,
                data_version: payload.dataVersion, // CHANGED: dataVersion → data_version
                updated_at: new Date().toISOString()
            }, { 
                onConflict: 'user_id'
            });
            
        if (error) {
            console.error("❌ Database error:", error);
            return { 
                success: false, 
                error: error.message,
                code: error.code
            };
        }
        
        console.log("✅ MANUAL CLOUD SAVE: Cloud save successful");
        return { success: true, data };
    } catch (error) {
        console.error("❌ Cloud save exception:", error);
        return { 
            success: false, 
            error: error.message,
            code: 'EXCEPTION'
        };
    }
}

// SIMPLIFIED: Load from cloud with proper column names
async function syncFromCloud() {
    if (!currentUser || !supabaseReady) {
        return { success: false, error: "Not available" };
    }
    
    try {
        console.log("🔄 MANUAL CLOUD SYNC: Triggering cloud sync...");
        const { data, error } = await supabase
            .from('user_data')
            .select('data, data_version, updated_at') // CHANGED: dataVersion → data_version
            .eq('user_id', currentUser.id)
            .single();
            
        if (error) {
            if (error.code === 'PGRST116') {
                console.log("📝 No cloud data found for user");
                return { success: true, updated: false };
            } else {
                throw error;
            }
        }
        
        if (data) {
            const cloudData = migrateDataToVersion(data.data, data.data_version || 1); // CHANGED: dataVersion → data_version
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
        console.error("❌ Cloud sync failed:", error);
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
        if (currentUser && supabaseReady && !isPasswordResetFlow) {
            console.log("🔄 MANUAL CLOUD SYNC: Attempting cloud sync...");
            syncFromCloud().then(result => {
                if (result.success && result.updated) {
                    console.log("✅ Cloud data loaded");
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
                console.error("❌ Cloud sync failed:", error);
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
// AUTH MANAGEMENT - SIMPLIFIED
// =============================================================================

async function signUp(email, password) {
    if (!supabaseReady) {
        return { success: false, error: "Authentication service unavailable" };
    }
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: { emailRedirectTo: window.location.origin }
        });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function signIn(email, password) {
    if (!supabaseReady) {
        return { success: false, error: "Authentication service unavailable" };
    }
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function signOut() {
    if (!supabaseReady) {
        return { success: false, error: "Authentication service unavailable" };
    }
    
    try {
        console.log("🚪 Logging out...");
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function resetPassword(email) {
    if (!supabaseReady) {
        return { success: false, error: "Authentication service unavailable" };
    }
    
    try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin,
        });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// =============================================================================
// AUTH STATE MANAGEMENT
// =============================================================================

async function checkAuthState() {
    console.log("🔍 Checking auth state...");
    
    if (!supabaseReady) {
        console.warn("Supabase not ready");
        currentUser = null;
        updateAuthUI();
        return null;
    }
    
    try {
        const { data: { session } } = await supabase.auth.getSession();
        currentUser = session?.user || null;
        
        console.log("✅ Auth state:", currentUser ? `Logged in as ${currentUser.email}` : "Not logged in");
        
        updateAuthUI();
        return currentUser;
    } catch (error) {
        console.error("❌ Error checking auth state:", error);
        currentUser = null;
        updateAuthUI();
        return null;
    }
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

// Auth state listener
function setupAuthStateListener() {
    if (!supabaseReady) {
        console.warn("Supabase not ready - cannot set up auth state listener");
        return;
    }
    
    console.log("🎧 Setting up auth state listener...");
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("🔄 Auth state changed:", event, session);
        
        currentUser = session?.user || null;
        
        switch (event) {
            case 'SIGNED_IN':
                console.log('✅ User signed in:', currentUser?.email);
                
                // Check if this might be a password reset flow by checking URL
                const hasResetToken = checkForResetTokenInURL();
                if (hasResetToken) {
                    console.log('🔄 Password reset flow detected via URL token');
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
                break;
                
            case 'SIGNED_OUT':
                console.log('🚪 User signed out');
                isPasswordResetFlow = false;
                sessionStorage.removeItem('reset_access_token');
                updateAuthUI();
                break;
                
            case 'PASSWORD_RECOVERY':
                console.log('🔑 Password recovery event detected');
                handlePasswordResetFlow();
                break;
        }
    });
}

// =============================================================================
// SIMPLIFIED PASSWORD RESET HANDLING - DIRECT APPROACH
// =============================================================================

function checkForResetTokenInURL() {
    // Check both URL parameters and hash for reset token
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
    const type = urlParams.get('type') || hashParams.get('type');
    
    return (type === 'recovery' && accessToken);
}

function handlePasswordResetFlow() {
    console.log('🔄 Starting password reset flow...');
    
    isPasswordResetFlow = true;
    
    // Store token if present in URL
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
    
    if (accessToken) {
        sessionStorage.setItem('reset_access_token', accessToken);
        console.log('✅ Reset token stored in sessionStorage');
    }
    
    // Clean the URL
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
    
    const hasToken = checkForResetTokenInURL();
    if (hasToken) {
        console.log('✅ Reset token found in URL, starting reset flow');
        handlePasswordResetFlow();
        return true;
    }
    
    // Also check sessionStorage for existing token
    const storedToken = sessionStorage.getItem('reset_access_token');
    if (storedToken && !currentUser) {
        console.log('✅ Stored reset token found, starting reset flow');
        handlePasswordResetFlow();
        return true;
    }
    
    console.log('📭 No password reset token found');
    return false;
}

// =============================================================================
// ENHANCED INITIALIZATION WITH PASSWORD RESET SUPPORT
// =============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 Initializing authentication with enhanced reset handling...");
    
    try {
        // Set up auth state listener FIRST
        setupAuthStateListener();
        
        // Then check auth state
        await checkAuthState();
        
        // DIRECT APPROACH: Check for password reset immediately
        console.log("🔄 Running direct password reset check...");
        const resetHandled = await handlePasswordResetDirect();
        
        // If no reset handled, check again after a short delay (for async token processing)
        if (!resetHandled) {
            setTimeout(async () => {
                console.log("🔄 Secondary password reset check...");
                await handlePasswordResetDirect();
            }, 1000);
        }
        
        console.log("✅ Auth initialization completed");
        
    } catch (error) {
        console.error("💥 Auth initialization failed:", error);
        currentUser = null;
        updateAuthUI();
    }
});

// =============================================================================
// EXPORT
// =============================================================================

window.supabaseClient = {
    supabase,
    signUp,
    signIn,
    signOut,
    resetPassword,
    checkAuthState,
    handlePasswordReset: handlePasswordResetDirect,
    setupAuthStateListener,
    saveUserData,
    loadUserData,
    loadUserDataWithUISync,
    getCurrentUser: () => currentUser,
    isAuthenticated: () => currentUser !== null && !isPasswordResetFlow,
    getUserId: () => currentUser?.id || null,
    loadFromLocalStorage,
    hasMeaningfulData,
    attemptDataRecovery,
    getDataState: () => window.dataLoadingState,
    isPasswordResetFlow: () => isPasswordResetFlow,
    // Debug functions
    debugReset: () => {
        console.log('=== DEBUG ===');
        console.log('URL:', window.location.href);
        console.log('Has Token in URL:', checkForResetTokenInURL());
        console.log('Stored Token:', sessionStorage.getItem('reset_access_token'));
        console.log('Current User:', currentUser?.email);
        console.log('Is Reset Flow:', isPasswordResetFlow);
        console.log('showResetPasswordModal exists:', typeof window.showResetPasswordModal === 'function');
        console.log('Reset Modal Element:', document.getElementById('resetPasswordModal'));
    }
};

console.log("✅ NEW Supabase client exported - MANUAL SAVE SYSTEM ENABLED");