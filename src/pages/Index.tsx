import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/home/HeroSection";
import LivingMemoryFeed from "@/components/home/LivingMemoryFeed";
import DiscoverSection from "@/components/home/DiscoverSection";
import MemoryPromptsSection from "@/components/home/MemoryPromptsSection";
import MemoryEchoWall from "@/components/home/MemoryEchoWall";
import KenyanShowcase from "@/components/KenyanShowcase";
import CommunitySection from "@/components/home/CommunitySection";
import StatsSection from "@/components/home/StatsSection";
import WhySection from "@/components/home/WhySection";
import CTASection from "@/components/home/CTASection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>RestDearOne — Preserve the Stories of Loved Ones</title>
        <meta name="description" content="Create living memorial pages, share stories, and join a global community remembering those who shaped our lives." />
        <link rel="canonical" href="https://restdearone.lovable.app/" />
      </Helmet>
      <Navbar />
      <HeroSection />
      <LivingMemoryFeed />
      <DiscoverSection />
      <MemoryPromptsSection />
      <MemoryEchoWall />
      <KenyanShowcase />
      <CommunitySection />
      <StatsSection />
      <WhySection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
