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
// This ensures alignment with the database column types
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
  const [authChangeComplete, setAuthChangeComplete] = useState(false);

  // Fetch user profile data from the profiles table
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching user profile for:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, role')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      
      console.log('User profile fetched:', data);
      return data as UserProfile;
    } catch (error) {
      console.error('Unexpected error fetching user profile:', error);
      return null;
    }
  };

  useEffect(() => {
    console.log('AuthContext initializing');
    let mounted = true;
    
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event, newSession?.user?.id);
        
        if (!mounted) return;
        
        // Update session and user state synchronously
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // If session exists, fetch profile asynchronously
        if (newSession?.user) {
          // Use setTimeout to avoid potential deadlock with Supabase client
          setTimeout(async () => {
            if (!mounted) return;
            const profile = await fetchUserProfile(newSession.user.id);
            setUserProfile(profile);
            setIsLoading(false);
            setAuthChangeComplete(true);
          }, 0);
        } else {
          setUserProfile(null);
          setIsLoading(false);
          setAuthChangeComplete(true);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      console.log('Initial session check:', currentSession?.user?.id);
      
      if (!mounted) return;
      
      // Update session and user state
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        const profile = await fetchUserProfile(currentSession.user.id);
        if (mounted) {
          setUserProfile(profile);
        }
      }
      
      if (mounted) {
        setIsLoading(false);
        setAuthChangeComplete(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast.error(error.message);
        throw error;
      }
      
      toast.success('Signed in successfully');
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: { first_name?: string; last_name?: string; role?: string }) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });
      
      if (error) {
        toast.error(error.message);
        throw error;
      }
      
      toast.success('Account created successfully. You can now sign in.');
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      toast.info('Signed out');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user || !userProfile) return;
    try {
      setIsLoading(true);
      
      // Create a properly typed update object
      const updateData: ProfileUpdateData = {
        ...data,
        updated_at: new Date().toISOString()
      };
      
      // Use type assertion to work around the type mismatch
      // This is a temporary solution until the database schema is updated to include 'agency' role
      const { error } = await supabase
        .from('profiles')
        .update(updateData as any)
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Update the local state
      setUserProfile({
        ...userProfile,
        ...data
      });
      
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(`Failed to update profile: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions to check user roles
  const isAdmin = () => userProfile?.role === 'admin';
  const isCreator = () => userProfile?.role === 'creator';
  const isBrand = () => userProfile?.role === 'brand';
  const isAgency = () => userProfile?.role === 'agency';
  const isInfluencer = () => userProfile?.role === 'influencer';

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
