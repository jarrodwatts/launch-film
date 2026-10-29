import { AbsoluteFill, Easing, Freeze, interpolate } from "remotion";

import { BeliefIcon } from "../belief";
import { Gloss } from "../card";
import { HERO, HERO_BELIEF, RECEIPTS, TAKES } from "../data";
import { accelerate, beat, bf, land, ramp, T, useFilmFrame } from "../motion";
import { BLUE, HEADLINE, INK, MUTED, Sky } from "../parts";
import { type Add, s, WOOSH } from "../sound";
import { GREEN, Mark, Tweet } from "../ui";
import { Reveal } from "./reveal";

const F = T.flip;
const R = T.reveal;
const W = 1000;
const ROW = 112;
/** How far the whip pans: the placed card goes off the left as the take comes in from the right. */
const PAN = 1900;
/** Where the other takes sit, out of focus: one above the headline, one below the tweet. */
const BEHIND = [{ take: 2, x: 120, y: 40 }, { take: 5, x: 1180, y: 880 }];
/** The turn, in frames: it rocks back, turns over (edge-on at EDGE), and is flat again by LAND. */
const TURN = 14;
const EDGE = 6;
const LAND = 10;

/** The two lines of the headline, one after the other: they lift and blur out, the next rise in. */
function Lines({ lines, show, colour }: { readonly lines: readonly string[]; readonly show: (i: number) => number; readonly colour: (i: number) => string }) {
  return (
    <>
      {lines.map((line, i) => {
        const t = show(i);
        return (
          <div key={line} style={{ position: "absolute", top: i * 158, whiteSpace: "nowrap", color: colour(i), opacity: Math.min(1, t * 1.6), transform: `translateY(${(1 - t) * 50}px)`, filter: `blur(${(1 - t) * 14}px)` }}>
            {line}
          </div>
        );
      })}
    </>
  );
}

/** A green disc whose white tick draws itself in, with a little overshoot as it pops. */
function Tick({ size, t }: { readonly size: number; readonly t: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 999, background: GREEN, display: "flex", alignItems: "center", justifyContent: "center", flex: "none", transform: `scale(${interpolate(t, [0, 0.6, 1], [0, 1.25, 1])})`, boxShadow: "0 6px 16px rgb(31 157 85 / 0.35)" }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.min(1, t * 1.4)} />
      </svg>
    </div>
  );
}

/** The back of the take: the belief on flat Auni blue, and below it the four moves dealing out one by one. */
function Position({ frame, glossAt }: { readonly frame: number; readonly glossAt: number }) {
  return (
    <div style={{ position: "relative", width: W, borderRadius: 44, background: "#fff", overflow: "hidden", boxShadow: "inset 0 0 0 1.5px rgb(20 40 90 / 0.08), 0 30px 70px -18px rgb(40 70 140 / 0.35)" }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 30, padding: "40px 46px", background: BLUE, color: "#fff", boxShadow: "inset 0 2px 0 rgb(255 255 255 / 0.35)" }}>
        <div style={{ borderRadius: 999, padding: 8, background: "rgb(255 255 255 / 0.25)", boxShadow: "inset 0 0 0 2px rgb(255 255 255 / 0.5)" }}>
          <BeliefIcon size={112} />
        </div>
        <div>
          <div style={{ fontSize: 30, fontWeight: 600, opacity: 0.85, marginBottom: 8 }}>Your belief</div>
          <div style={{ ...HEADLINE, fontSize: 60, color: "#fff", whiteSpace: "nowrap" }}>{HERO_BELIEF.name}</div>
        </div>
      </div>
      {/* The body opens with the first move, so the turned card is all belief until then. */}
      <div style={{ padding: `${12 * land(frame, bf(F.rows[0]!), 7)}px 30px` }}>
        {RECEIPTS.map((r, i) => {
          const at = bf(F.rows[i]!);
          // Each row opens its own room in the card, then drops into it.
          const t = land(frame, at, 7);
          return (
            <div key={r.did} style={{ height: ROW * t, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 26, height: ROW, padding: "0 16px", opacity: Math.min(1, t * 2), transform: `translateY(${(1 - t) * -50}px)` }}>
                <Tick size={60} t={ramp(frame, at + 2, 7)} />
                <Mark name={r.logo} size={72} />
                <div>
                  <div style={{ fontSize: 42, fontWeight: 600, color: INK, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>{r.did}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 29, color: MUTED }}>
                    <Mark name={r.whereLogo} size={29} />
                    {r.where}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <Gloss frame={frame} at={glossAt} radius={44} />
    </div>
  );
}

/**
 * The point, on one screen. A whip lands on your take: "Your take." beside the tweet. On the
 * beat it lifts and turns over, and its back is the belief Auni built from it, the four moves
 * dealing out of it as "Now a position." rises in. Then the camera rushes through it.
 */
export function Flip() {
  const frame = useFilmFrame(F.start);
  const start = bf(F.start);
  const flip = bf(F.flip);
  const out = bf(F.out);
  const end = bf(F.end);
  // The whip pan, across the cut: it pulls away from the placed card, then brakes hard on your take.
  // The takes behind move slower, being further off.
  const whip = 1 - ramp(frame, start - 1, 9, 0, 1, Easing.bezier(0.3, 0, 0.1, 1));
  const turn = ramp(frame, flip, TURN, 0, 1, Easing.bezier(0.5, -0.3, 0.25, 1));
  const lift = Math.sin(turn * Math.PI);
  const swap = flip + EDGE;
  const through = ramp(frame, out, end - out, 0, 1, accelerate);
  // As the camera rushes in, the card comes to the middle, where Auni appears next.
  const centre = ramp(frame, out, end - out);
  const creep = ramp(frame, start, end - start, 0, 1, Easing.linear);
  const isBack = turn > 0.5;
  return (
    <Sky>
      <AbsoluteFill style={{ transformOrigin: "69% 50%", transform: `translateX(${-365 * centre}px) scale(${(1 + 0.05 * creep) * (1 + 7 * through)})`, filter: `blur(${through * 22}px)`, opacity: 1 - ramp(frame, end - 2, 2, 0, 1, Easing.linear) }}>
        {/* Everyone else's takes, out of focus behind yours; on the turn they drop away. */}
        {BEHIND.map((b) => (
          <div key={b.take} style={{ position: "absolute", left: b.x, top: b.y, transformOrigin: "0 0", transform: `translateX(${whip * 1100 - 150 * creep}px) translateY(${120 * ramp(frame, flip, 12) - 40 * creep}px) scale(0.6)`, filter: "blur(9px)", opacity: 0.45 * (1 - ramp(frame, flip, 10)) }}>
            <Tweet tweet={TAKES[b.take]!} />
          </div>
        ))}
        <AbsoluteFill style={{ transform: `translateX(${whip * PAN}px)` }}>
          <div style={{ ...HEADLINE, position: "absolute", left: 130, top: 380, fontSize: 150 }}>
            <Lines lines={["Your", "take."]} show={() => 1 - ramp(frame, swap - 2, 4)} colour={() => INK} />
            <Lines lines={["Now a", "position."]} show={(i) => ramp(frame, swap + 1 + i * 2, 8)} colour={(i) => (i ? BLUE : INK)} />
          </div>
          <div style={{ position: "absolute", left: 800, right: 50, top: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", perspective: 2200 }}>
            {/* Lifts toward the camera as it turns, and the camera keeps drifting round it. */}
            <div style={{ display: "grid", transformStyle: "preserve-3d", transform: `translateY(${36 - 72 * creep}px) translateZ(${lift * 300}px) rotateX(${6 - 6 * creep + 8 * lift}deg) rotateY(${-22 + 28 * creep + 180 * turn}deg)` }}>
              <div style={{ gridArea: "1 / 1", alignSelf: "center", visibility: isBack ? "hidden" : "visible" }}>
                <Tweet tweet={HERO} width={W} />
              </div>
              <div style={{ gridArea: "1 / 1", alignSelf: "center", transform: "rotateY(180deg)", visibility: isBack ? "visible" : "hidden" }}>
                <Position frame={frame} glossAt={flip + LAND - 1} />
              </div>
            </div>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
      {/* The reveal's last frame, carried off by the whip. */}
      {whip > 0.02 ? (
        <AbsoluteFill style={{ transform: `translateX(${(whip - 1) * PAN}px)` }}>
          <Freeze frame={bf(R.end) - 1 - bf(R.start)}>
            <Reveal />
          </Freeze>
        </AbsoluteFill>
      ) : null}
    </Sky>
  );
}

export function sounds(add: Add) {
  // The whip pan in, and its brake.
  add("fast_woosh_02", s(bf(F.start) + 1), -10);
  add("swoosh_02", s(bf(F.start) + 3), -15);
  add("whoosh_hit", s(bf(F.start) + 6), -17);
  // The turn: a rush as it lifts, a hit as the position faces us, the headline clicking over, a shine across it.
  add("fast_woosh_04", s(bf(F.flip) + 4), -13);
  add("swish_boom_02", s(bf(F.flip) + EDGE), -11);
  add("switch_click_01", s(bf(F.flip) + EDGE), -18);
  add("impact_whoosh_drum", s(bf(F.flip) + LAND), -12);
  add("shine", s(bf(F.flip) + LAND), -16);
  // Each move deals out with a pop and its tick.
  F.rows.forEach((at, i) => {
    add(i % 2 ? "pop_03" : "pop_01", beat(at), -16, { pan: 0.35 });
    add("tick", s(bf(at) + 4), -20, { pan: 0.35 });
    add(WOOSH[i % WOOSH.length]!, beat(at) - 0.03, -24, { pan: 0.35 });
  });
  // The rush through it, into the next scene.
  add("whoosh_04", beat(F.end) - 0.05, -12);
  add("fast_woosh_03", beat(F.out) + 0.2, -12);
}
