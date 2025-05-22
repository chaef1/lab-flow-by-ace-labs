
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const formSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  role: z.enum(['brand', 'agency', 'influencer'], {
    required_error: "Please select your account type.",
  }),
});

type FormData = z.infer<typeof formSchema>;

export default function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    setValue,
    watch
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: undefined,
    }
  });
  
  // Watch the role selection for conditional UI elements
  const selectedRole = watch('role');
  
  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            role: data.role,
          }
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Account created successfully!",
        description: "Please check your email to confirm your account.",
      });
      
      navigate('/auth/login');
    } catch (err: any) {
      console.error('Error signing up:', err);
      setError(err.message || 'An unexpected error occurred during sign up.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input 
              id="firstName" 
              placeholder="First name" 
              {...register('firstName')} 
              disabled={isLoading} 
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-500">{errors.firstName.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input 
              id="lastName" 
              placeholder="Last name" 
              {...register('lastName')} 
              disabled={isLoading} 
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-500">{errors.lastName.message}</p>
            )}
          </div>
        </div>
        
        <div>
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="you@example.com" 
            {...register('email')} 
            disabled={isLoading} 
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="password">Password</Label>
          <Input 
            id="password" 
            type="password" 
            placeholder="••••••••" 
            {...register('password')} 
            disabled={isLoading} 
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>
        
        <div>
          <Label>Account Type</Label>
          <RadioGroup 
            className="mt-2 flex flex-col space-y-1"
            onValueChange={(value) => setValue('role', value as 'brand' | 'agency' | 'influencer')}
            disabled={isLoading}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="brand" id="brand" />
              <Label htmlFor="brand" className="font-normal">Brand</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="agency" id="agency" />
              <Label htmlFor="agency" className="font-normal">Agency</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="influencer" id="influencer" />
              <Label htmlFor="influencer" className="font-normal">Influencer</Label>
            </div>
          </RadioGroup>
          {errors.role && (
            <p className="mt-1 text-sm text-red-500">{errors.role.message}</p>
          )}
        </div>
        
        {/* Conditional fields based on selected role */}
        {selectedRole === 'influencer' && (
          <div className="p-3 bg-muted rounded border">
            <p className="text-sm">As an influencer, you'll be able to:</p>
            <ul className="text-sm list-disc pl-5 mt-2">
              <li>Connect your social media accounts</li>
              <li>Apply to brand campaigns</li>
              <li>Manage your content deliverables</li>
            </ul>
          </div>
        )}
        
        {selectedRole === 'brand' && (
          <div className="p-3 bg-muted rounded border">
            <p className="text-sm">As a brand, you'll be able to:</p>
            <ul className="text-sm list-disc pl-5 mt-2">
              <li>Run campaigns with influencers</li>
              <li>Access analytics and reporting</li>
              <li>Manage your advertising budget</li>
            </ul>
          </div>
        )}
        
        {selectedRole === 'agency' && (
          <div className="p-3 bg-muted rounded border">
            <p className="text-sm">As an agency, you'll be able to:</p>
            <ul className="text-sm list-disc pl-5 mt-2">
              <li>Manage multiple client accounts</li>
              <li>Access advanced analytics and reporting</li>
              <li>Coordinate influencer campaigns at scale</li>
            </ul>
          </div>
        )}
      </div>
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...
          </>
        ) : (
          'Sign Up'
        )}
      </Button>
    </form>
  );
}
