import { AbsoluteFill, Easing, Img, interpolate, staticFile } from "remotion";

import { Gloss } from "../card";
import { HERO, TAKES } from "../data";
import { beat, bf, land, ramp, T, useFilmFrame } from "../motion";
import { BLUE, HEADLINE, MUTED, Sky } from "../parts";
import { type Add, s } from "../sound";
import { Mascot3D, SHOT_FRAMES, Tweet, XLogo } from "../ui";

const C = T.close;

// The lockup: Auni (a 300 box) and its name (200 tall, 810x290 art), 40 apart, centred, above the line.
const MASCOT = 300;
const NAME_W = (200 * 810) / 290;
const LOCKUP_Y = 430;
const LEFT = 960 - (MASCOT + 40 + NAME_W) / 2;

/**
 * The break and the last hit. Through the break Auni turns to the camera, big and centred under a
 * lamp of its own blue, the camera creeping in; on the re-drop it drops back into its place beside
 * its name, which slams in, the line lands word by word, and the way in. The opening's takes drift
 * behind, faintly.
 */
export function Close() {
  const frame = useFilmFrame(C.start);
  const start = bf(C.start);
  const lockup = bf(C.lockup);
  const cta = bf(C.cta);
  // It arrives out of the haze in its turn, then the camera creeps in on it until the re-drop.
  const arrive = land(frame, start, 12, lockup - start - 12);
  // Its name slams in a moment after the hit, once Auni is clear of where it lands.
  const named = lockup + 2;
  const slam = land(frame, named, 7);
  // On the re-drop it falls back into the lockup: a little smaller, to its place left of its name.
  const settle = ramp(frame, lockup, 7, 0, 1, Easing.bezier(0.2, 0.9, 0.3, 1));
  const big = interpolate(arrive, [0, 1], [1.5, 2.5]);
  const mascot = {
    x: interpolate(settle, [0, 1], [960, LEFT + MASCOT / 2]),
    y: interpolate(settle, [0, 1], [540 + 6 * Math.sin((frame - start) / 7), LOCKUP_Y]),
    scale: interpolate(settle, [0, 1], [big, 1]),
  };
  const spun = frame - start >= SHOT_FRAMES.spin;
  const ctaIn = land(frame, cta, 6);
  const words = ["Put", "your", "money", "behind", "what", "you", "believe."];
  const wordAt = (i: number) => lockup + 4 + i * 2;
  const press = interpolate(frame - (cta + 10), [0, 2, 6], [1, 0.94, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const all = [HERO, ...TAKES];
  return (
    <Sky>
      {/* The timeline from the opening, still arguing, out of focus behind the answer. */}
      <AbsoluteFill style={{ opacity: 0.18 * slam, filter: "blur(6px)" }}>
        {all.map((take, i) => (
          <div key={take.handle + i} style={{ position: "absolute", left: (i % 3) * 680 - 120, top: Math.floor(i / 3) * 330 - 160 - (frame - lockup) * 1.6, transform: "scale(0.6)", transformOrigin: "0 0" }}>
            <Tweet tweet={take} />
          </div>
        ))}
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        {/* Auni's lamp, behind it through the break, fading as it takes its place. */}
        <div style={{ position: "absolute", left: 960 - 380, top: 540 - 380, width: 760, height: 760, borderRadius: 999, background: BLUE, filter: "blur(140px)", opacity: 0.22 * Math.min(1, arrive * 2) * (1 - settle) }} />
        <div style={{ position: "absolute", left: mascot.x - MASCOT / 2, top: mascot.y - MASCOT / 2 - 30 * ctaIn, transform: `scale(${mascot.scale})`, opacity: Math.min(1, arrive * 4), filter: `blur(${(1 - Math.min(1, arrive * 1.5)) * 14}px)` }}>
          <Mascot3D shot={spun ? "idle" : "spin"} frame={spun ? frame - start - SHOT_FRAMES.spin : frame - start} size={MASCOT} />
        </div>
        {frame >= named ? (
          <div style={{ position: "absolute", left: LEFT + MASCOT + 40, top: LOCKUP_Y - 100 - 30 * ctaIn, transform: `scale(${1.4 - 0.4 * slam})`, transformOrigin: "0% 50%", opacity: Math.min(1, slam * 3), filter: `blur(${(1 - slam) * 12}px)` }}>
            <Img src={staticFile("auni-wordmark.png")} style={{ height: 200, display: "block" }} />
            <Gloss frame={frame} at={named + 3} length={12} radius={0} />
          </div>
        ) : null}
        <div style={{ position: "absolute", top: 640, display: "flex", gap: 16, transform: `translateY(${-30 * ctaIn}px)` }}>
          {words.map((word, i) => {
            const t = land(frame, wordAt(i), 5);
            return frame < wordAt(i) ? null : (
              <span key={word} style={{ ...HEADLINE, fontSize: 68, opacity: Math.min(1, t * 3), transform: `translateY(${(1 - t) * 24}px)`, display: "inline-block" }}>{word}</span>
            );
          })}
        </div>
        {frame >= cta ? (
          <div style={{ position: "absolute", top: 770, display: "flex", flexDirection: "column", alignItems: "center", gap: 22, opacity: Math.min(1, ctaIn * 3), transform: `translateY(${(1 - ctaIn) * 60}px)` }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 22, padding: "32px 70px", borderRadius: 999, background: "#000", color: "#fff", fontSize: 48, fontWeight: 600, transform: `scale(${press})`, boxShadow: "0 30px 60px -20px rgb(16 22 35 / 0.5)" }}>
              <span style={{ filter: "invert(1)", display: "flex" }}>
                <XLogo size={42} />
              </span>
              Join the waitlist with X
              <Gloss frame={frame} at={cta + 4} length={12} radius={999} />
            </div>
            <div style={{ fontSize: 38, color: MUTED, fontWeight: 500 }}>auni.io</div>
          </div>
        ) : null}
      </AbsoluteFill>
    </Sky>
  );
}

export function sounds(add: Add) {
  // Close: through the break Auni whips round out of the haze to fill the frame (a whip as it turns,
  // a deep swoosh as it lands big), a long rush under the camera's creep, and a swish as it drops
  // back into its place beside its name.
  const approach = beat(C.lockup) - beat(C.start);
  add("fast_woosh_03", beat(C.start) + 0.08, -11, { pan: 0.3 });
  add("swoosh_02", beat(C.start) + 0.2, -12);
  add("bass_swoosh", beat(C.start) + 0.38, -13);
  add("whoosh_02", beat(C.start) + approach * 0.7, -15);
  // The swish leads the boom a little and sits above it, so the slide still reads through the hit.
  add("fast_woosh_01", beat(C.lockup) - 0.06, -9, { pan: -0.25 });
  // Its name lands on a boom and shines; the line ticks in word by word; the button.
  add("perfect_riser", beat(C.lockup) - 0.02, -14);
  add("cinematic_boom_01", beat(C.lockup) + 0.02, -10);
  add("shine", s(bf(C.lockup) + 5) + 0.15, -14);
  for (let i = 0; i < 7; i++) add("tick", s(bf(C.lockup) + 4 + i * 2), -23);
  add("whoosh_hit", beat(C.cta), -14);
  add("shine", s(bf(C.cta) + 4) + 0.15, -16);
  add("button_click", s(bf(C.cta) + 10), -12);
}
