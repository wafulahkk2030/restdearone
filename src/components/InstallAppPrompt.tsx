import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "rdo_install_dismissed_v1";

const InstallAppPrompt = () => {
  const [deferred, setDeferred] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;
    if (isStandalone) return;

    const ua = window.navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua) && !/CriOS|FxiOS/.test(ua);
    setIsIos(ios);

    const handler = (e: any) => {
      e.preventDefault();
      setDeferred(e);
      setTimeout(() => setOpen(true), 8000);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Show iOS hint after 10s
    if (ios) {
      const t = setTimeout(() => setOpen(true), 10000);
      return () => { clearTimeout(t); window.removeEventListener("beforeinstallprompt", handler); };
    }
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setOpen(false);
  };

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    dismiss();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-[90] bg-card border border-border rounded-2xl p-4 shadow-xl"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
        >
          <button onClick={dismiss} aria-label="Close" className="absolute top-2 right-2 p-1 rounded hover:bg-accent">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3 pr-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-display text-base font-semibold text-foreground">Install RestDearOne</h4>
              {isIos ? (
                <p className="text-xs text-muted-foreground font-body mt-1 leading-relaxed">
                  Tap <span className="inline-block px-1 bg-accent rounded">Share</span> then <strong>Add to Home Screen</strong> for the full app experience.
                </p>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground font-body mt-1 leading-relaxed">Get faster access, offline reading, and a phone-app feel.</p>
                  <Button size="sm" variant="hero" className="mt-3 gap-1" onClick={install} disabled={!deferred}>
                    <Download className="w-4 h-4" /> Install app
                  </Button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallAppPrompt;