
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, Globe, Code, Layers, Beaker, FlaskConical, Microscope } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  
  useEffect(() => {
    console.log('Index - Auth state:', { user: user?.email, isLoading });
    
    // Only redirect if we have a confirmed user and we're not loading
    if (user && !isLoading) {
      console.log('Index - Redirecting authenticated user to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [user, isLoading, navigate]);
  
  // Show loading while checking auth
  if (isLoading) {
    console.log('Index - Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-ace-300/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-ace-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }
  
  // Don't show landing page if user is authenticated (they'll be redirected)
  if (user) {
    return null;
  }
  
  console.log('Index - Showing landing page for unauthenticated user');
  
  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navigation */}
      <header className="w-full px-4 py-6 md:px-12 lg:px-24">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-md bg-ace-500 flex items-center justify-center mr-3">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-xl font-bold text-ace-dark">Ace Labs</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/auth" className="text-sm text-gray-600 hover:text-ace-500 transition-colors">Login</Link>
            <Button asChild size="sm" variant="outline">
              <Link to="/auth?tab=signup">Get Started</Link>
            </Button>
          </nav>
          <Button asChild variant="outline" size="sm" className="md:hidden">
            <Link to="/auth">Login</Link>
          </Button>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="px-4 pt-16 pb-24 md:px-12 lg:px-24 md:pt-28 md:pb-32">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-ace-dark mb-6 leading-tight">
            Scientific project workflows,<br /> 
            <span className="text-ace-500">simplified</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl">
            LabFlow makes project management and collaboration in scientific laboratories 
            seamless and efficient. Focus on discoveries, not administrative overhead.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="gap-2">
              <Link to="/auth">
                Get Started 
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="#features">Learn More</a>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="px-4 py-20 bg-gray-50 md:px-12 lg:px-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-ace-dark mb-4">Powerful lab management tools</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              LabFlow streamlines every aspect of laboratory project management, from initial concept to final delivery.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="h-12 w-12 rounded-lg bg-ace-100 flex items-center justify-center mb-6">
                <Microscope className="h-6 w-6 text-ace-500" />
              </div>
              <h3 className="text-xl font-bold text-ace-dark mb-3">Project Management</h3>
              <p className="text-gray-600">
                Track projects from conception to completion with intuitive kanban boards and timeline views.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="h-12 w-12 rounded-lg bg-ace-100 flex items-center justify-center mb-6">
                <FlaskConical className="h-6 w-6 text-ace-500" />
              </div>
              <h3 className="text-xl font-bold text-ace-dark mb-3">Team Collaboration</h3>
              <p className="text-gray-600">
                Centralized communication and task assignment keeps everyone in sync and experiments on track.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="h-12 w-12 rounded-lg bg-ace-100 flex items-center justify-center mb-6">
                <Beaker className="h-6 w-6 text-ace-500" />
              </div>
              <h3 className="text-xl font-bold text-ace-dark mb-3">Data Integration</h3>
              <p className="text-gray-600">
                Connect with lab instruments and data repositories for seamless information flow and analysis.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="px-4 py-20 md:px-12 lg:px-24">
        <div className="max-w-5xl mx-auto bg-ace-500 rounded-2xl p-10 md:p-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to transform your lab workflow?</h2>
          <p className="text-xl text-white/90 mb-8 max-w-xl mx-auto">
            Join leading research teams using LabFlow to accelerate innovation and streamline operations.
          </p>
          <Button asChild size="lg" variant="secondary" className="bg-white text-ace-500 hover:bg-white/90">
            <Link to="/auth">Get Started Now</Link>
          </Button>
          <p className="text-sm text-white/70 mt-6">
            An application by Ace Labs
          </p>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="px-4 py-12 bg-gray-50 border-t border-gray-200 md:px-12 lg:px-24">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center justify-center md:justify-start">
                <div className="h-8 w-8 rounded-md bg-ace-500 flex items-center justify-center mr-2">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <span className="text-lg font-bold text-ace-dark">Ace Labs</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">Advanced technology for scientific research</p>
            </div>
            <div className="flex gap-8">
              <a href="#" className="text-sm text-gray-600 hover:text-ace-500 transition-colors">
                Terms
              </a>
              <a href="#" className="text-sm text-gray-600 hover:text-ace-500 transition-colors">
                Privacy
              </a>
              <a href="#" className="text-sm text-gray-600 hover:text-ace-500 transition-colors">
                Contact
              </a>
            </div>
          </div>
          <div className="text-center mt-8 text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Ace Labs. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
