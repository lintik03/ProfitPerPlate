// Supabase Configuration
const SUPABASE_URL = 'https://nlpuyubpmexdqqyfjlcs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5scHV5dWJwbWV4ZHFxeWZqbGNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NTcwMzgsImV4cCI6MjA3ODIzMzAzOH0.aD4E1vVUNfOpDAWvKETpaXw9V0PkUPnpTLZpgBsN3Nc'; // Replace with your Supabase anon key

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
        authButtons.classList.add('hidden');
        userInfo.classList.remove('hidden');
        userEmail.textContent = currentUser.email;
        
        // Load user data
        loadUserData();
    } else {
        authButtons.classList.remove('hidden');
        userInfo.classList.add('hidden');
        
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
            
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
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
    userData = getDefaultData();
    renderAllData();
}

// Initialize auth state on page load
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuthState();
    
    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
        currentUser = session?.user || null;
        updateAuthUI();
    });
});

// Export for use in other files
window.supabaseClient = {
    supabase,
    signUp,
    signIn,
    signOut,
    checkAuthState,
    saveUserData,
    loadUserData,
    getCurrentUser: () => currentUser
};