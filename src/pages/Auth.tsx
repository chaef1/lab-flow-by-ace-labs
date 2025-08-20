import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, signInAsGuest, user, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') === 'signup' ? 'signup' : 'signin';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [redirected, setRedirected] = useState(false);
  
  // Get the intended destination from state, or default to dashboard
  const from = location.state?.from?.pathname || "/dashboard";
  
  useEffect(() => {
    if (searchParams.get('tab') === 'signup') {
      setActiveTab('signup');
    } else {
      setActiveTab('signin');
    }
  }, [searchParams]);
  
  // Only redirect if user is loaded and authenticated, and we haven't redirected already
  useEffect(() => {
    if (isLoading) {
      return;
    }
    
    if (user && !redirected) {
      console.log('Auth: User authenticated, redirecting to:', from);
      setRedirected(true);
      // Use a small timeout to prevent potential race conditions with state updates
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
    }
  }, [user, isLoading, navigate, redirected, from]);
  
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
                <SignInForm signIn={signIn} signInAsGuest={signInAsGuest} />
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

const SignInForm = ({ signIn, signInAsGuest }: { signIn: (email: string, password: string) => Promise<void>; signInAsGuest: () => Promise<void> }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
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

  const handleGuestLogin = async () => {
    setIsGuestLoading(true);
    
    try {
      await signInAsGuest();
      navigate('/dashboard');
    } catch (error) {
      // Error is handled in signInAsGuest function
    } finally {
      setIsGuestLoading(false);
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
      
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            or
          </span>
        </div>
      </div>

      <Button 
        type="button" 
        variant="outline" 
        className="w-full" 
        onClick={handleGuestLogin}
        disabled={isGuestLoading}
      >
        {isGuestLoading ? "Logging in as Guest..." : "Continue as Guest"}
      </Button>
    </form>
  );
};

const SignUpForm = ({ signUp }: { signUp: (email: string, password: string, userData: { first_name?: string; last_name?: string; role?: string }) => Promise<void> }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('brand');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await signUp(email, password, {
        first_name: firstName,
        last_name: lastName,
        role: role
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
      
      <div className="space-y-2">
        <Label htmlFor="role">Sign up as</Label>
        <select 
          id="role"
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="brand">Brand</option>
          <option value="agency">Agency</option>
          <option value="influencer">Influencer</option>
        </select>
        <p className="text-xs text-muted-foreground">
          {role === 'brand' && "For brand managers and marketing teams"}
          {role === 'agency' && "For agencies with full platform access"}
          {role === 'influencer' && "For social media influencers and content creators"}
        </p>
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
