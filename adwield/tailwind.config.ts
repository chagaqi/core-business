import type { Config } from "tailwindcss";

/**
 * Design tokens extracted verbatim from the approved Adwield "Command Deck"
 * reference (_newestsite-source.html). Colors, the gold HUD "panel" frame
 * system, and the rarity color system (gold / equip-cyan / epic-violet /
 * crit-amber / buff-green / danger-red) are the source of truth here.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // base surfaces
        bg: "#070A12",
        "bg-1": "#0A0F1A",

        // panel / HUD frame system
        "panel-a": "rgba(20,29,47,0.82)",
        "panel-b": "rgba(11,17,29,0.88)",
        frame: "rgba(150,190,225,0.24)",
        "frame-soft": "rgba(150,190,225,0.14)",
        "frame-glow": "rgba(110,170,225,0.18)",

        // gold crest / wordmark accents
        gold: "#E3C778",
        "gold-dim": "rgba(227,199,120,0.5)",

        // rarity color system
        equip: "#5EC8E6",
        "equip-deep": "#2E7E96",
        epic: "#A879F0",
        crit: "#F4A23B",
        danger: "#F2666B",
        buff: "#7CE0B0",

        // ink / type
        ink: "#E9ECF3",
        "ink-soft": "#AEB8C8",
        "ink-mute": "#76819A",
      },
      boxShadow: {
        "equip-glow": "0 0 24px -8px rgba(94,200,230,0.5)",
        "crit-glow": "0 0 24px -8px rgba(244,162,59,0.5)",
        "epic-glow": "0 0 24px -8px rgba(168,121,240,0.5)",
        "gold-glow": "0 0 24px -8px rgba(227,199,120,0.4)",
      },
      fontFamily: {
        // grotesk display + mono wordmark, wired in app/layout.tsx via next/font
        sans: ["var(--font-grotesk)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Helvetica", "Arial", "system-ui", "sans-serif"],
        display: ["var(--font-grotesk)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      maxWidth: {
        deck: "1140px",
      },
      letterSpacing: {
        tightest: "-0.03em",
      },
    },
  },
  plugins: [],
};

export default config;
