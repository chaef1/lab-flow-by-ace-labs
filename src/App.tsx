
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Influencers from "./pages/Influencers";
import InfluencerProfile from "./pages/InfluencerProfile";
import Content from "./pages/Content";
import ContentDetails from "./pages/ContentDetails";
import Reporting from "./pages/Reporting";
import AdvertisingManager from "./pages/AdvertisingManager";
import Wallet from "./pages/Wallet";
import Profile from "./pages/Profile";
import UserManagement from "./pages/UserManagement";
import Users from "./pages/Users";
import Campaigns from "./pages/Campaigns";
import SubmitContent from "./pages/SubmitContent";
import BudgetEstimatorPage from "./pages/BudgetEstimator";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
              <Route path="/influencers" element={<ProtectedRoute><Influencers /></ProtectedRoute>} />
              <Route path="/influencer/:id" element={<ProtectedRoute><InfluencerProfile /></ProtectedRoute>} />
              <Route path="/content" element={<ProtectedRoute><Content /></ProtectedRoute>} />
              <Route path="/content/:id" element={<ProtectedRoute><ContentDetails /></ProtectedRoute>} />
              <Route path="/reporting" element={<ProtectedRoute><Reporting /></ProtectedRoute>} />
              <Route path="/advertising" element={<ProtectedRoute><AdvertisingManager /></ProtectedRoute>} />
              <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/user-management" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
              <Route path="/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
              <Route path="/submit-content" element={<ProtectedRoute><SubmitContent /></ProtectedRoute>} />
              <Route path="/budget-estimator" element={<ProtectedRoute><BudgetEstimatorPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
