import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import CreateMemorial from "./pages/CreateMemorial";
import Explore from "./pages/Explore";
import Discover from "./pages/Discover";
import Forum from "./pages/Forum";
import MemorialPage from "./pages/MemorialPage";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Communities from "./pages/Communities";
import CommunityPage from "./pages/CommunityPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/create-memorial" element={<CreateMemorial />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/communities" element={<Communities />} />
            <Route path="/community/:id" element={<CommunityPage />} />
            <Route path="/memorial/:id" element={<MemorialPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
