// Supabase Configuration
const SUPABASE_URL = 'https://nlpuyubpmexdqqyfjlcs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5scHV5dWJwbWV4ZHFxeWZqbGNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NTcwMzgsImV4cCI6MjA3ODIzMzAzOH0.aD4E1vVUNfOpDAWvKETpaXw9V0PkUPnpTLZpgBsN3Nc';

// =============================================================================
// ENHANCED: Supabase Configuration with Robust Offline Support
// PURPOSE: Automatic cloud sync with localStorage fallback
// =============================================================================

// Initialize Supabase client
let supabase;
try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
        }
    });
    console.log("✓ Supabase client initialized successfully");
} catch (error) {
    console.error("✗ Supabase client initialization failed:", error);
    supabase = createFallbackSupabaseClient();
}

// Enhanced fallback client creation
function createFallbackSupabaseClient() {
    console.log("Creating fallback Supabase client for offline mode");
    return {
        auth: {
            signUp: () => Promise.resolve({ error: new Error("Offline mode") }),
            signIn: () => Promise.resolve({ error: new Error("Offline mode") }),
            signOut: () => Promise.resolve({ error: null }),
            resetPasswordForEmail: () => Promise.resolve({ error: new Error("Offline mode") }),
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: null, error: null })
        },
        from: () => ({
            select: () => ({
                eq: () => ({
                    single: () => Promise.resolve({ data: null, error: new Error("Offline mode") })
                })
            }),
            upsert: () => Promise.resolve({ error: new Error("Offline mode") })
        })
    };
}

// Auth state management
let currentUser = null;

// =============================================================================
// SIMPLIFIED: LocalStorage Fallback System
// PURPOSE: Automatic offline data persistence
// =============================================================================

const STORAGE_KEYS = {
    USER_DATA: 'profitPerPlate_userData',
    OFFLINE_CHANGES: 'profitPerPlate_offlineChanges'
};

// Save data to localStorage (always works)
function saveToLocalStorage(data) {
    try {
        const storageData = {
            data: data,
            timestamp: new Date().toISOString(),
            version: 3, // Yield-inclusive costs version
            userEmail: currentUser?.email || 'local'
        };
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(storageData));
        console.log("✓ Data saved to localStorage");
        return true;
    } catch (error) {
        console.error("✗ LocalStorage save failed:", error);
        return false;
    }
}

// Load data from localStorage (always works)
function loadFromLocalStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.USER_DATA);
        if (stored) {
            const parsed = JSON.parse(stored);
            console.log("✓ Data loaded from localStorage");
            return parsed.data;
        }
    } catch (error) {
        console.error("✗ LocalStorage load failed:", error);
    }
    return null;
}

// Check if we're online
function isOnline() {
    return navigator.onLine;
}

// =============================================================================
// ENHANCED: Data Validation and Integrity Checks
// PURPOSE: Prevent corrupted data and ensure data consistency
// =============================================================================

// ENHANCED: Data validation before saving with serving scale contamination fix
function validateUserData(data) {
    const errors = [];
    
    // CRITICAL FIX: Remove serving scale from saved data to prevent contamination
    if (data.currentRecipeState && data.currentRecipeState.servingScale) {
        console.warn("Removing serving scale from saved recipe state to prevent cost contamination");
        delete data.currentRecipeState.servingScale;
    }
    
    // Validate raw materials
    if (data.rawMaterials && Array.isArray(data.rawMaterials)) {
        data.rawMaterials.forEach((material, index) => {
            if (!material.name || typeof material.name !== 'string') {
                errors.push(`Raw material at index ${index} has invalid name`);
            }
            if (isNaN(material.costPerUnit) || material.costPerUnit < 0) {
                errors.push(`Raw material "${material.name}" has invalid cost per unit`);
            }
            if (isNaN(material.yieldPercentage) || material.yieldPercentage <= 0 || material.yieldPercentage > 100) {
                errors.push(`Raw material "${material.name}" has invalid yield percentage`);
            }
        });
    }
    
    // Validate direct labor
    if (data.directLabor && Array.isArray(data.directLabor)) {
        data.directLabor.forEach((labor, index) => {
            if (!labor.name || typeof labor.name !== 'string') {
                errors.push(`Direct labor at index ${index} has invalid name`);
            }
            if (isNaN(labor.costPerUnit) || labor.costPerUnit < 0) {
                errors.push(`Direct labor "${labor.name}" has invalid cost per unit`);
            }
        });
    }
    
    // Validate recipes
    if (data.recipes && Array.isArray(data.recipes)) {
        data.recipes.forEach((recipe, index) => {
            if (!recipe.name || typeof recipe.name !== 'string') {
                errors.push(`Recipe at index ${index} has invalid name`);
            }
            if (isNaN(recipe.totalCost) || recipe.totalCost < 0) {
                errors.push(`Recipe "${recipe.name}" has invalid total cost`);
            }
            
            // CRITICAL FIX: Ensure recipe costs are base costs (not scaled)
            if (recipe.servingScale && recipe.servingScale !== 1) {
                console.warn(`Recipe "${recipe.name}" has serving scale ${recipe.servingScale} - resetting to base cost`);
                // Remove serving scale from saved recipes
                delete recipe.servingScale;
            }
        });
    }
    
    if (errors.length > 0) {
        console.warn('Data validation errors:', errors);
        // Auto-correct minor issues if possible
        return autoCorrectData(data, errors);
    }
    
    return data;
}

// ENHANCED: Auto-correct common data issues with serving scale fixes
function autoCorrectData(data, errors) {
    const correctedData = { ...data };
    
    // CRITICAL FIX: Ensure no serving scale contamination in saved data
    if (correctedData.currentRecipeState && correctedData.currentRecipeState.servingScale) {
        delete correctedData.currentRecipeState.servingScale;
    }
    
    // Auto-correct raw materials
    if (correctedData.rawMaterials) {
        correctedData.rawMaterials = correctedData.rawMaterials.map(material => ({
            ...material,
            costPerUnit: isNaN(material.costPerUnit) ? 0 : Math.max(0, material.costPerUnit),
            yieldPercentage: isNaN(material.yieldPercentage) ? 100 : Math.max(0.1, Math.min(100, material.yieldPercentage)),
            name: material.name || 'Unnamed Material'
        }));
    }
    
    // Auto-correct direct labor
    if (correctedData.directLabor) {
        correctedData.directLabor = correctedData.directLabor.map(labor => ({
            ...labor,
            costPerUnit: isNaN(labor.costPerUnit) ? 0 : Math.max(0, labor.costPerUnit),
            name: labor.name || 'Unnamed Labor'
        }));
    }
    
    // Auto-correct recipes with serving scale cleanup
    if (correctedData.recipes) {
        correctedData.recipes = correctedData.recipes.map(recipe => ({
            ...recipe,
            totalCost: isNaN(recipe.totalCost) ? 0 : Math.max(0, recipe.totalCost),
            name: recipe.name || 'Unnamed Recipe',
            servings: isNaN(recipe.servings) ? 1 : Math.max(1, recipe.servings),
            // CRITICAL: Remove serving scale from saved recipes
            servingScale: undefined
        }));
    }
    
    console.log('Auto-corrected data issues including serving scale contamination');
    return correctedData;
}

// ENHANCED: Enhanced error reporting for data issues
function reportDataIssues(issues) {
    if (issues.length > 0 && window.showNotification) {
        window.showNotification(
            `Found ${issues.length} data issues that were automatically corrected`,
            "warning"
        );
    }
}

// =============================================================================
// ENHANCED: Cloud Save Function
// PURPOSE: Separate cloud save logic for better error handling
// =============================================================================
async function saveToCloud(validatedData) {
    console.log("Saving user data to cloud for:", currentUser.email);
    const { data: result, error } = await supabase
        .from('user_data')
        .upsert({
            user_id: currentUser.id,
            data: validatedData,
            version: 3, // Yield-inclusive costs version
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'user_id'
        });
        
    if (error) throw error;
    
    console.log("✓ User data saved successfully to cloud");
    localStorage.removeItem(STORAGE_KEYS.OFFLINE_CHANGES); // Clear offline changes flag
}

// =============================================================================
// ENHANCED: Auth functions with better error handling and user-friendly messages
// =============================================================================
async function signUp(email, password) {
    if (!isOnline()) {
        return { success: false, error: "Cannot sign up while offline. Please check your internet connection." };
    }
    
    // Enhanced input validation
    if (!email || !password) {
        return { success: false, error: "Email and password are required" };
    }
    
    if (password.length < 6) {
        return { success: false, error: "Password must be at least 6 characters" };
    }
    
    console.log("Attempting sign up for:", email);
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email.trim().toLowerCase(),
            password: password,
        });
        
        if (error) {
            console.error("Sign up error:", error);
            // User-friendly error messages
            if (error.message.includes('User already registered')) {
                throw new Error("An account with this email already exists. Please sign in instead.");
            } else if (error.message.includes('Password should be at least 6 characters')) {
                throw new Error("Password must be at least 6 characters long.");
            } else if (error.message.includes('Invalid email')) {
                throw new Error("Please enter a valid email address.");
            } else {
                throw error;
            }
        }
        
        console.log("✓ Sign up successful for:", email);
        return { success: true, data };
    } catch (error) {
        console.error("✗ Sign up failed:", error);
        return { 
            success: false, 
            error: error.message || "An unexpected error occurred during sign up" 
        };
    }
}

async function signIn(email, password) {
    if (!isOnline()) {
        return { 
            success: false, 
            error: "Cannot sign in while offline. Please check your internet connection." 
        };
    }
    
    console.log("Attempting sign in for:", email);
    try {
        // Enhanced input validation
        if (!email || !password) {
            return { success: false, error: "Email and password are required" };
        }
        
        if (password.length < 6) {
            return { success: false, error: "Password must be at least 6 characters" };
        }
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password: password,
        });
        
        if (error) {
            console.error("Sign in error:", error);
            // User-friendly error messages
            if (error.message.includes('Invalid login credentials')) {
                throw new Error("Invalid email or password. Please try again.");
            } else if (error.message.includes('Email not confirmed')) {
                throw new Error("Please check your email to confirm your account before signing in.");
            } else {
                throw error;
            }
        }
        
        console.log("✓ Sign in successful for:", email);
        return { success: true, data };
    } catch (error) {
        console.error("✗ Sign in failed:", error);
        return { 
            success: false, 
            error: error.message || "An unexpected error occurred during sign in" 
        };
    }
}

async function signOut() {
    console.log("Attempting sign out");
    try {
        // Clear localStorage on sign out
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        localStorage.removeItem(STORAGE_KEYS.OFFLINE_CHANGES);
        
        if (isOnline()) {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        }
        
        console.log("✓ Sign out successful");
        return { success: true };
    } catch (error) {
        console.error("✗ Sign out failed:", error);
        return { success: false, error: error.message };
    }
}

// Reset Password Function with enhanced error handling
async function resetPassword(email) {
    if (!isOnline()) {
        return { success: false, error: "Cannot reset password while offline. Please check your internet connection." };
    }
    
    // Enhanced input validation
    if (!email) {
        return { success: false, error: "Email address is required" };
    }
    
    // Simple email validation
    if (!email.includes('@')) {
        return { success: false, error: "Please enter a valid email address" };
    }
    
    console.log("Attempting password reset for:", email);
    try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin,
        });
        
        if (error) {
            console.error("Password reset error:", error);
            // User-friendly error messages
            if (error.message.includes('user not found')) {
                throw new Error("No account found with this email address.");
            } else if (error.message.includes('rate limit')) {
                throw new Error("Too many reset attempts. Please try again in a few minutes.");
            } else {
                throw error;
            }
        }
        
        console.log("Password reset email sent to:", email);
        return { success: true, data };
    } catch (error) {
        console.error("Password reset failed:", error);
        return { 
            success: false, 
            error: error.message || "An unexpected error occurred while resetting password" 
        };
    }
}

// NEW: Handle password reset from URL
async function handlePasswordReset() {
    console.log("Checking for password reset tokens...");
    // Check if we have a recovery token in the URL
    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    const type = urlParams.get('type');
    
    if (type === 'recovery' && accessToken) {
        // We have a password reset token
        console.log('Password reset token detected');
        
        // Store the tokens for the reset process
        sessionStorage.setItem('reset_access_token', accessToken);
        if (refreshToken) {
            sessionStorage.setItem('reset_refresh_token', refreshToken);
        }
        
        // Clear the URL parameters
        window.location.hash = '';
        
        // Show the reset password modal
        if (window.showResetPasswordModal) {
            window.showResetPasswordModal();
        }
        
        return true;
    }
    
    return false;
}

// =============================================================================
// ENHANCED: Data storage with automatic cloud + local sync and validation
// =============================================================================
async function saveUserData(data) {
    try {
        // VALIDATE data before saving with serving scale contamination fix
        const validatedData = validateUserData(data);
        if (!validatedData) {
            throw new Error("Data validation failed");
        }

        // CRITICAL FIX: Ensure no serving scale contamination in saved recipes
        if (validatedData.recipes && Array.isArray(validatedData.recipes)) {
            validatedData.recipes = validatedData.recipes.map(recipe => {
                // Remove serving scale from all saved recipes
                const { servingScale, ...cleanRecipe } = recipe;
                return cleanRecipe;
            });
        }

        // ALWAYS save to localStorage immediately (offline first)
        const localSaveSuccess = saveToLocalStorage(validatedData);
        
        if (!localSaveSuccess) {
            throw new Error("Local storage save failed");
        }

        // If not authenticated or offline, just use localStorage
        if (!currentUser || !isOnline()) {
            const status = !currentUser ? "not authenticated" : "offline";
            console.log(`Data saved locally (${status})`);
            
            if (!isOnline() && currentUser) {
                // Track that we have pending changes for when we come back online
                localStorage.setItem(STORAGE_KEYS.OFFLINE_CHANGES, 'true');
            }
            
            return { success: true, source: 'local' };
        }

        // If online and authenticated, also save to cloud
        try {
            await saveToCloud(validatedData);
            console.log("✓ User data saved successfully to cloud");
            return { success: true, source: 'cloud' };
        } catch (cloudError) {
            console.warn("Cloud save failed, data stored locally:", cloudError);
            return { success: localSaveSuccess, source: 'local', error: cloudError.message };
        }
    } catch (error) {
        console.error("Data save failed:", error);
        return { success: false, error: error.message };
    }
}

// =============================================================================
// ENHANCED: Load user data with smart priority and validation
// PURPOSE: Try cloud first, then localStorage, then default data with validation
// =============================================================================
async function loadUserData() {
    // Priority 1: Try cloud if online and authenticated
    if (currentUser && isOnline()) {
        console.log("Loading user data from cloud for:", currentUser.email);
        try {
            const { data: result, error } = await supabase
                .from('user_data')
                .select('data, version')
                .eq('user_id', currentUser.id)
                .single();
                
            if (error && error.code !== 'PGRST116') throw error;
            
            if (result && result.data) {
                console.log("✓ Cloud data loaded successfully");
                
                // Validate cloud data before using (includes serving scale cleanup)
                const validatedData = validateUserData(result.data);
                
                // Apply yield-inclusive cost calculation to existing data
                const updatedData = applyYieldInclusiveCosts(validatedData);
                
                // Save updated data back
                await saveUserData(updatedData);
                
                return updatedData;
            }
        } catch (error) {
            console.error("✗ Cloud load failed, trying local storage:", error);
        }
    }
    
    // Priority 2: Try localStorage with validation
    const localData = loadFromLocalStorage();
    if (localData) {
        console.log("✓ Using localStorage data");
        
        // Validate local data (includes serving scale cleanup)
        const validatedData = validateUserData(localData);
        
        // Apply yield-inclusive cost calculation to local data
        const updatedData = applyYieldInclusiveCosts(validatedData);
        
        // If we're online and authenticated, sync the updated data
        if (currentUser && isOnline()) {
            setTimeout(() => saveUserData(updatedData), 500);
        }
        
        return updatedData;
    }
    
    // Priority 3: Return default data
    console.log("No data found, returning default structure");
    return getDefaultData();
}

// =============================================================================
// NEW: Apply Yield-Inclusive Costs to Existing Data
// PURPOSE: Convert all raw material costs to include yield automatically
// =============================================================================
function applyYieldInclusiveCosts(data) {
    console.log("Applying yield-inclusive costs to data...");
    
    if (!data.rawMaterials || data.dataVersion === 3) {
        return data; // Already processed or no raw materials
    }
    
    const updatedData = { ...data };
    
    // Update each raw material to have yield-inclusive costs
    updatedData.rawMaterials = updatedData.rawMaterials.map(material => {
        const yieldPercentage = material.yieldPercentage || 100;
        
        if (yieldPercentage !== 100) {
            // Apply yield to cost: cost = base_cost × (100 / yield)
            const yieldFactor = 100 / yieldPercentage;
            material.costPerUnit = parseFloat((material.costPerUnit * yieldFactor).toFixed(6));
            console.log(`✓ ${material.name}: ${yieldPercentage}% yield → ${material.costPerUnit.toFixed(4)}/${material.costUnit}`);
        }
        
        return material;
    });
    
    // Mark as processed
    updatedData.dataVersion = 3;
    console.log("✓ Yield-inclusive costs applied successfully");
    
    return updatedData;
}

// =============================================================================
// NEW: Network Status Monitoring
// PURPOSE: Show user when offline/online and handle sync
// =============================================================================
function setupNetworkMonitoring() {
    // Listen for online/offline events
    window.addEventListener('online', async () => {
        console.log("✓ App is online");
        
        // Show notification to user
        if (window.showNotification) {
            window.showNotification("Connection restored - data will sync to cloud", "success");
        }
        
        // If we have pending changes and are authenticated, sync now
        if (currentUser && localStorage.getItem(STORAGE_KEYS.OFFLINE_CHANGES) === 'true') {
            console.log("Syncing offline changes to cloud...");
            const localData = loadFromLocalStorage();
            if (localData) {
                await saveUserData(localData);
            }
        }
    });
    
    window.addEventListener('offline', () => {
        console.log("✗ App is offline");
        
        // Show notification to user
        if (window.showNotification) {
            window.showNotification("You are offline - data saved locally", "warning");
        }
    });
}

// Default data structure
function getDefaultData() {
    return {
        rawMaterials: [],
        directLabor: [],
        recipes: [],
        currency: "₱",
        currentRecipeState: null,
        dataVersion: 3 // Yield-inclusive costs version
    };
}

// Check current auth state
async function checkAuthState() {
    console.log("Checking auth state...");
    try {
        const { data: { session } } = await supabase.auth.getSession();
        currentUser = session?.user || null;
        console.log(currentUser ? `✓ Logged in as ${currentUser.email}` : "Not logged in");
        updateAuthUI();
        return currentUser;
    } catch (error) {
        console.error("Error checking auth state:", error);
        currentUser = null;
        updateAuthUI();
        return null;
    }
}

// Update UI based on auth state
function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    const userInfo = document.getElementById('userInfo');
    const userEmail = document.getElementById('userEmail');
    
    if (currentUser) {
        if (authButtons) authButtons.classList.add('hidden');
        if (userInfo) userInfo.classList.remove('hidden');
        if (userEmail) userEmail.textContent = currentUser.email;
    } else {
        if (authButtons) authButtons.classList.remove('hidden');
        if (userInfo) userInfo.classList.add('hidden');
    }
}

// =============================================================================
// ENHANCED: Auth System Initialization with Race Condition Fix
// PURPOSE: Prevent timing issues in auth initialization
// =============================================================================
async function initializeAuthSystem(maxRetries = 3, retryDelay = 500) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Initializing auth system (attempt ${attempt}/${maxRetries})...`);
            
            // Check if Supabase client is ready
            if (!window.supabase || !window.supabaseClient) {
                console.warn(`Supabase client not ready, retrying in ${retryDelay}ms...`);
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                    continue;
                } else {
                    throw new Error("Supabase client failed to initialize after retries");
                }
            }
            
            // Setup network monitoring
            setupNetworkMonitoring();
            
            // Check current auth state
            await checkAuthState();
            
            // Check for password reset tokens
            await handlePasswordReset();
            
            // Listen for auth changes
            supabase.auth.onAuthStateChange((event, session) => {
                console.log("Auth state changed:", event);
                currentUser = session?.user || null;
                updateAuthUI();
                
                if (event === 'PASSWORD_RECOVERY') {
                    console.log('Password recovery event detected');
                    if (window.showResetPasswordModal) {
                        window.showResetPasswordModal();
                    }
                }
                
                // Auto-sync data when user signs in
                if (event === 'SIGNED_IN' && window.loadAppData) {
                    console.log("User signed in, loading app data...");
                    setTimeout(() => window.loadAppData(), 1000);
                }
            });
            
            console.log("✓ Auth system initialized successfully");
            return true;
            
        } catch (error) {
            console.error(`✗ Auth initialization attempt ${attempt} failed:`, error);
            
            if (attempt === maxRetries) {
                console.error("Auth system initialization failed after all retries, continuing in local mode");
                // Continue without auth - app should work locally
                currentUser = null;
                updateAuthUI();
                return false;
            }
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
    }
}

// =============================================================================
// INITIALIZATION: Enhanced setup with better error handling
// =============================================================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Initializing Supabase client...");
    
    try {
        // Initialize auth system with retry logic
        await initializeAuthSystem();
        
        console.log("✓ Supabase initialization completed");
    } catch (error) {
        console.error("✗ Supabase initialization failed:", error);
        // Continue without auth - app should work locally
        currentUser = null;
        updateAuthUI();
    }
});

// Export for use in other files
window.supabaseClient = {
    supabase,
    signUp,
    signIn,
    signOut,
    resetPassword,
    handlePasswordReset,
    checkAuthState,
    saveUserData,
    loadUserData,
    isOnline,
    getCurrentUser: () => currentUser,
    validateUserData, // Export validation functions
    autoCorrectData,
    initializeAuthSystem // NEW: Export enhanced auth initialization
};

console.log("✓ Supabase client exported successfully");