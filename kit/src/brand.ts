/**
 * The brand: colours, the type voice and the easing curves, copied from the product's own design
 * tokens. Replace every value here with the real product's. Nothing else in the film should
 * hard-code a colour or a curve.
 */
import { loadFont } from "@remotion/google-fonts/Inter";
import type { CSSProperties } from "react";
import { Easing } from "remotion";

// The product's own face is best. Inter is the open stand-in; it loads from Google Fonts at render time.
const { fontFamily } = loadFont("normal", { weights: ["400", "500", "600", "700", "800"], subsets: ["latin"] });

export const BRAND = {
  font: fontFamily,
  /** Main text. */
  ink: "#14151a",
  /** Secondary text. */
  muted: "#626877",
  /** The one brand colour: one word per headline, the button, the logo. */
  accent: "#ff5b3a",
  /** A done state. */
  good: "#17a34a",
  /** Cards and rows. */
  surface: "#ffffff",
  line: "#e6e3ef",
  /** The backdrop: a soft wash and the glows that drift over it. */
  backdrop: { top: "#f4f1ff", middle: "#faf8ff", bottom: "#fff6f1" },
  glows: ["#e3dcff", "#ffe1d4", "#ffffff"],
  /** The logo mark as one SVG path in a `markBox` square (the same shape as public/logos/acme.svg). For the iris and the lockup. */
  markPath:
    "M50 6C54.6 6 58 8.4 60.2 12.8L93.4 79.6C97.2 87.2 92 95 83.6 95H16.4C8 95 2.8 87.2 6.6 79.6L39.8 12.8C42 8.4 45.4 6 50 6ZM50 40.5L35.5 71H64.5Z",
  markBox: 100,
  /** The mark's outer edge only, with no holes: the iris cuts this shape. A path with cut-outs would
   * leave its holes as coloured bars flying over the picture while the iris opens. */
  markOutline: "M50 6C54.6 6 58 8.4 60.2 12.8L93.4 79.6C97.2 87.2 92 95 83.6 95H16.4C8 95 2.8 87.2 6.6 79.6L39.8 12.8C42 8.4 45.4 6 50 6Z",
} as const;

/** The headline voice: heavy, tight, set close. Use it for the few big lines, about 150px. */
export const HEADLINE: CSSProperties = { fontWeight: 700, letterSpacing: "-0.042em", lineHeight: 1.03, color: BRAND.ink };

/** The product's own curves: both arrive early and ease to rest. `settle` is the default for ramp() and land(). */
export const settle = Easing.bezier(0.22, 1, 0.36, 1);
export const drift = Easing.bezier(0.16, 1, 0.3, 1);
