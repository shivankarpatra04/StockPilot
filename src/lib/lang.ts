// filepath: src/lib/lang.ts
//
// Central "voice" layer for StockPilot.
//
// The app is built for FIRST-TIME investors. There are two voices, chosen by the
// user in Settings → Preferences:
//
//   • "expert"  → plain, beginner-friendly ENGLISH. We avoid jargon; whenever a
//                 technical term is genuinely needed, it is explained in brackets
//                 right where it appears, e.g. "RSI (a 0–100 momentum meter)".
//
//   • "simple"  → HINGLISH (Hindi + English in Roman script) with friendly emojis,
//                 for users who are not comfortable reading English. Every part of
//                 the app should be fully understandable in this voice.
//
// NOTE: the persisted store flag is `isSimpleMode` (true → "simple"/Hinglish).
// Use `modeFromSimple()` to convert it into a Mode everywhere.

export type Mode = "simple" | "expert";

export const modeFromSimple = (isSimpleMode: boolean): Mode =>
  isSimpleMode ? "simple" : "expert";

export const isMode = (value: string | null | undefined): value is Mode =>
  value === "simple" || value === "expert";

// ---------------------------------------------------------------------------
// Short label pairs reused across the dashboard.
// ---------------------------------------------------------------------------

type Pair = { expert: string; simple: string };

export const LABELS = {
  // BuySellZones — section headings
  buyZones: { expert: "Buy Zones — good prices to buy", simple: "💰 Khareedne ke acche daam" },
  sellZones: { expert: "Sell Zones — good prices to sell", simple: "🏷️ Bechne ke acche daam" },
  successChance: { expert: "Chance of Success", simple: "🎯 Profit ka chance" },
  keyLevels: { expert: "Key Levels & Numbers", simple: "🔑 Zaroori numbers" },
  riskReward: { expert: "Risk vs Reward", simple: "⚖️ Risk vs Faayda" },

  // ClaudeBriefingCard — sub-label under the title
  briefingMode: { expert: "Simple English mode", simple: "Hinglish mode 🇮🇳" },

  // AIStockScreener — subtitle
  screenerSubtitle: {
    expert: "Browse stocks and tap any card to see a plain-English breakdown.",
    simple: "📋 Stocks dekho aur kisi bhi card par tap karke poori jaankari paao.",
  },
} satisfies Record<string, Pair>;

export type LabelKey = keyof typeof LABELS;

/** Pick the right label for the current voice. */
export const t = (mode: Mode, key: LabelKey): string => LABELS[key][mode];

// ---------------------------------------------------------------------------
// Glossary — plain one-liners for jargon, so "expert" English mode stays
// beginner-safe. `explain()` returns a ready-to-drop bracketed hint.
// ---------------------------------------------------------------------------

export const GLOSSARY: Record<string, Pair> = {
  rsi: {
    expert: "a 0–100 meter; below 30 means oversold/cheap, above 70 means overbought/pricey",
    simple: "stock kitna garam (mehenga) ya thanda (sasta) hai",
  },
  sma: {
    expert: "the average price over recent days",
    simple: "pichle kuch dino ka average daam",
  },
  support: {
    expert: "a price level where the stock usually stops falling",
    simple: "woh daam jahan girna ruk jaata hai",
  },
  resistance: {
    expert: "a price level where the stock usually stops rising",
    simple: "woh daam jahan badhna ruk jaata hai",
  },
  stopLoss: {
    expert: "the price where you sell to limit your loss if it goes wrong",
    simple: "safety daam — yahan bech do taaki zyada nuksan na ho",
  },
  target: {
    expert: "the price where you book your profit",
    simple: "woh daam jahan profit le lena chahiye",
  },
  riskReward: {
    expert: "how much you could gain compared to how much you could lose",
    simple: "kitna faayda ho sakta hai vs kitna nuksan",
  },
};

/** A bracketed plain-language hint for a term, e.g. `RSI ${explain("rsi", mode)}`. */
export const explain = (term: keyof typeof GLOSSARY, mode: Mode): string =>
  `(${GLOSSARY[term][mode]})`;

// ---------------------------------------------------------------------------
// Tiny phrasing helpers shared by the narrative generators (API routes).
// ---------------------------------------------------------------------------

/** Format a signed percentage, e.g. +2.34% / -1.10%. */
export const pct = (n: number): string => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;

/**
 * Buy-score reasoning in both voices. Mirrors the 4 score tiers in
 * `src/lib/score.ts` (which stays English-only because it's shared with the
 * backtest harness) — this is the display-facing, voice-aware version.
 */
export function buildBuyReasoning(
  mode: Mode,
  f: { score: number; rsi: number; support: number; resistance: number }
): string {
  const { score, rsi, support, resistance } = f;
  const r = rsi.toFixed(0);
  const sup = support.toFixed(2);
  const res = resistance.toFixed(2);

  if (mode === "simple") {
    if (score >= 75)
      return `Bahut accha mauka 🚀 RSI ${r} matlab stock kaafi sasta (thanda ❄️) hai, aur ₹${sup} ke support ke paas hai (yahan girna rukta hai 🛡️).`;
    if (score >= 60)
      return `Achhi taqat 💪 Stock apne pichle dino ke average se upar chal raha hai 📈 — trend mazboot lag raha hai.`;
    if (score >= 45)
      return `Filhaal shaant hai 😐 ₹${sup} aur ₹${res} ke beech ghoom raha hai. Saaf signal ka intezaar karo.`;
    return `Sambhal ke ⚠️ RSI ${r} matlab stock garam (mehenga 🔥) ho gaya hai. ₹${res} ke paas girne ka risk hai.`;
  }

  if (score >= 75)
    return `Strong buy opportunity. RSI is ${r} (a 0–100 meter; under 30 means oversold/cheap) and the price is near support at ₹${sup} (a level where it usually stops falling).`;
  if (score >= 60)
    return `Good upward momentum — the price is trading above its recent average, so the trend looks healthy.`;
  if (score >= 45)
    return `Moving sideways for now, between ₹${sup} and ₹${res}. Better to wait for a clearer signal.`;
  return `Looks overbought — RSI is ${r} (above 70 means pricey/stretched), with a pullback risk near resistance at ₹${res}.`;
}

/** Verdict-action phrasing in both voices. */
export const ACTION_PHRASE: Record<"Long" | "Short" | "Wait", Pair> = {
  Long: {
    expert: "looks like a buying opportunity",
    simple: "abhi khareedne layak lag raha hai 📈",
  },
  Short: {
    expert: "looks weak right now — better to avoid or wait",
    simple: "abhi kamzor hai — rukna behtar hai ⚠️",
  },
  Wait: {
    expert: "is unclear right now — best to wait for a clearer signal",
    simple: "abhi confuse kar raha hai — thoda ruk jaao 🤔",
  },
};
