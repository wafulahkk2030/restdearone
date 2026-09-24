import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { TranslationProvider } from "@/contexts/TranslationContext";
import Index from "./pages/Index";
const NotFound = lazy(() => import("./pages/NotFound"));
const Signup = lazy(() => import("./pages/Signup"));
const Login = lazy(() => import("./pages/Login"));
const CreateMemorial = lazy(() => import("./pages/CreateMemorial"));
const Explore = lazy(() => import("./pages/Explore"));
const Discover = lazy(() => import("./pages/Discover"));
const Forum = lazy(() => import("./pages/Forum"));
const MemorialPage = lazy(() => import("./pages/MemorialPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Admin = lazy(() => import("./pages/Admin"));
const Communities = lazy(() => import("./pages/Communities"));
const CommunityPage = lazy(() => import("./pages/CommunityPage"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const CommunityGuidelines = lazy(() => import("./pages/CommunityGuidelines"));
const Fundraise = lazy(() => import("./pages/Fundraise"));
const FundraiserPage = lazy(() => import("./pages/FundraiserPage"));
const Chat = lazy(() => import("./pages/Chat"));
const Profile = lazy(() => import("./pages/Profile"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
import ScrollToTop from "./components/ScrollToTop";
const NationalLegends = lazy(() => import("./pages/NationalLegends"));
const NationalLegendDetail = lazy(() => import("./pages/NationalLegendDetail"));
const SubmitNationalLegend = lazy(() => import("./pages/SubmitNationalLegend"));
const LegendArticlePage = lazy(() => import("./pages/LegendArticlePage"));
import NewsletterPopup from "./components/NewsletterPopup";
import InstallAppPrompt from "./components/InstallAppPrompt";
import AppSplash from "./components/AppSplash";
import PageTracker from "./components/PageTracker";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <PageTracker />
        <AppSplash />
        <TranslationProvider>
        <AuthProvider>
          <ErrorBoundary>
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
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
            <Route path="/national-legends/article/:articleId" element={<LegendArticlePage />} />
            <Route path="/national-legends/:id" element={<NationalLegendDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          </ErrorBoundary>
          <NewsletterPopup />
          <InstallAppPrompt />
        </AuthProvider>
        </TranslationProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
