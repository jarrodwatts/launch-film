import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill } from "remotion";

import { BRAND } from "../brand";
import { FPS } from "../engine/motion";

/**
 * The film's ground: a soft vertical wash with three big blurred glows drifting on the film's
 * clock, and an optional faint grid that clears around the middle. Pass the FILM frame
 * (useFilmFrame), so the glows don't jump at a cut. Banding check: final renders average 16
 * passes at 10 bits, so these gradients stay smooth; never stack see-through copies to blur them.
 */
export function Backdrop({ frame, grid = false, children }: { readonly frame: number; readonly grid?: boolean; readonly children?: ReactNode }) {
  const drift = (period: number, phase: number) => 0.5 - 0.5 * Math.cos(((frame / FPS + phase) / period) * Math.PI * 2);
  const glow = (style: CSSProperties, period: number, phase: number) => {
    const d = drift(period, phase);
    return <span style={{ position: "absolute", borderRadius: 999, filter: "blur(110px)", transform: `translate(${d * 4}vw, ${d * 3}vh) scale(${1 + 0.08 * d})`, ...style }} />;
  };
  const [a, b, c] = BRAND.glows;
  const { top, middle, bottom } = BRAND.backdrop;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${top} 0%, ${middle} 46%, ${bottom} 100%)`, overflow: "hidden" }}>
      {glow({ top: "-18%", left: "-12%", width: "58%", height: "52%", background: a, opacity: 0.75 }, 22, 0)}
      {glow({ right: "-14%", bottom: "-20%", width: "55%", height: "55%", background: b, opacity: 0.6 }, 27, 9)}
      {glow({ top: "22%", left: "30%", width: "40%", height: "40%", background: c, opacity: 0.9 }, 31, 4)}
      {grid ? (
        <AbsoluteFill
          style={{
            backgroundImage: `linear-gradient(to right, ${BRAND.line} 1px, transparent 1px), linear-gradient(to bottom, ${BRAND.line} 1px, transparent 1px)`,
            backgroundSize: "96px 96px",
            backgroundPosition: "center center",
            opacity: 0.6,
            maskImage: "radial-gradient(ellipse 75% 70% at 50% 46%, transparent 20%, #000 60%, transparent 100%)",
          }}
        />
      ) : null}
      {children}
    </AbsoluteFill>
  );
}
