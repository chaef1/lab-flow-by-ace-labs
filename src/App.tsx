
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Wallet from "./pages/Wallet";
import Content from "./pages/Content";
import ContentDetails from "./pages/ContentDetails";
import Users from "./pages/Users";
import UserManagement from "./pages/UserManagement";
import Reporting from "./pages/Reporting";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Influencers from "./pages/Influencers";
import InfluencerProfile from "./pages/InfluencerProfile";
import Campaigns from "./pages/Campaigns";
import SubmitContent from "./pages/SubmitContent";
import AdvertisingManager from "./pages/AdvertisingManager";

// Set up React Query with default error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onSettled: (_, error) => {
        if (error) {
          console.error('Mutation error:', error);
        }
      }
    }
  }
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            
            {/* Admin, Creator, Brand routes */}
            <Route path="/projects" element={<ProtectedRoute allowedRoles={['admin', 'creator', 'brand']}><Projects /></ProtectedRoute>} />
            <Route path="/content" element={<ProtectedRoute allowedRoles={['admin', 'creator', 'brand']}><Content /></ProtectedRoute>} />
            <Route path="/content/:id" element={<ProtectedRoute allowedRoles={['admin', 'creator', 'brand']}><ContentDetails /></ProtectedRoute>} />
            
            {/* Admin, Brand routes */}
            <Route path="/influencers" element={<ProtectedRoute allowedRoles={['admin', 'brand']}><Influencers /></ProtectedRoute>} />
            <Route path="/influencers/:id" element={<ProtectedRoute allowedRoles={['admin', 'brand']}><InfluencerProfile /></ProtectedRoute>} />
            <Route path="/reporting" element={<ProtectedRoute allowedRoles={['admin', 'brand']}><Reporting /></ProtectedRoute>} />
            <Route path="/advertising" element={<ProtectedRoute allowedRoles={['admin', 'brand']}><AdvertisingManager /></ProtectedRoute>} />
            
            {/* Admin only routes */}
            <Route path="/users" element={<ProtectedRoute allowedRoles={['admin']}><Users /></ProtectedRoute>} />
            <Route path="/user-management" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
            
            {/* Influencer only routes */}
            <Route path="/campaigns" element={<ProtectedRoute allowedRoles={['influencer']}><Campaigns /></ProtectedRoute>} />
            <Route path="/submit-content" element={<ProtectedRoute allowedRoles={['influencer']}><SubmitContent /></ProtectedRoute>} />
            
            {/* All authenticated users */}
            <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
