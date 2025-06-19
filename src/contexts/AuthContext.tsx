
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

  // Fetch user profile data from the profiles table
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log('AuthContext - Fetching user profile for:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, role')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('AuthContext - Error fetching user profile:', error);
        if (error.code === 'PGRST116') {
          console.log('AuthContext - Profile not found, will be created by trigger');
          return null;
        }
        return null;
      }
      
      console.log('AuthContext - User profile fetched:', data);
      return data as UserProfile;
    } catch (error) {
      console.error('AuthContext - Unexpected error fetching user profile:', error);
      return null;
    }
  };

  useEffect(() => {
    console.log('AuthContext - Starting initialization');
    let mounted = true;
    
    const initAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthContext - Error getting session:', error);
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }

        console.log('AuthContext - Initial session:', initialSession?.user?.email || 'No session');
        
        if (!mounted) return;

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          
          // Try to fetch profile, but don't block on it
          try {
            const profile = await fetchUserProfile(initialSession.user.id);
            if (mounted && profile) {
              setUserProfile(profile);
            }
          } catch (profileError) {
            console.error('AuthContext - Profile fetch failed:', profileError);
          }
        }
        
        if (mounted) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('AuthContext - Init error:', error);
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
          // Fetch profile in the background
          fetchUserProfile(newSession.user.id).then(profile => {
            if (mounted && profile) {
              setUserProfile(profile);
            }
          }).catch(error => {
            console.error('AuthContext - Background profile fetch failed:', error);
          });
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
      console.log('AuthContext - Signing in');
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
      console.log('AuthContext - Signing up');
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
