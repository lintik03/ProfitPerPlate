// =============================================================================
// ENVIRONMENT-AWARE SUPABASE CONFIGURATION
// =============================================================================

// CROSS-DOMAIN MIGRATION HANDLING
// This handles the transition from profitperplate.pages.dev to profitperplate.com
(function clearCrossDomainData() {
  try {
    const currentDomain = window.location.hostname;
    const lastDomain = localStorage.getItem('profitperplate_last_domain');
    
    // If domain changed and we have data, clear auth data to avoid CORS issues
    if (lastDomain && lastDomain !== currentDomain) {
      console.log(`🔄 Domain changed from ${lastDomain} to ${currentDomain}. Clearing auth data.`);
      
      // Clear Supabase auth tokens from localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.includes('supabase') || key.includes('auth-token') || key.includes('-auth-')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        console.log(`🗑️ Removing: ${key}`);
        localStorage.removeItem(key);
      });
      
      // Clear all Supabase-related cookies
      document.cookie.split(";").forEach(c => {
        const cookie = c.trim();
        if (cookie.startsWith('sb-') || cookie.includes('supabase')) {
          const cookieName = cookie.split('=')[0];
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${lastDomain}`;
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${currentDomain}`;
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
        }
      });
    }
    
    // Store current domain for next visit
    localStorage.setItem('profitperplate_last_domain', currentDomain);
  } catch (error) {
    console.warn('⚠️ Could not clear cross-domain data:', error);
  }
})();

// ENVIRONMENT DETECTION AND CONFIGURATION
const getSupabaseConfig = () => {
  const hostname = window.location.hostname;
  const origin = window.location.origin;
  
  console.log(`🌍 Environment detected: ${hostname}`);
  
  // Your Supabase credentials (same for all environments)
  const baseConfig = {
    url: 'https://mrtvmoxhtmpbptkvklfj.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ydHZtb3hodG1wYnB0a3ZrbGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NTY1MjUsImV4cCI6MjA3OTAzMjUyNX0.9cwIXYvQqYn-x0nR9RIh0N1xWvVxIPpXlJYZ-BsXU_E'
  };
  
  // Configure site URL based on domain
  let siteUrl;
  
  if (hostname === 'profitperplate.com' || hostname === 'www.profitperplate.com') {
    siteUrl = 'https://profitperplate.com';
    console.log('✅ Using production configuration for profitperplate.com');
  } 
  else if (hostname === 'profitperplate.pages.dev') {
    siteUrl = 'https://profitperplate.pages.dev';
    console.log('⚠️ Using legacy .pages.dev configuration');
  }
  else if (hostname === 'localhost' || hostname === '127.0.0.1') {
    siteUrl = origin;
    console.log('🔧 Using local development configuration');
  }
  else {
    siteUrl = origin;
    console.warn('⚠️ Unknown domain, using current origin as site URL');
  }
  
  return {
    ...baseConfig,
    siteUrl: siteUrl,
    hostname: hostname
  };
};

const config = getSupabaseConfig();
const SUPABASE_URL = config.url;
const SUPABASE_ANON_KEY = config.key;
const SITE_URL = config.siteUrl;
const CURRENT_HOSTNAME = config.hostname;

// =============================================================================
// CORS DEBUGGING UTILITIES
// =============================================================================

window.debugSupabaseCORS = function() {
  console.log('=== SUPABASE CORS DEBUG ===');
  console.log('Current hostname:', CURRENT_HOSTNAME);
  console.log('Current origin:', window.location.origin);
  console.log('SITE_URL (for redirects):', SITE_URL);
  console.log('Supabase URL:', SUPABASE_URL);
  
  // Check localStorage for auth tokens
  console.log('📦 LocalStorage auth tokens:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.includes('supabase') || key.includes('auth')) {
      const value = localStorage.getItem(key);
      console.log(`  ${key}:`, value ? 'Present' : 'Empty');
    }
  }
  
  // Test Supabase connection
  console.log('🔌 Testing Supabase connection...');
  fetch('https://mrtvmoxhtmpbptkvklfj.supabase.co/auth/v1/settings', {
    method: 'GET',
    mode: 'cors'
  })
  .then(response => {
    console.log('✅ Supabase server reachable');
    console.log('📡 Response status:', response.status);
    
    // Check CORS headers
    const corsOrigin = response.headers.get('access-control-allow-origin');
    const corsMethods = response.headers.get('access-control-allow-methods');
    const corsHeaders = response.headers.get('access-control-allow-headers');
    
    console.log('🔗 CORS Headers:');
    console.log('  - Allow-Origin:', corsOrigin);
    console.log('  - Allow-Methods:', corsMethods);
    console.log('  - Allow-Headers:', corsHeaders);
    
    if (!corsOrigin || corsOrigin === '*') {
      console.log('⚠️ CORS is open (*) or not set');
    } else if (corsOrigin.includes(CURRENT_HOSTNAME)) {
      console.log('✅ CORS allows current domain');
    } else {
      console.log('❌ CORS may not allow current domain');
    }
  })
  .catch(error => {
    console.error('❌ Cannot reach Supabase:', error.message);
    console.log('💡 Try checking:');
    console.log('   1. Network connection');
    console.log('   2. Ad blockers');
    console.log('   3. Browser extensions');
  });
  
  console.log('=== END DEBUG ===');
};

// Auto-run debug on page load in development
if (CURRENT_HOSTNAME.includes('localhost') || CURRENT_HOSTNAME.includes('pages.dev')) {
  setTimeout(() => {
    console.log('🔄 Auto-running CORS debug...');
    window.debugSupabaseCORS();
  }, 2000);
}

// =============================================================================
// SUPABASE CLIENT INITIALIZATION
// =============================================================================

let pppClient;
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

// Enhanced Supabase initialization with CORS handling
(async function initializeSupabase() {
    try {
        if (!window.supabase) {
            console.error("❌ Supabase library not loaded!");
            console.error("Please ensure supabase.js is loaded before this script.");
            console.error("Add to HTML: <script src='https://unpkg.com/@supabase/supabase-js@2'></script>");
            
            // Try to load Supabase dynamically as fallback
            await loadSupabaseScript();
        }
        
        console.log(`🚀 Initializing Supabase client for ${CURRENT_HOSTNAME}...`);
        
        // Create Supabase client with environment-specific configuration
        pppClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                storage: window.localStorage,
                storageKey: `sb-${new URL(SUPABASE_URL).hostname}-auth-token`,
                flowType: 'pkce',
                debug: CURRENT_HOSTNAME.includes('localhost') // Debug only in dev
            },
            global: {
                headers: {
                    'X-Client-Info': `profitperplate-web/${CURRENT_HOSTNAME}`
                }
            }
        });
        
        // Test the connection
        const { data, error } = await pppClient.auth.getSession();
        
        if (error) {
            console.error("❌ Supabase connection test failed:", error);
            
            if (error.message.includes('CORS') || error.message.includes('Network')) {
                console.error("🔗 CORS/Network issue detected!");
                console.error("Please add to Supabase CORS settings:");
                console.error("1. https://profitperplate.com");
                console.error("2. https://www.profitperplate.com");
                console.error("3. https://profitperplate.pages.dev");
                
                // Show user-friendly message
                if (window.showNotification) {
                    window.showNotification("⚠️ Connection issue. Try refreshing the page.", "warning");
                }
            }
            
            // Fallback to offline mode
            pppClient = createFallbackClient();
            supabaseReady = false;
        } else {
            console.log("✅ Supabase initialized successfully");
            supabaseReady = true;
            currentUser = data.session?.user || null;
            
            if (currentUser) {
                console.log(`👤 User: ${currentUser.email}`);
            }
            
            // 🟢 Set up auth state listener immediately
            setupAuthStateListener();
        }
        
    } catch (error) {
        console.error("💥 Supabase initialization crashed:", error);
        pppClient = createFallbackClient();
        supabaseReady = false;
        
        // Show user-friendly error
        if (window.showNotification) {
            window.showNotification("⚠️ Service temporarily unavailable. Working offline.", "warning");
        }
    }
})();

// Dynamic Supabase script loader (fallback)
async function loadSupabaseScript() {
    return new Promise((resolve, reject) => {
        if (window.supabase) {
            resolve();
            return;
        }
        
        console.log("📦 Loading Supabase script dynamically...");
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.min.js';
        script.onload = () => {
            console.log("✅ Supabase script loaded dynamically");
            resolve();
        };
        script.onerror = () => {
            console.error("❌ Failed to load Supabase script");
            reject(new Error("Failed to load Supabase"));
        };
        document.head.appendChild(script);
    });
}

// Offline fallback client
function createFallbackClient() {
    console.log("📴 Creating offline fallback client");
    return {
        auth: {
            signUp: () => ({ data: null, error: new Error("Device is Offline") }),
            signIn: () => ({ data: null, error: new Error("Device is Offline") }),
            signOut: () => ({ error: new Error("Device is Offline") }),
            resetPasswordForEmail: () => ({ data: null, error: new Error("Device is Offline") }),
            getSession: () => ({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            updateUser: () => ({ data: null, error: new Error("Device is Offline") })
        },
        from: () => ({
            upsert: () => ({ data: null, error: new Error("Device is Offline") }),
            select: () => ({ data: null, error: new Error("Device is Offline") }),
            insert: () => ({ data: null, error: new Error("Device is Offline") }),
            update: () => ({ data: null, error: new Error("Device is Offline") }),
            delete: () => ({ data: null, error: new Error("Device is Offline") })
        })
    };
}

// =============================================================================
// ENHANCED AUTH FUNCTIONS WITH DOMAIN-AWARE REDIRECTS
// =============================================================================

async function signUp(email, password) {
    if (!supabaseReady) {
        return { success: false, error: "Authentication service unavailable" };
    }
    
    console.log(`📝 Sign up attempt from ${CURRENT_HOSTNAME}`);
    
    try {
        const { data, error } = await pppClient.auth.signUp({
            email: email,
            password: password,
            options: { 
                emailRedirectTo: SITE_URL  // Use environment-specific URL
            }
        });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error("❌ Sign up error:", error);
        return { success: false, error: error.message };
    }
}

async function signIn(email, password) {
    if (!supabaseReady) {
        return { success: false, error: "Authentication service unavailable" };
    }
    
    try {
        const { data, error } = await pppClient.auth.signInWithPassword({
            email: email,
            password: password,
        });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error("❌ Sign in error:", error);
        return { success: false, error: error.message };
    }
}

async function signOut() {
    if (!supabaseReady) {
        return { success: false, error: "Authentication service unavailable" };
    }
    
    try {
        console.log("🚪 Logging out...");
        const { error } = await pppClient.auth.signOut();
        if (error) throw error;
        
        // Clear domain-specific data
        clearAuthData();
        
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
        const { data, error } = await pppClient.auth.resetPasswordForEmail(email, {
            redirectTo: SITE_URL,  // Use environment-specific URL
        });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error("❌ Password reset error:", error);
        return { success: false, error: error.message };
    }
}

function clearAuthData() {
    // Clear all Supabase-related localStorage items
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.includes('supabase') || key.includes('auth')) {
            keys.push(key);
        }
    }
    
    keys.forEach(key => localStorage.removeItem(key));
    console.log(`🗑️ Cleared ${keys.length} auth items`);
}

// =============================================================================
// AUTH STATE MANAGEMENT (REST OF YOUR EXISTING CODE)
// =============================================================================

// [Keep all your existing functions below, but update them to use the new variables]
// The rest of your file remains largely the same, but use:
// - pppClient instead of direct supabase reference
// - SITE_URL for redirects
// - CURRENT_HOSTNAME for logging

async function checkAuthState() {
    console.log("🔍 Checking auth state...");
    
    if (!supabaseReady) {
        console.warn("Supabase not ready");
        currentUser = null;
        updateAuthUI();
        return null;
    }
    
    try {
        const { data: { session } } = await pppClient.auth.getSession();
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

function setupAuthStateListener() {
    if (!supabaseReady) {
        console.warn("Supabase not ready - cannot set up auth state listener");
        return;
    }
    
    console.log("🎧 Setting up auth state listener...");
    
    const { data: { subscription } } = pppClient.auth.onAuthStateChange(async (event, session) => {
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
// PASSWORD RESET HANDLING (Keep your existing functions)
// =============================================================================

function checkForResetTokenInURL() {
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
// DATA MANAGEMENT FUNCTIONS (Keep your existing functions)
// =============================================================================

// [Include all your existing data management functions here exactly as they were]
// They will automatically use the updated pppClient variable

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
            savedBy: currentUser ? currentUser.email : 'anonymous',
            savedFromDomain: CURRENT_HOSTNAME
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

async function saveToCloud(payload) {
    if (!currentUser || !supabaseReady) {
        return { success: false, error: "Not authenticated or Supabase not ready" };
    }
    
    try {
        console.log("💾 MANUAL CLOUD SAVE: Starting cloud save operation...");
        const { data, error } = await pppClient
            .from('user_data')
            .upsert({
                user_id: currentUser.id,
                data: payload,
                data_version: payload.dataVersion,
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

async function syncFromCloud() {
    if (!currentUser || !supabaseReady) {
        return { success: false, error: "Not available" };
    }
    
    try {
        console.log("🔄 MANUAL CLOUD SYNC: Triggering cloud sync...");
        const { data, error } = await pppClient
            .from('user_data')
            .select('data, data_version, updated_at')
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
        console.error("❌ Cloud sync failed:", error);
        return { 
            success: false, 
            error: error.message
        };
    }
}

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
// INITIALIZATION AND DOM READY
// =============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 Initializing authentication...");
    
    try {
        // Already initialized, just check auth state
        await checkAuthState();
        
        // Check for password reset
        console.log("🔄 Running password reset check...");
        const resetHandled = await handlePasswordResetDirect();
        
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
// EXPORT - COMPATIBLE WITH EXISTING CODE
// =============================================================================

window.supabaseClient = {
    supabase: pppClient,
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
    debugCORS: window.debugSupabaseCORS,
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

console.log("✅ Enhanced Supabase client loaded for:", CURRENT_HOSTNAME);
console.log("🔧 Debug available: window.supabaseClient.debugCORS()");