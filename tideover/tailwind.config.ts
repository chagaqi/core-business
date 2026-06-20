import type { Config } from "tailwindcss";

/**
 * Design tokens for Tideover, extracted verbatim from the approved brand kit and
 * `_tideover-source.html`. This is a WARM, LIGHT trust-and-empathy system — the
 * deliberate opposite of Adwield's dark HUD. Sea-teal + terracotta on sand.
 *
 * Source of truth: sea-teal #0E5366 (dark surfaces / brand), terracotta #D9762F
 * (accent / CTA), sand #FBF8F2 (page bg), ink #11252A (type). No gaming theme.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // surfaces
        sand: "#FBF8F2", // page background (warm off-white)
        "sand-2": "#F4EEE2", // alt section band
        paper: "#FFFFFF", // cards
        teal: "#0E5366", // brand / dark surfaces
        "teal-700": "#0B404F",
        "teal-300": "#3C7E92",
        "accent-card": "#E4EEF0", // light teal info boxes

        // accent / CTA
        terracotta: "#D9762F",
        "terracotta-600": "#C25C29",
        "terracotta-300": "#E0833D",
        tan: "#E9B486", // warm tan, dark-section emphasis

        // ink / type
        ink: "#11252A", // headlines / body (near-black cool)
        slate: "#374A4F", // secondary copy
        "ink-inverse": "#F4F9F9", // text on dark
        "ink-mute": "#6A7B80", // muted labels

        // lines / state
        border: "#EBE2D0", // warm card borders/dividers
        "risk-red": "#C0463B",
        "risk-amber": "#D9762F",
        "risk-green": "#3E8E6E",
      },
      fontFamily: {
        // Fraunces (warm serif ≈ Iowan Old Style) display; Inter body.
        // Wired in app/layout.tsx via next/font/google as CSS vars.
        serif: ["var(--font-fraunces)", "Iowan Old Style", "Palatino", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(17,37,42,0.04), 0 8px 24px -16px rgba(17,37,42,0.18)",
        lift: "0 12px 32px -16px rgba(17,37,42,0.28)",
        cta: "0 10px 24px -12px rgba(217,118,47,0.5)",
      },
      maxWidth: {
        wrap: "1160px",
      },
      backgroundImage: {
        "cta-gradient": "linear-gradient(135deg, #E0833D 0%, #C25C29 100%)",
      },
      letterSpacing: {
        tightish: "-0.02em",
      },
    },
  },
  plugins: [],
};

export default config;
