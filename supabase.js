// Supabase Configuration
const SUPABASE_URL = 'https://nlpuyubpmexdqqyfjlcs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5scHV5dWJwbWV4ZHFxeWZqbGNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NTcwMzgsImV4cCI6MjA3ODIzMzAzOH0.aD4E1vVUNfOpDAWvKETpaXw9V0PkUPnpTLZpgBsN3Nc';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Auth state management
let currentUser = null;

// Auth functions
async function signUp(email, password) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
        });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function signIn(email, password) {
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
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Reset Password Function
async function resetPassword(email) {
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

// NEW: Handle password reset from URL
async function handlePasswordReset() {
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

// Check current auth state
async function checkAuthState() {
    const { data: { session } } = await supabase.auth.getSession();
    currentUser = session?.user || null;
    updateAuthUI();
    return currentUser;
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
        
        // Load user data
        loadUserData();
    } else {
        if (authButtons) authButtons.classList.remove('hidden');
        if (userInfo) userInfo.classList.add('hidden');
        
        // Clear data when logged out
        clearLocalData();
    }
}

// Data storage functions
async function saveUserData(data) {
    if (!currentUser) return { success: false, error: 'Not authenticated' };
    
    try {
        const { data: result, error } = await supabase
            .from('user_data')
            .upsert({
                user_id: currentUser.id,
                data: data,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            });
            
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error saving data:', error);
        return { success: false, error: error.message };
    }
}

async function loadUserData() {
    if (!currentUser) return null;
    
    try {
        const { data, error } = await supabase
            .from('user_data')
            .select('data')
            .eq('user_id', currentUser.id)
            .single();
            
        if (error) {
            if (error.code === 'PGRST116') { // "not found" error code
                return getDefaultData();
            }
            throw error;
        }
        return data?.data || getDefaultData();
    } catch (error) {
        console.error('Error loading data:', error);
        return getDefaultData();
    }
}

function getDefaultData() {
    return {
        rawMaterials: [],
        directLabor: [],
        recipes: [],
        currency: "₱",
        currentRecipeState: null
    };
}

function clearLocalData() {
    // Clear all local data when user logs out
    if (window.userData) {
        window.userData = getDefaultData();
    }
    if (window.renderAllData) {
        window.renderAllData();
    }
}

// Initialize auth state on page load
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuthState();
    
    // Check for password reset tokens on page load
    await handlePasswordReset();
    
    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
        currentUser = session?.user || null;
        updateAuthUI();
        
        // NEW: Handle password recovery event
        if (event === 'PASSWORD_RECOVERY') {
            console.log('Password recovery event detected');
            if (window.showResetPasswordModal) {
                window.showResetPasswordModal();
            }
        }
    });
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
    getCurrentUser: () => currentUser
};