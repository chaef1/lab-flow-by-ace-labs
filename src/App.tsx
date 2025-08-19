
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AppLayout from "./components/layout/AppLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Wallet from "./pages/Wallet";
import Users from "./pages/Users";
import Reporting from "./pages/Reporting";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ModashDiscovery from "./pages/ModashDiscovery";
import CreatorLists from "./pages/CreatorLists";
import Discovery from "./pages/Discovery";
import CreatorReport from "./pages/CreatorReport";
import Compare from "./pages/Compare";
import BrandMonitoring from "./pages/BrandMonitoring";
import CampaignWorkspace from "./pages/CampaignWorkspace";

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
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="*" element={<NotFound />} />
            
            {/* Protected Routes with Layout */}
            <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="wallet" element={<Wallet />} />
              
              {/* Influencer Intelligence Platform */}
              <Route path="discover" element={<ProtectedRoute allowedRoles={['admin', 'brand', 'agency']}><Discovery /></ProtectedRoute>} />
              <Route path="creator/:platform/:userId" element={<ProtectedRoute allowedRoles={['admin', 'brand', 'agency']}><CreatorReport /></ProtectedRoute>} />
              <Route path="creators/:platform/:userId" element={<ProtectedRoute allowedRoles={['admin', 'brand', 'agency']}><CreatorReport /></ProtectedRoute>} />
              <Route path="compare" element={<ProtectedRoute allowedRoles={['admin', 'brand', 'agency']}><Compare /></ProtectedRoute>} />
              <Route path="monitor" element={<ProtectedRoute allowedRoles={['admin', 'brand', 'agency']}><BrandMonitoring /></ProtectedRoute>} />
              <Route path="workspace" element={<ProtectedRoute allowedRoles={['admin', 'brand', 'agency']}><CampaignWorkspace /></ProtectedRoute>} />
              
              {/* Legacy routes */}
              <Route path="creator-lists" element={<ProtectedRoute allowedRoles={['admin', 'brand', 'agency']}><CreatorLists /></ProtectedRoute>} />
              
              {/* Reporting */}
              <Route path="reporting" element={<ProtectedRoute allowedRoles={['admin', 'brand', 'agency']}><Reporting /></ProtectedRoute>} />
              
              {/* Admin only routes */}
              <Route path="users" element={<ProtectedRoute allowedRoles={['admin', 'agency']}><Users /></ProtectedRoute>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
