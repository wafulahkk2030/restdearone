import { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
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

const CustomCursor = () => {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springConfig = { damping: 25, stiffness: 300 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };
    const handleOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, [role="button"], input, textarea, select, label')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };
    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("mouseover", handleOver);
    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mouseover", handleOver);
    };
  }, []);

  return (
    <>
      {/* Outer glow */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] hidden md:block"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          width: isHovering ? 48 : 32,
          height: isHovering ? 48 : 32,
          marginLeft: isHovering ? -24 : -16,
          marginTop: isHovering ? -24 : -16,
          borderRadius: "50%",
          border: `1.5px solid hsl(var(--primary) / 0.4)`,
          background: isHovering ? "hsl(var(--primary) / 0.08)" : "transparent",
          transition: "width 0.2s, height 0.2s, margin 0.2s, background 0.2s",
        }}
      />
      {/* Inner dot */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] hidden md:block"
        style={{
          x: cursorX,
          y: cursorY,
          width: 6,
          height: 6,
          marginLeft: -3,
          marginTop: -3,
          borderRadius: "50%",
          background: "hsl(var(--primary))",
        }}
      />
    </>
  );
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background cursor-none md:cursor-none">
      <CustomCursor />
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
