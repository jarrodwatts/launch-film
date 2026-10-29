import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";

import { MascotArt } from "./vendor/mascot-art";

// Auni's own tokens (tokens.css, globals.css).
export const INK = "#101623";
export const MUTED = "#5c6472";
export const BORDER = "#e3e8f2";
export const BUBBLE = "#eef1f7";
export const BLUE = "#3d63e0";

/** The headline voice of auni.io: heavy, tight, set close. */
export const HEADLINE: CSSProperties = { fontWeight: 700, letterSpacing: "-0.042em", lineHeight: 1.03, color: INK };

/** The mascot's body outline (mascot-art.tsx), for masks and wipes in its shape. */
export const MASCOT_PATH =
  "M43 145C48 108 77 60 114 46C139 36 176 39 197 53C212 63 209 81 202 94C214 117 226 139 224 162C226 200 199 222 147 225C93 228 58 211 46 182C41 171 40 157 43 145Z";

/**
 * The landing's sky (globals.css .auni-sky): a pale blue-to-warm wash with three soft glows
 * that drift on the film's clock, and the faint blue grid that clears around the middle.
 */
export function Sky({ children, grid = true }: { readonly children?: ReactNode; readonly grid?: boolean }) {
  const frame = useCurrentFrame();
  const drift = (period: number, phase = 0) => 0.5 - 0.5 * Math.cos(((frame / 30 + phase) / period) * Math.PI * 2);
  const glow = (style: CSSProperties, period: number, phase: number) => {
    const d = drift(period, phase);
    return (
      <span
        style={{
          position: "absolute",
          borderRadius: 999,
          filter: "blur(110px)",
          transform: `translate(${d * 4}vw, ${d * 3}vh) scale(${1 + 0.08 * d})`,
          ...style,
        }}
      />
    );
  };
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #edf2ff 0%, #f6f8ff 46%, #fbf8f7 100%)", overflow: "hidden" }}>
      {glow({ top: "-18%", left: "-12%", width: "58%", height: "52%", background: "#d7e3ff", opacity: 0.7 }, 22, 0)}
      {glow({ right: "-14%", bottom: "-20%", width: "55%", height: "55%", background: "#ffe3d6", opacity: 0.55 }, 27, 9)}
      {glow({ top: "22%", left: "30%", width: "40%", height: "40%", background: "#ffffff", opacity: 0.9 }, 31, 4)}
      {grid ? (
        <AbsoluteFill
          style={{
            backgroundImage: `linear-gradient(to right, rgb(61 99 224 / 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgb(61 99 224 / 0.05) 1px, transparent 1px)`,
            backgroundSize: "96px 96px",
            backgroundPosition: "center center",
            maskImage: "radial-gradient(ellipse 75% 70% at 50% 46%, transparent 20%, #000 60%, transparent 100%)",
          }}
        />
      ) : null}
      {children}
    </AbsoluteFill>
  );
}

/** A plain field of ink, for the beat of black before the drop. */
export function Ink() {
  return <AbsoluteFill style={{ background: INK }} />;
}

/**
 * A flat frame (ink by default) giving way through Auni's own silhouette: `open` 0 is all colour, 1 is gone.
 * The shape grows from the middle until it covers the frame.
 */
export function MascotIris({ open, colour = INK }: { readonly open: number; readonly colour?: string }) {
  if (open >= 1) return null;
  const scale = 0.02 + open * 22;
  return (
    <AbsoluteFill>
      <svg width="1920" height="1080" viewBox="0 0 1920 1080">
        <defs>
          <mask id="iris">
            <rect width="1920" height="1080" fill="white" />
            <path d={MASCOT_PATH} fill="black" transform={`translate(960 560) scale(${scale}) translate(-133 -133)`} />
          </mask>
        </defs>
        <rect width="1920" height="1080" fill={colour} mask="url(#iris)" />
      </svg>
    </AbsoluteFill>
  );
}

export function Logo({ name, size, ring = false }: { readonly name: string; readonly size: number; readonly ring?: boolean }) {
  return (
    <Img
      src={staticFile(`logos/${name}.svg`)}
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        boxShadow: ring ? `0 0 0 ${size * 0.08}px #fff, 0 2px 6px rgb(20 40 90 / 0.14)` : "0 0 0 1px rgb(15 23 42 / 0.06)",
      }}
    />
  );
}

/** The landing's overlapping logo stack. */
export function Logos({ names, size }: { readonly names: readonly string[]; readonly size: number }) {
  return (
    <div style={{ display: "flex" }}>
      {names.map((name, i) => (
        <div key={name} style={{ marginLeft: i ? -size * 0.2 : 0 }}>
          <Logo name={name} size={size} ring />
        </div>
      ))}
    </div>
  );
}

/** Auni's own mascot, from the web app, with its gaze set by the film. */
export function Mascot({ size, lookX = 0, lookY = 0 }: { readonly size: number; readonly lookX?: number; readonly lookY?: number }) {
  return (
    <div style={{ width: size, height: size }}>
      <style>{`.auni-mascot-face{transform:translate(${lookX}px,${lookY}px)}`}</style>
      <MascotArt />
    </div>
  );
}

export function Check({ size, drawn }: { readonly size: number; readonly drawn: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2.2} strokeLinecap="round">
      <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - drawn} />
    </svg>
  );
}
