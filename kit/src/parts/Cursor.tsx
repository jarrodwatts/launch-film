import { Easing, interpolate } from "remotion";

import { BRAND } from "../brand";
import { ramp } from "../engine/motion";

/**
 * A pointer that glides in on a curve from `from` (an offset from the target), presses the target
 * at frame `press` (it shrinks to 0.82 and a filled ripple `ring` px wide spreads out), and,
 * given `out`, slips away down and right. Aim at the EMPTY end of a button, never its label.
 * (x, y) are screen pixels; for a target on a 3D stage, get them from project().
 */
export function Cursor({ frame, x, y, from, start, press, ring = 200, out }: { readonly frame: number; readonly x: number; readonly y: number; readonly from: { readonly x: number; readonly y: number }; readonly start: number; readonly press: number; readonly ring?: number; readonly out?: number }) {
  const t = ramp(frame, start, press - start - 2, 0, 1, Easing.bezier(0.3, 0.7, 0.2, 1));
  if (frame < start) return null;
  const down = interpolate(frame - press, [-2, 0, 4], [1, 0.82, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const spread = ramp(frame, press, 12);
  const leave = out === undefined ? 0 : ramp(frame, out, 8, 0, 1, Easing.in(Easing.cubic));
  // The arrow's tip is at (4, 2.5) of its 24 grid, drawn at 64px.
  const tip = 64 / 24;
  return (
    <>
      {frame >= press && spread < 1 ? (
        <div style={{ position: "absolute", left: x - ring / 2, top: y - ring / 2, width: ring, height: ring, borderRadius: 999, background: "rgb(255 255 255 / 0.4)", boxShadow: `inset 0 0 0 8px ${BRAND.accent}`, opacity: 1 - spread * spread, transform: `scale(${0.3 + 0.7 * spread})` }} />
      ) : null}
      <div style={{ position: "absolute", left: x + from.x * (1 - t) + Math.sin(t * Math.PI) * 50 + leave * 300 - 4 * tip, top: y + from.y * (1 - t) + leave * 400 - 2.5 * tip, opacity: Math.min(1, t * 4) * (1 - leave) }}>
        <svg width="64" height="64" viewBox="0 0 24 24" style={{ transform: `scale(${down})`, transformOrigin: "4px 2.5px", filter: "drop-shadow(0 6px 10px rgb(16 22 35 / 0.3))" }}>
          <path d="M4 2.5 L4 19 L8.6 14.8 L11.6 21.4 L14.4 20.2 L11.4 13.7 L17.6 13.5 Z" fill={BRAND.ink} stroke="white" strokeWidth={1.4} strokeLinejoin="round" />
        </svg>
      </div>
    </>
  );
}
