export const countryFlags: Record<string, string> = {
  KE: "🇰🇪", NG: "🇳🇬", ZA: "🇿🇦", GH: "🇬🇭", TZ: "🇹🇿", UG: "🇺🇬",
  ET: "🇪🇹", RW: "🇷🇼", US: "🇺🇸", GB: "🇬🇧", CA: "🇨🇦", AU: "🇦🇺",
  DE: "🇩🇪", FR: "🇫🇷", IN: "🇮🇳", BR: "🇧🇷", JP: "🇯🇵", AE: "🇦🇪",
  SA: "🇸🇦", CN: "🇨🇳", ZW: "🇿🇼", MW: "🇲🇼", CD: "🇨🇩", CM: "🇨🇲", SN: "🇸🇳",
};

export const getFlag = (code: string | null | undefined): string => {
  if (!code) return "🌍";
  return countryFlags[code.toUpperCase()] || "🌍";
};
