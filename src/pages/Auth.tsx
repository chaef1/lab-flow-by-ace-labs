
import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LoginForm from '@/components/auth/LoginForm';
import SignUpForm from '@/components/auth/SignUpForm';
import { useAuth } from '@/contexts/AuthContext';

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, isLoading } = useAuth();
  const [authLoading, setAuthLoading] = useState(true);
  
  const defaultTab = searchParams.get('tab') === 'signup' ? 'signup' : 'login';
  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    console.log('Auth page - Checking authentication state');
    
    const checkAuth = () => {
      // Wait a moment for auth context to settle
      setTimeout(() => {
        if (!isLoading) {
          console.log('Auth page - Auth context loaded, user:', user?.email || 'No user');
          
          if (user) {
            console.log('Auth page - User authenticated, redirecting to:', from);
            navigate(from, { replace: true });
          } else {
            console.log('Auth page - No user, staying on auth page');
            setAuthLoading(false);
          }
        }
      }, 100);
    };

    checkAuth();
  }, [user, isLoading, navigate, from]);

  if (isLoading || authLoading) {
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
