
import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  
  useEffect(() => {
    if (user && !isLoading) {
      navigate('/dashboard');
    }
  }, [navigate, user, isLoading]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
              <span className="text-white font-bold text-2xl">A</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-agency-900 mb-4">
            Agency Dashboard
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Manage projects, payments, and content approvals in one place.
          </p>
          <div className="hidden lg:block mb-8">
            <div className="flex gap-3 flex-wrap">
              <span className="inline-flex h-8 items-center rounded-full border border-muted bg-muted px-3 text-xs font-medium">
                Project Management
              </span>
              <span className="inline-flex h-8 items-center rounded-full border border-muted bg-muted px-3 text-xs font-medium">
                Content Approval
              </span>
              <span className="inline-flex h-8 items-center rounded-full border border-muted bg-muted px-3 text-xs font-medium">
                Payment Tracking
              </span>
              <span className="inline-flex h-8 items-center rounded-full border border-muted bg-muted px-3 text-xs font-medium">
                Client Communication
              </span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg">
              <Link to="/auth">Get Started</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="https://supabase.com/" target="_blank" rel="noopener noreferrer">Learn More</a>
            </Button>
          </div>
        </div>
        
        <div className="flex-1 hidden lg:block">
          <img 
            src="https://api.dicebear.com/7.x/shapes/svg?seed=dashboard" 
            alt="Dashboard illustration" 
            className="w-full h-auto"
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
