
import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LoginForm from '@/components/auth/LoginForm';
import SignUpForm from '@/components/auth/SignUpForm';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  
  const defaultTab = searchParams.get('tab') === 'signup' ? 'signup' : 'login';
  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    console.log('Auth page - Checking session');
    
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth page - Session check error:', error);
          setIsLoading(false);
          return;
        }
        
        console.log('Auth page - Session check result:', session?.user?.email || 'No session');
        
        if (session?.user) {
          console.log('Auth page - User found, redirecting to:', from);
          navigate(from, { replace: true });
        } else {
          console.log('Auth page - No user, staying on auth page');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Auth page - Unexpected error:', error);
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth page - Auth state change:', event, session?.user?.email || 'No user');
        
        if (session?.user) {
          console.log('Auth page - User authenticated, redirecting to:', from);
          navigate(from, { replace: true });
        }
      }
    );

    return () => {
      console.log('Auth page - Cleanup');
      subscription.unsubscribe();
    };
  }, [navigate, from]);

  if (isLoading) {
    console.log('Auth page - Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-ace-300/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-ace-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  console.log('Auth page - Rendering auth forms');
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ace-50 to-ace-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-lg bg-ace-500 flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-ace-dark">Welcome to Ace Labs</CardTitle>
          <CardDescription>
            Sign in to your account or create a new one to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="space-y-4">
              <LoginForm />
            </TabsContent>
            <TabsContent value="signup" className="space-y-4">
              <SignUpForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
