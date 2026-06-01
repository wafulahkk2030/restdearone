import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";

const SESSION_KEY = "rdo_splash_shown_session";

const AppSplash = () => {
  const [show, setShow] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      (window.navigator as any).standalone;

    // Show splash on installed app OR first-ever session in browser (gamified opening)
    const isFirstVisit = !localStorage.getItem("rdo_visited_v1");
    if (!isStandalone && !isFirstVisit) return;
    localStorage.setItem("rdo_visited_v1", "1");
    sessionStorage.setItem(SESSION_KEY, "1");

    setShow(true);
    const start = Date.now();
    const duration = 2400;
    const tick = () => {
      const p = Math.min(100, ((Date.now() - start) / duration) * 100);
      setProgress(p);
      if (p < 100) requestAnimationFrame(tick);
      else setTimeout(() => setShow(false), 400);
    };
    requestAnimationFrame(tick);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
          style={{
            background:
              "radial-gradient(ellipse at top, hsl(var(--primary) / 0.25), hsl(var(--background)) 60%), hsl(var(--background))",
          }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5 }}
        >
          {/* Ambient floating orbs */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full blur-3xl"
              style={{
                width: 120 + i * 30,
                height: 120 + i * 30,
                background: `hsl(var(--primary) / ${0.08 + i * 0.02})`,
                left: `${10 + i * 15}%`,
                top: `${15 + (i % 3) * 25}%`,
              }}
              animate={{
                y: [0, -20, 0],
                x: [0, 10, 0],
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.2,
              }}
            />
          ))}

          {/* Logo with halo + breathing */}
          <motion.div
            className="relative"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, hsl(var(--primary) / 0.4), transparent 70%)",
              }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.img
              src={logo}
              alt="RestDearOne"
              className="relative w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-2xl"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>

          {/* Wordmark */}
          <motion.div
            className="mt-8 text-center px-6"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              RestDearOne
            </h1>
            <p className="font-body text-sm md:text-base text-muted-foreground mt-2 italic">
              Every life leaves a story
            </p>
          </motion.div>

          {/* Gamified progress bar */}
          <div className="absolute bottom-16 left-0 right-0 flex flex-col items-center gap-3 px-8">
            <div className="w-full max-w-xs h-1.5 rounded-full bg-foreground/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  width: `${progress}%`,
                  background:
                    "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.6))",
                }}
              />
            </div>
            <motion.p
              className="text-xs font-body tracking-[0.3em] uppercase text-muted-foreground"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Lighting the garden
            </motion.p>
          </div>

          {/* Sparkle particles */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={`s-${i}`}
              className="absolute w-1 h-1 rounded-full bg-primary"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AppSplash;