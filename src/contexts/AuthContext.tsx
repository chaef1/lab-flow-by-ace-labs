
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Extended user profile type that includes the role
interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'creator' | 'brand' | 'agency' | 'influencer';
}

// Define the type for the profile data structure when updating in Supabase
type ProfileUpdateData = {
  id?: string;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  role?: 'admin' | 'creator' | 'brand' | 'agency' | 'influencer';
  updated_at?: string;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: { first_name?: string; last_name?: string; role?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: () => boolean;
  isCreator: () => boolean;
  isBrand: () => boolean;
  isAgency: () => boolean;
  isInfluencer: () => boolean;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile data from the profiles table with retry logic
  const fetchUserProfile = async (userId: string, retryCount = 0): Promise<UserProfile | null> => {
    try {
      console.log(`AuthContext - Fetching user profile for: ${userId} (attempt ${retryCount + 1})`);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, role')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('AuthContext - Error fetching user profile:', error);
        
        // If profile not found and it's an @acelabs.co.za user, wait and retry
        if (error.code === 'PGRST116' && retryCount < 3) {
          const userEmail = user?.email;
          if (userEmail && userEmail.includes('@acelabs.co.za')) {
            console.log('AuthContext - Profile not found for acelabs user, retrying...');
            // Wait a bit for the trigger to create the profile
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchUserProfile(userId, retryCount + 1);
          }
        }
        return null;
      }
      
      console.log('AuthContext - User profile fetched successfully:', data);
      return data as UserProfile;
    } catch (error) {
      console.error('AuthContext - Unexpected error fetching user profile:', error);
      return null;
    }
  };

  // Create profile manually if it doesn't exist (fallback)
  const createProfileIfNeeded = async (user: User): Promise<UserProfile | null> => {
    try {
      console.log('AuthContext - Creating profile for user:', user.email);
      
      // Determine role based on email
      const role = user.email?.includes('@acelabs.co.za') ? 'admin' : 'brand';
      
      const profileData = {
        id: user.id,
        first_name: user.user_metadata?.first_name || user.email?.split('@')[0] || '',
        last_name: user.user_metadata?.last_name || '',
        avatar_url: user.user_metadata?.avatar_url || null,
        role: role as 'admin' | 'creator' | 'brand' | 'agency' | 'influencer'
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error('AuthContext - Error creating profile:', error);
        return null;
      }

      console.log('AuthContext - Profile created successfully:', data);
      return data as UserProfile;
    } catch (error) {
      console.error('AuthContext - Error in createProfileIfNeeded:', error);
      return null;
    }
  };

  // Handle user profile setup
  const handleUserProfileSetup = async (user: User) => {
    if (!user) return;

    try {
      // First try to fetch existing profile
      let profile = await fetchUserProfile(user.id);
      
      // If no profile exists, try to create one
      if (!profile) {
        console.log('AuthContext - No profile found, creating one...');
        profile = await createProfileIfNeeded(user);
      }
      
      // If we have a profile, ensure @acelabs.co.za users are admin
      if (profile && user.email?.includes('@acelabs.co.za') && profile.role !== 'admin') {
        console.log('AuthContext - Updating acelabs user to admin role');
        const { data: updatedProfile, error } = await supabase
          .from('profiles')
          .update({ role: 'admin', updated_at: new Date().toISOString() })
          .eq('id', user.id)
          .select()
          .single();

        if (!error && updatedProfile) {
          profile = updatedProfile as UserProfile;
        }
      }

      setUserProfile(profile);
    } catch (error) {
      console.error('AuthContext - Error in handleUserProfileSetup:', error);
    }
  };

  useEffect(() => {
    console.log('AuthContext - Initializing...');
    let mounted = true;
    
    const initAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthContext - Error getting session:', error);
          return;
        }

        console.log('AuthContext - Initial session check:', initialSession?.user?.email || 'No session');
        
        if (!mounted) return;

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          
          // Handle profile setup
          await handleUserProfileSetup(initialSession.user);
        }
      } catch (error) {
        console.error('AuthContext - Init error:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('AuthContext - Auth state change:', event, newSession?.user?.email || 'No user');
        
        if (!mounted) return;
        
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          // Handle profile setup for authenticated user
          await handleUserProfileSetup(newSession.user);
        } else {
          setUserProfile(null);
        }
      }
    );

    // Initialize
    initAuth();

    return () => {
      console.log('AuthContext - Cleanup');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('AuthContext - Signing in:', email);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('AuthContext - Sign in error:', error);
        toast.error(error.message);
        throw error;
      }
      
      toast.success('Signed in successfully');
    } catch (error) {
      console.error('AuthContext - Error signing in:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, userData: { first_name?: string; last_name?: string; role?: string }) => {
    try {
      console.log('AuthContext - Signing up:', email);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        console.error('AuthContext - Sign up error:', error);
        toast.error(error.message);
        throw error;
      }
      
      toast.success('Account created successfully. You can now sign in.');
    } catch (error) {
      console.error('AuthContext - Error signing up:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('AuthContext - Signing out');
      await supabase.auth.signOut();
      setUserProfile(null);
      toast.info('Signed out');
    } catch (error) {
      console.error('AuthContext - Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user || !userProfile) return;
    try {
      console.log('AuthContext - Updating profile');
      
      // Create a properly typed update object
      const updateData: ProfileUpdateData = {
        ...data,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Update the local state
      setUserProfile({
        ...userProfile,
        ...data
      });
      
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('AuthContext - Error updating profile:', error);
      toast.error(`Failed to update profile: ${error.message}`);
      throw error;
    }
  };

  // Helper functions to check user roles
  const isAdmin = () => userProfile?.role === 'admin';
  const isCreator = () => userProfile?.role === 'creator';
  const isBrand = () => userProfile?.role === 'brand';
  const isAgency = () => userProfile?.role === 'agency';
  const isInfluencer = () => userProfile?.role === 'influencer';

  console.log('AuthContext - Current state:', {
    user: user?.email || 'No user',
    profile: userProfile?.role || 'No profile',
    isLoading
  });

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      userProfile,
      isLoading, 
      signIn, 
      signUp, 
      signOut,
      isAdmin,
      isCreator,
      isBrand,
      isAgency,
      isInfluencer,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
