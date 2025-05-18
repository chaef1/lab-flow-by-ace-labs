
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') === 'signup' ? 'signup' : 'signin';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [redirected, setRedirected] = useState(false);
  
  useEffect(() => {
    if (searchParams.get('tab') === 'signup') {
      setActiveTab('signup');
    } else {
      setActiveTab('signin');
    }
  }, [searchParams]);
  
  // Only redirect if user is loaded and authenticated, and we haven't redirected already
  useEffect(() => {
    if (user && !isLoading && !redirected) {
      console.log('Auth: User authenticated, redirecting to dashboard');
      setRedirected(true);
      navigate('/dashboard', { replace: true });
    }
  }, [user, isLoading, navigate, redirected]);
  
  // Don't render anything while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-agency-50 to-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-agency-600"></div>
      </div>
    );
  }
  
  // Only render the auth form if user is not authenticated
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-agency-50 to-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-agency-600"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-agency-50 to-white p-4">
      <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-8 items-center">
        <div className="flex-1 text-center lg:text-left">
          <div className="mb-6 flex justify-center lg:justify-start">
            <div className="h-12 w-12 rounded-full bg-agency-600 flex items-center justify-center">
              <span className="text-white font-bold text-2xl">L</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-agency-900 mb-4">
            LabFlow
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Manage scientific projects, workflows, and lab operations in one place.
          </p>
          <div className="hidden lg:block mb-8">
            <div className="flex gap-3 flex-wrap">
              <span className="inline-flex h-8 items-center rounded-full border border-muted bg-muted px-3 text-xs font-medium">
                Project Management
              </span>
              <span className="inline-flex h-8 items-center rounded-full border border-muted bg-muted px-3 text-xs font-medium">
                Team Collaboration
              </span>
              <span className="inline-flex h-8 items-center rounded-full border border-muted bg-muted px-3 text-xs font-medium">
                Data Integration
              </span>
              <span className="inline-flex h-8 items-center rounded-full border border-muted bg-muted px-3 text-xs font-medium">
                Workflow Automation
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 w-full max-w-md">
          <Card className="w-full shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Welcome</CardTitle>
              <CardDescription>
                Access your lab dashboard
              </CardDescription>
            </CardHeader>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <SignInForm signIn={signIn} />
              </TabsContent>
              
              <TabsContent value="signup">
                <SignUpForm signUp={signUp} />
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
};

const SignInForm = ({ signIn }: { signIn: (email: string, password: string) => Promise<void> }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (error) {
      // Error is handled in signIn function
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6">
      <div className="space-y-2">
        <Label htmlFor="signin-email">Email</Label>
        <Input 
          id="signin-email" 
          type="email" 
          placeholder="name@example.com" 
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="signin-password">Password</Label>
        <Input 
          id="signin-password" 
          type="password" 
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full mt-6" 
        disabled={isLoading}
      >
        {isLoading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
};

const SignUpForm = ({ signUp }: { signUp: (email: string, password: string, userData: { first_name?: string; last_name?: string }) => Promise<void> }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await signUp(email, password, {
        first_name: firstName,
        last_name: lastName
      });
      // User will need to sign in after registration
    } catch (error) {
      // Error is handled in signUp function
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first-name">First Name</Label>
          <Input 
            id="first-name" 
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="last-name">Last Name</Label>
          <Input 
            id="last-name" 
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input 
          id="signup-email" 
          type="email" 
          placeholder="name@example.com" 
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input 
          id="signup-password" 
          type="password" 
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">Password must be at least 8 characters</p>
      </div>
      
      <Button 
        type="submit" 
        className="w-full mt-6" 
        disabled={isLoading}
      >
        {isLoading ? "Creating Account..." : "Create Account"}
      </Button>
    </form>
  );
};

export default Auth;
