
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Instagram, Github } from 'lucide-react';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('admin');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // This is a mock login - in a real app, this would connect to Supabase Auth
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Store user info in localStorage (would be handled by auth provider in real app)
      localStorage.setItem('agencyDashboardUser', JSON.stringify({
        email,
        role: userType,
        name: email.split('@')[0],
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${email}`
      }));
      
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Store user info in localStorage (would be handled by auth provider in real app)
      localStorage.setItem('agencyDashboardUser', JSON.stringify({
        email: `user@${provider.toLowerCase()}.com`,
        role: userType,
        name: `${provider} User`,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${provider}`
      }));
      
      toast.success(`${provider} login successful!`);
      navigate('/dashboard');
    } catch (error) {
      toast.error(`${provider} login failed.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
        <CardDescription>
          Access your agency dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="name@example.com" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="user-type">Sign in as</Label>
            <Select defaultValue={userType} onValueChange={setUserType}>
              <SelectTrigger>
                <SelectValue placeholder="Select user type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Agency Admin</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="creator">Content Creator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            type="submit" 
            className="w-full mt-6" 
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
        
        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-3 gap-3">
          <Button 
            variant="outline"
            className="w-full" 
            onClick={() => handleSocialLogin('Google')}
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 488 512">
              <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"/>
            </svg>
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => handleSocialLogin('TikTok')}
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 448 512">
              <path fill="currentColor" d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/>
            </svg>
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => handleSocialLogin('Instagram')}
            disabled={isLoading}
          >
            <Instagram size={20} />
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Don't have an account? Contact your agency manager.
        </p>
      </CardFooter>
    </Card>
  );
};

export default LoginForm;
