import { createContext, useContext, useState, useCallback, ReactNode } from "react";
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

// In-memory cache for translated strings
const translationCache: Record<string, Record<string, string>> = {};

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem("rdo-lang") || "en";
  });
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [pendingTexts, setPendingTexts] = useState<Set<string>>(new Set());

  const translateBatch = useCallback(async (texts: string[], lang: string) => {
    if (lang === "en" || texts.length === 0) return;

    // Filter out already cached texts
    const uncached = texts.filter(t => !translationCache[lang]?.[t]);
    if (uncached.length === 0) {
      setTranslations(prev => ({ ...prev, ...translationCache[lang] }));
      return;
    }

    setIsTranslating(true);
    try {
      const langName = LANGUAGES.find(l => l.code === lang)?.label || lang;
      const { data, error } = await supabase.functions.invoke("translate", {
        body: { texts: uncached, target_language: langName },
      });

      if (!error && data?.translations) {
        if (!translationCache[lang]) translationCache[lang] = {};
        uncached.forEach((text, i) => {
          translationCache[lang][text] = data.translations[i] || text;
        });
        setTranslations(prev => ({ ...prev, ...translationCache[lang] }));
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
      setTranslations({});
    } else if (translationCache[lang]) {
      setTranslations(translationCache[lang]);
    }
  }, []);

  // Translate function — registers text for batch translation
  const t = useCallback((text: string): string => {
    if (language === "en") return text;
    
    // Check cache
    if (translationCache[language]?.[text]) {
      return translationCache[language][text];
    }
    
    // Queue for translation if not already pending
    if (!pendingTexts.has(text)) {
      setPendingTexts(prev => {
        const next = new Set(prev);
        next.add(text);
        // Debounce batch translate
        setTimeout(() => {
          const batch = Array.from(next);
          if (batch.length > 0) {
            translateBatch(batch, language);
            setPendingTexts(new Set());
          }
        }, 500);
        return next;
      });
    }

    return translations[text] || text;
  }, [language, translations, pendingTexts, translateBatch]);

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t, isTranslating }}>
      {children}
    </TranslationContext.Provider>
  );
};
