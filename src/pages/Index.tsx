
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '@/components/auth/LoginForm';

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is already logged in
    const user = localStorage.getItem('agencyDashboardUser');
    if (user) {
      navigate('/dashboard');
    }
  }, [navigate]);
  
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
          <div className="hidden lg:block">
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
        </div>
        
        <div className="flex-1 w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default Index;
