import { Easing } from "remotion";

import { ramp } from "../engine/motion";

/**
 * A band of light sweeping once across a surface at 115 degrees, from frame `at` over `length`
 * frames, in screen blend. Put it last inside any rounded box (position: relative) and match its
 * radius. Use it to say "done" or "this is the product": a card going face-on, a logo landing.
 */
export function Gloss({ frame, at, length = 14, radius = 0, strength = 0.85 }: { readonly frame: number; readonly at: number; readonly length?: number; readonly radius?: number; readonly strength?: number }) {
  const t = ramp(frame, at, length, 0, 1, Easing.bezier(0.4, 0, 0.2, 1));
  if (t <= 0 || t >= 1) return null;
  const x = t * 160 - 35;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: radius,
        pointerEvents: "none",
        background: `linear-gradient(115deg, transparent ${x - 15}%, rgb(255 255 255 / ${strength}) ${x}%, transparent ${x + 15}%)`,
        mixBlendMode: "screen",
      }}
    />
  );
}
