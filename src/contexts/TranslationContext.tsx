import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TranslationContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (text: string) => string;
  isTranslating: boolean;
}

const TranslationContext = createContext<TranslationContextType>({
  language: "en",
  setLanguage: () => {},
  t: (text) => text,
  isTranslating: false,
});

export const useTranslation = () => useContext(TranslationContext);

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "sw", label: "Kiswahili" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "ar", label: "العربية" },
  { code: "zh", label: "中文" },
  { code: "hi", label: "हिन्दी" },
  { code: "pt", label: "Português" },
];

export { LANGUAGES };

// Global cache persists across re-renders
const cache: Record<string, Record<string, string>> = {};

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState(() => localStorage.getItem("rdo-lang") || "en");
  const [translated, setTranslated] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const pendingRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushBatch = useCallback(async (lang: string) => {
    const texts = Array.from(pendingRef.current);
    pendingRef.current.clear();
    if (texts.length === 0 || lang === "en") return;

    // Filter already cached
    const uncached = texts.filter(t => !cache[lang]?.[t]);
    if (uncached.length === 0) {
      setTranslated(prev => ({ ...prev, ...cache[lang] }));
      return;
    }

    setIsTranslating(true);
    try {
      const langName = LANGUAGES.find(l => l.code === lang)?.label || lang;
      const { data, error } = await supabase.functions.invoke("translate", {
        body: { texts: uncached, target_language: langName },
      });

      if (!error && data?.translations) {
        if (!cache[lang]) cache[lang] = {};
        uncached.forEach((text, i) => {
          cache[lang][text] = data.translations[i] || text;
        });
        setTranslated(prev => ({ ...prev, ...cache[lang] }));
      }
    } catch (err) {
      console.error("Translation error:", err);
    }
    setIsTranslating(false);
  }, []);

  const setLanguage = useCallback((lang: string) => {
    setLanguageState(lang);
    localStorage.setItem("rdo-lang", lang);
    if (lang === "en") {
      setTranslated({});
    } else if (cache[lang]) {
      setTranslated({ ...cache[lang] });
    }
    // Reset pending
    pendingRef.current.clear();
  }, []);

  const t = useCallback((text: string): string => {
    if (language === "en") return text;
    if (cache[language]?.[text]) return cache[language][text];

    // Queue for batch translation
    if (!pendingRef.current.has(text)) {
      pendingRef.current.add(text);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => flushBatch(language), 300);
    }

    return translated[text] || text;
  }, [language, translated, flushBatch]);

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t, isTranslating }}>
      {children}
    </TranslationContext.Provider>
  );
};
