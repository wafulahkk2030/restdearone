import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { TranslationProvider } from "@/contexts/TranslationContext";
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
import About from "./pages/About";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CommunityGuidelines from "./pages/CommunityGuidelines";
import Fundraise from "./pages/Fundraise";
import FundraiserPage from "./pages/FundraiserPage";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ScrollToTop from "./components/ScrollToTop";
import NationalLegends from "./pages/NationalLegends";
import NationalLegendDetail from "./pages/NationalLegendDetail";
import SubmitNationalLegend from "./pages/SubmitNationalLegend";
import NewsletterPopup from "./components/NewsletterPopup";
import InstallAppPrompt from "./components/InstallAppPrompt";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <TranslationProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/create-memorial" element={<CreateMemorial />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/communities" element={<Communities />} />
            <Route path="/community/:id" element={<CommunityPage />} />
            <Route path="/memorial/:id" element={<MemorialPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/guidelines" element={<CommunityGuidelines />} />
            <Route path="/fundraise" element={<Fundraise />} />
            <Route path="/fundraise/:id" element={<FundraiserPage />} />
            <Route path="/support/:id" element={<FundraiserPage />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/national-legends" element={<NationalLegends />} />
            <Route path="/national-legends/submit" element={<SubmitNationalLegend />} />
            <Route path="/national-legends/:id" element={<NationalLegendDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <NewsletterPopup />
          <InstallAppPrompt />
        </AuthProvider>
        </TranslationProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
