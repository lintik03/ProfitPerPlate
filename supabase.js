// supabase.js - Supabase configuration and functions

// Initialize Supabase client
const SUPABASE_URL = 'https://nlpuyubpmexdqqyfjlcs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5scHV5dWJwbWV4ZHFxeWZqbGNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NTcwMzgsImV4cCI6MjA3ODIzMzAzOH0.aD4E1vVUNfOpDAWvKETpaXw9V0PkUPnpTLZpgBsN3Nc';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Auth functions
class SupabaseAuth {
  // Sign up with email and password
  static async signUp(email, password) {
    try {
      const { user, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      return { success: true, user };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message };
    }
  }

  // Sign in with email and password
  static async signIn(email, password) {
    try {
      const { user, error } = await supabase.auth.signIn({
        email,
        password,
      });
      
      if (error) throw error;
      return { success: true, user };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    }
  }

  // Sign out
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get current user
  static getCurrentUser() {
    return supabase.auth.user();
  }

  // Auth state change listener
  static onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

// Data synchronization functions
class SupabaseSync {
  // Save user profiles to Supabase
  static async saveProfiles(profiles, currentProfile) {
    const user = SupabaseAuth.getCurrentUser();
    
    if (!user) {
      // Fallback to localStorage if not authenticated
      localStorage.setItem("profitPerPlate_profiles", JSON.stringify({
        profiles: profiles,
        currentProfile: currentProfile
      }));
      return { success: true, source: 'local' };
    }

    try {
      const profileData = {
        profiles: profiles,
        currentProfile: currentProfile,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          profile_data: profileData,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Also save to localStorage as backup
      localStorage.setItem("profitPerPlate_profiles", JSON.stringify({
        profiles: profiles,
        currentProfile: currentProfile
      }));

      return { success: true, source: 'cloud' };
    } catch (error) {
      console.error('Save profiles error:', error);
      // Fallback to localStorage
      localStorage.setItem("profitPerPlate_profiles", JSON.stringify({
        profiles: profiles,
        currentProfile: currentProfile
      }));
      return { success: false, error: error.message, source: 'local' };
    }
  }

  // Load user profiles from Supabase
  static async loadProfiles() {
    const user = SupabaseAuth.getCurrentUser();
    
    if (!user) {
      // Load from localStorage if not authenticated
      return this.loadFromLocalStorage();
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('profile_data')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
      
      if (data && data.profile_data) {
        // Also update localStorage
        localStorage.setItem("profitPerPlate_profiles", JSON.stringify({
          profiles: data.profile_data.profiles,
          currentProfile: data.profile_data.currentProfile
        }));
        
        return {
          profiles: data.profile_data.profiles,
          currentProfile: data.profile_data.currentProfile,
          source: 'cloud'
        };
      } else {
        // No cloud data, try localStorage
        return this.loadFromLocalStorage();
      }
    } catch (error) {
      console.error('Load profiles error:', error);
      return this.loadFromLocalStorage();
    }
  }

  // Load from localStorage
  static loadFromLocalStorage() {
    const savedProfiles = localStorage.getItem("profitPerPlate_profiles");
    if (savedProfiles) {
      const data = JSON.parse(savedProfiles);
      return {
        profiles: data.profiles,
        currentProfile: data.currentProfile,
        source: 'local'
      };
    }
    
    // Return default if nothing exists
    return {
      profiles: {
        "Default": {
          rawMaterials: [],
          directLabor: [],
          recipes: [],
          currency: "₱"
        }
      },
      currentProfile: "Default",
      source: 'default'
    };
  }
}

// Export for use in other files
window.SupabaseAuth = SupabaseAuth;
window.SupabaseSync = SupabaseSync;
window.supabase = supabase;