import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/home/HeroSection";
import LivingMemoryFeed from "@/components/home/LivingMemoryFeed";
import DiscoverSection from "@/components/home/DiscoverSection";
import MemoryPromptsSection from "@/components/home/MemoryPromptsSection";
import MemoryEchoWall from "@/components/home/MemoryEchoWall";
import LettersSection from "@/components/home/LettersSection";
import CommunitySection from "@/components/home/CommunitySection";
import StatsSection from "@/components/home/StatsSection";
import WhySection from "@/components/home/WhySection";
import CTASection from "@/components/home/CTASection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <LivingMemoryFeed />
      <DiscoverSection />
      <MemoryPromptsSection />
      <MemoryEchoWall />
      <LettersSection />
      <CommunitySection />
      <StatsSection />
      <WhySection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
