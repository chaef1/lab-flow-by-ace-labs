
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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
            
            {/* Modash Features */}
            <Route path="/discover" element={<ProtectedRoute allowedRoles={['admin', 'brand', 'agency']}><Discovery /></ProtectedRoute>} />
            <Route path="/creator/:platform/:userId" element={<ProtectedRoute allowedRoles={['admin', 'brand', 'agency']}><CreatorReport /></ProtectedRoute>} />
            <Route path="/creator-lists" element={<ProtectedRoute allowedRoles={['admin', 'brand', 'agency']}><CreatorLists /></ProtectedRoute>} />
            
            {/* Reporting */}
            <Route path="/reporting" element={<ProtectedRoute allowedRoles={['admin', 'brand', 'agency']}><Reporting /></ProtectedRoute>} />
            
            {/* Admin only routes */}
            <Route path="/users" element={<ProtectedRoute allowedRoles={['admin', 'agency']}><Users /></ProtectedRoute>} />
            
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
