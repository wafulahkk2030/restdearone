import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "rdo_session_id";

const getSessionId = () => {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
};

const classifyReferrer = (ref: string, utmSource?: string | null) => {
  if (utmSource) return utmSource.toLowerCase();
  if (!ref) return "direct";
  try {
    const host = new URL(ref).hostname.replace(/^www\./, "");
    if (host === window.location.hostname) return "internal";
    if (/google\./.test(host)) return "google";
    if (/bing\./.test(host)) return "bing";
    if (/facebook|fb\.com/.test(host)) return "facebook";
    if (/instagram/.test(host)) return "instagram";
    if (/x\.com|twitter/.test(host)) return "x";
    if (/t\.co/.test(host)) return "x";
    if (/whatsapp|wa\.me/.test(host)) return "whatsapp";
    if (/linkedin|lnkd\.in/.test(host)) return "linkedin";
    if (/tiktok/.test(host)) return "tiktok";
    if (/youtube|youtu\.be/.test(host)) return "youtube";
    return host;
  } catch {
    return "other";
  }
};

const deviceType = () => {
  const w = window.innerWidth;
  if (w < 640) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
};

const browserName = () => {
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return "Edge";
  if (/OPR\//.test(ua)) return "Opera";
  if (/Chrome\//.test(ua)) return "Chrome";
  if (/Safari\//.test(ua)) return "Safari";
  if (/Firefox\//.test(ua)) return "Firefox";
  return "Other";
};

const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    const record = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const utmSource = params.get("utm_source");
        const { data } = await supabase.auth.getUser();
        if (cancelled) return;
        await supabase.from("page_views").insert({
          path: location.pathname,
          page_title: document.title?.slice(0, 200) ?? null,
          referrer: document.referrer ? document.referrer.slice(0, 500) : null,
          referrer_source: classifyReferrer(document.referrer, utmSource),
          utm_source: utmSource,
          utm_medium: params.get("utm_medium"),
          utm_campaign: params.get("utm_campaign"),
          session_id: getSessionId(),
          user_id: data?.user?.id ?? null,
          device_type: deviceType(),
          browser: browserName(),
          screen_width: window.innerWidth,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
      } catch {
        /* tracking must never break the page */
      }
    };
    const timer = window.setTimeout(record, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [location.pathname, location.search]);
};

export default usePageTracking;
