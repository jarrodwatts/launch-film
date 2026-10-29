import type { CSSProperties } from "react";
import { Easing, interpolate } from "remotion";

import { BeliefIcon } from "./belief";
import { HERO_BELIEF, RECEIPTS } from "./data";
import { land, ramp } from "./motion";
import { BLUE, HEADLINE, INK, MUTED } from "./parts";
import { GREEN, Mark, Mascot3D, Marks, Status } from "./ui";

/** The card's size, and the size of the research step it grows out of (the header starts as one). */
export const W = 1120;
export const STEP = 96;
const HEAD = 210;
const MOVE = 112;
const MOVE_GAP = 14;
const CHIP = 92;
const CHIP_GAP = 16;
const BUTTON_TOP = HEAD + 28 + 4 * (MOVE + MOVE_GAP) + 14;
export const BUTTON_Y = BUTTON_TOP + 60;
export const CARD_H = BUTTON_TOP + 120 + 40;
/** The top of each move's row once the card has formed. */
export const moveTop = (i: number) => HEAD + 28 + i * (MOVE + MOVE_GAP);
const DEPTH = 44;

/** The surface every row in the film's app shares: white, a hairline, a soft shadow. */
export const ROW: CSSProperties = { background: "#fff", boxShadow: "inset 0 0 0 1.5px rgb(20 40 90 / 0.07), 0 14px 30px -14px rgb(40 70 140 / 0.3)" };

/** A green disc with a white tick that pops in with a little overshoot (it's an object, so it may bounce). */
function Tick({ size, t, colour = GREEN, mark = "white" }: { readonly size: number; readonly t: number; readonly colour?: string; readonly mark?: string }) {
  const pop = interpolate(t, [0, 0.6, 1], [0, 1.25, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ width: size, height: size, borderRadius: 999, background: colour, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${pop})`, flex: "none" }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" stroke={mark} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.min(1, t * 1.4)} />
      </svg>
    </div>
  );
}

/** A band of light sweeping across a surface, from `at`, over `length` frames. */
export function Gloss({ frame, at, length = 14, radius = 52 }: { readonly frame: number; readonly at: number; readonly length?: number; readonly radius?: number }) {
  const t = ramp(frame, at, length, 0, 1, Easing.bezier(0.4, 0, 0.2, 1));
  if (t <= 0 || t >= 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: radius,
        pointerEvents: "none",
        background: `linear-gradient(115deg, transparent ${t * 160 - 50}%, rgb(255 255 255 / 0.85) ${t * 160 - 35}%, transparent ${t * 160 - 20}%)`,
        mixBlendMode: "screen",
      }}
    />
  );
}

/**
 * The position, grown from the research step that found it. Until `found` it is that step
 * ("Finding the right picks..."); then Auni blue wipes across it ("Found 4 moves") and the moves
 * drop out of it as chips. From `form` to `formed`, one thing at a time: the label rolls out and
 * the chips square up to the card's width, the step grows into the header with the card's body
 * growing down around the chips, and the belief rises into the header. The tap turns the button
 * into a progress bar, each move rolls over to placed, and at `allIn` the bar turns green and
 * Auni slides out beside the card and hops.
 * Drawn at its own origin (top left), in 3D; `blur(y)` is the camera's focus at a height on it.
 */
export function PositionCard({
  frame,
  found,
  chipsAt,
  form,
  formed,
  tapAt,
  receiptsAt,
  allInAt,
  blur,
}: {
  readonly frame: number;
  readonly found: number;
  readonly chipsAt: number;
  readonly form: number;
  readonly formed: number;
  readonly tapAt: number;
  readonly receiptsAt: readonly number[];
  readonly allInAt: number;
  readonly blur: (y: number) => number;
}) {
  const roll = ramp(frame, form, 5, 0, 1, Easing.in(Easing.cubic));
  const wide = ramp(frame, form, 9);
  const f = ramp(frame, form + 3, formed - form - 3, 0, 1, Easing.bezier(0.65, 0, 0.25, 1));
  const belief = ramp(frame, formed - 11, 10);
  // The button pops in once the body has grown past it.
  const button = land(frame, formed - 3, 7);
  const head = interpolate(f, [0, 1], [STEP, HEAD]);
  const isFound = frame >= found;
  const fill = ramp(frame, found, 6, 0, 1, Easing.bezier(0.5, 0, 0.2, 1));
  const lift = land(frame, found, 7) - land(frame, form, 10);
  const done = ramp(frame, found, 5);
  const allIn = ramp(frame, allInAt, 6);
  const press = interpolate(frame - tapAt, [-2, 0, 5], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const placed = receiptsAt.filter((at) => frame >= at).length;
  const progress = receiptsAt.reduce((sum, at) => sum + ramp(frame, at, 6), 0) / receiptsAt.length;
  const punch = interpolate(frame - allInAt, [0, 3, 12], [1, 1.06, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const peek = land(frame, allInAt + 2, 9);
  const body = interpolate(f, [0, 1], [STEP, CARD_H]);
  // The body is white the moment it shows, so its edge never shows through it.
  const solid = ramp(frame, form + 2, 3, 0, 1, (t) => t);
  // The step's line, in ink on white; the white copy is cut to the blue as it wipes across.
  const label = (light: boolean) => (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", gap: 22, paddingLeft: 22, clipPath: light ? `inset(0 ${100 - 100 * fill}% 0 0)` : undefined }}>
      {!isFound ? (
        <div style={{ transform: `rotate(${frame * 24}deg)` }}>
          <Status size={50} done={0} />
        </div>
      ) : light ? (
        <Tick size={50} t={done} colour="#fff" mark={BLUE} />
      ) : (
        <Tick size={50} t={done} colour={BLUE} />
      )}
      <div style={{ fontSize: 42, fontWeight: isFound ? 700 : 600, color: light ? "#fff" : isFound ? INK : MUTED, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>{isFound ? "Found 4 moves" : "Finding the right picks..."}</div>
    </div>
  );
  return (
    <div style={{ position: "relative", width: W, transformStyle: "preserve-3d" }}>
      {/* Auni, behind the card: it slides out to stand clear beside it when the moves are all in, and hops. */}
      {frame >= allInAt ? (
        <div style={{ position: "absolute", left: W + 40, top: -10, transform: `translateX(${(peek - 1) * 350}px) translateZ(${-DEPTH - 20}px)`, opacity: Math.min(1, peek * 4) }}>
          <Mascot3D shot="hop" frame={frame - allInAt - 6} size={300} />
        </div>
      ) : null}
      {/* The card's body, with an edge so it reads as a slab when the camera turns, and its shadow. */}
      {solid >= 1
        ? Array.from({ length: 8 }, (_, i) => (
            <div key={i} style={{ position: "absolute", left: 0, top: 0, width: W, height: body, borderRadius: 52, background: i === 7 ? "#9fb0e2" : "#c7d2f4", transform: `translateZ(${-((i + 1) * DEPTH) / 8}px)` }} />
          ))
        : null}
      {f > 0 ? <div style={{ position: "absolute", left: 90, right: 90, top: body - 40, height: 120, borderRadius: 999, background: "rgb(40 70 140 / 0.28)", filter: "blur(55px)", transform: `translateZ(${-DEPTH - 160}px)`, opacity: f }} /> : null}
      {solid > 0 ? <div style={{ position: "absolute", left: 0, top: 0, width: W, height: body, borderRadius: 52, ...ROW, opacity: solid }} /> : null}

      {/* The moves: chips that drop out of "Found 4 moves", square up to the card, then stretch into its rows. */}
      {RECEIPTS.map((r, i) => {
        const drop = land(frame, chipsAt + i * 4, 9);
        if (frame < chipsAt + i * 4) return null;
        const y0 = STEP + 22 + i * (CHIP + CHIP_GAP);
        const y1 = moveTop(i);
        // Each one slides down out of the step, behind the ones already out, so they never cross.
        const top = interpolate(f, [0, 1], [y0, y1]) - (1 - drop) * (CHIP + CHIP_GAP) * (i + 1);
        const h = interpolate(f, [0, 1], [CHIP, MOVE]);
        const at = receiptsAt[i]!;
        const landed = ramp(frame, at, 6, 0, 1, (t) => t);
        // What to do lifts and fades out, then what was done rises in (unless they read the same).
        const swap = r.did === r.move ? [0, 0] : [Math.min(1, landed * 2), Math.max(0, landed * 2 - 1)];
        const pop = land(frame, at, 6) - land(frame, at + 6, 12);
        const working = frame >= tapAt && frame < at;
        return (
          <div
            key={r.move}
            style={{
              position: "absolute",
              left: interpolate(wide, [0, 1], [(W - 720) / 2, 30]),
              top,
              width: interpolate(wide, [0, 1], [720, W - 60]),
              height: h,
              borderRadius: interpolate(f, [0, 1], [CHIP / 2, 30]),
              ...ROW,
              boxShadow: `inset 0 0 0 1.5px rgb(20 40 90 / ${0.07 + 0.05 * f}), 0 ${14 + 20 * pop}px ${30 + 20 * pop}px -14px rgb(40 70 140 / ${0.3 * (1 - f) + 0.12 + 0.2 * pop})`,
              display: "flex",
              alignItems: "center",
              gap: 24,
              padding: "0 28px 0 20px",
              transform: `translateZ(${12 - 2 * i + 50 * pop - 30 * (1 - drop)}px) scale(${interpolate(drop, [0, 1], [0.85, 1])})`,
              opacity: Math.min(1, drop * 3),
              filter: `blur(${blur(top + h / 2)}px)`,
            }}
          >
            {/* Waiting, working on it, placed. */}
            <div style={{ width: 60 * f, height: 60, flex: "none", position: "relative", opacity: f }}>
              {landed > 0 ? (
                <Tick size={60} t={landed} />
              ) : working ? (
                <div style={{ transform: `rotate(${(frame - tapAt) * 22}deg)` }}>
                  <Status size={60} done={0} />
                </div>
              ) : (
                <div style={{ width: 60, height: 60, boxSizing: "border-box", borderRadius: 999, border: "4px solid #d5dbe6" }} />
              )}
            </div>
            <Mark name={r.logo} size={interpolate(f, [0, 1], [60, 70])} />
            <div style={{ flex: 1, position: "relative", height: "100%" }}>
              {/* The label turns over from what to do to what was done, one out before the other comes in. */}
              <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 58, marginTop: -29 - 18 * f }}>
                {[r.move, r.did].map((text, k) => (
                  <div key={k} style={{ position: "absolute", left: 0, top: 0, fontSize: 42, lineHeight: "58px", fontWeight: 600, color: INK, letterSpacing: "-0.02em", whiteSpace: "nowrap", opacity: k ? swap[1] : 1 - swap[0]!, transform: `translateY(${k ? (1 - swap[1]!) * 25 : -swap[0]! * 25}%)` }}>
                    {text}
                  </div>
                ))}
              </div>
              <div style={{ position: "absolute", left: 0, top: "50%", display: "flex", alignItems: "center", gap: 10, fontSize: 30, fontWeight: 500, color: MUTED, opacity: ramp(f, 0.5, 0.5, 0, 1, (t) => t), transform: `translateY(${10 + 10 * (1 - f)}px)` }}>
                <Mark name={r.whereLogo} size={30} />
                {r.where}
              </div>
            </div>
            <Gloss frame={frame} at={at} length={12} radius={30} />
          </div>
        );
      })}

      {/* The button, which becomes the progress of the moves being placed. */}
      {button > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 30,
            top: BUTTON_TOP,
            width: W - 60,
            height: 120,
            borderRadius: 999,
            overflow: "hidden",
            background: "#141414",
            color: "#fff",
            transform: `translateZ(6px) scale(${interpolate(button, [0, 1], [0.85, 1]) * (1 - 0.05 * press) * punch})`,
            opacity: Math.min(1, button * 3),
            filter: `blur(${blur(BUTTON_Y)}px)`,
          }}
        >
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${100 * Math.max(progress, allIn)}%`, background: allIn > 0 ? GREEN : BLUE, borderRadius: 999 }} />
          <div style={{ position: "relative", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 22, fontSize: 46, fontWeight: 600, letterSpacing: "-0.02em" }}>
            {frame < tapAt ? (
              <>
                Start with $100
                <Marks names={HERO_BELIEF.logos} size={54} />
              </>
            ) : allIn > 0 ? (
              <>
                <Tick size={58} t={allIn} colour="#fff" mark={GREEN} />
                All 4 moves placed
              </>
            ) : (
              `Placing ${Math.max(1, placed)} of ${receiptsAt.length}`
            )}
          </div>
          <Gloss frame={frame} at={allInAt} length={14} radius={999} />
        </div>
      ) : null}

      {/* The header: the research step that found the moves, growing into the belief. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: head,
          borderRadius: `${interpolate(f, [0, 1], [30, 52])}px ${interpolate(f, [0, 1], [30, 52])}px ${interpolate(f, [0, 1], [30, 0])}px ${interpolate(f, [0, 1], [30, 0])}px`,
          overflow: "hidden",
          ...ROW,
          boxShadow: isFound ? `0 ${20 + 16 * lift}px ${44 + 20 * lift}px -16px rgb(61 99 224 / ${0.55 * lift + 0.1})` : ROW.boxShadow,
          transform: `translateZ(${8 + 70 * lift}px)`,
          filter: `blur(${blur(head / 2)}px)`,
        }}
      >
        {/* Auni blue wipes in from the left the moment the moves are found. */}
        <div style={{ position: "absolute", inset: 0, background: BLUE, clipPath: `inset(0 ${100 - 100 * fill}% 0 0)`, boxShadow: "inset 0 2px 0 rgb(255 255 255 / 0.3)" }} />
        {roll < 1 ? (
          <div style={{ position: "absolute", left: 0, top: 0, width: W, height: STEP, transform: `translateY(${-roll * STEP}px)` }}>
            {label(false)}
            {label(true)}
          </div>
        ) : null}
        <div style={{ position: "absolute", left: 50, top: 0, height: head, display: "flex", alignItems: "center", gap: 36, color: "#fff", opacity: belief, transform: `translateY(${(1 - belief) * 50}px)` }}>
          <div style={{ transform: `scale(${interpolate(belief, [0, 1], [0.6, 1])})` }}>
            <BeliefIcon size={126} />
          </div>
          <div>
            <div style={{ fontSize: 32, fontWeight: 600, opacity: 0.85, marginBottom: 6 }}>Your belief</div>
            <div style={{ ...HEADLINE, fontSize: 72, color: "#fff", whiteSpace: "nowrap" }}>{HERO_BELIEF.name}</div>
          </div>
        </div>
        <Gloss frame={frame} at={found + 3} length={12} radius={0} />
        <Gloss frame={frame} at={formed - 2} length={14} radius={0} />
        <Gloss frame={frame} at={allInAt} length={14} radius={0} />
      </div>
    </div>
  );
}

// Each coin: which move it is, and the spot in the frame's margins it hangs at (x, y, on screen):
// three either side of the card, the right ones below Auni.
const COIN_SPOTS = [
  [0, 190, 260], [1, 140, 560], [3, 230, 860],
  [2, 1640, 640], [3, 1790, 470], [0, 1790, 860],
] as const;

/**
 * The four moves as coins, a few of each: they slide out from behind the card's sides into the
 * margins either side of it, hang there turning for a moment, then rush out past the frame's edges.
 */
export function Coins({ frame, at }: { readonly frame: number; readonly at: number }) {
  if (frame < at || frame > at + 32) return null;
  return (
    <div style={{ position: "absolute", inset: 0, perspective: 1600 }}>
      {COIN_SPOTS.map(([move, x, y], i) => {
        const r = RECEIPTS[move];
        const start = at + (i % 4);
        const out = land(frame, start, 10, 30);
        const rush = ramp(frame, start + 10, 16, 0, 1, Easing.in(Easing.quad));
        const side = x < 960 ? -1 : 1;
        // From just inside the card's side, out to its spot, then on out of the frame.
        const from = side < 0 ? 600 : 1320;
        const size = 150 + (i % 3) * 40;
        return (
          <div key={i} style={{ position: "absolute", left: from + (x - from) * out + side * 900 * rush - size / 2, top: y - size / 2, transformStyle: "preserve-3d", transform: `scale(${0.6 + 0.4 * out + 0.8 * rush}) rotateY(${Math.sin((frame - start) / 6 + i) * 45}deg)`, opacity: Math.min(1, out * 4) }}>
            {Array.from({ length: 6 }, (_, j) => (
              <div key={j} style={{ position: "absolute", width: size, height: size, borderRadius: 999, background: j === 5 ? "#aab8e6" : "#d5ddf3", transform: `translateZ(${-j * 3}px)` }} />
            ))}
            <Mark name={r.logo} size={size} ring style={{ position: "relative" }} />
          </div>
        );
      })}
    </div>
  );
}

const CONFETTI = ["#3d63e0", "#7fa8ff", "#ffe3d6", "#1f9d55", "#101623", "#ffd6a8"];

/** Two bursts from the frame's bottom corners, crossing the whole frame, then falling and turning. */
export function Confetti({ frame, at }: { readonly frame: number; readonly at: number }) {
  const t = (frame - at) / 30;
  if (t < 0 || t > 2) return null;
  return (
    <>
      {Array.from({ length: 96 }, (_, i) => {
        // A fixed scatter per piece, so every render is the same.
        const r1 = Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1);
        const r2 = Math.abs((Math.sin(i * 78.233) * 12345.678) % 1);
        const side = i % 2 ? 1 : -1;
        const angle = -Math.PI / 2 - side * (0.2 + r1 * 0.6);
        const speed = 2600 + r2 * 1900;
        const x = 960 + side * 1000 + Math.cos(angle) * speed * t;
        const y = 1120 + Math.sin(angle) * speed * t + 2600 * t * t;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: 22 + r2 * 12, height: 38, borderRadius: 6, background: CONFETTI[i % CONFETTI.length], transform: `rotate(${(r1 + t * 3) * 360}deg) rotateX(${t * 720 * (i % 2 ? 1 : -1)}deg)` }} />
        );
      })}
    </>
  );
}
