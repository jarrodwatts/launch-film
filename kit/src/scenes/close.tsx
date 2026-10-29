/**
 * The close. The reveal's real last frame is carried off left by the same pan that brings the
 * brand coin in, so the cut is one camera move. Through the song's break the coin turns, big and
 * centred under a lamp of the brand colour. Just before the re-drop the camera dives into it until
 * its colour fills the frame; on the re-drop the logo's own shape opens out of that colour onto the
 * lockup, a light sweeps it, the line lands piece by piece, and the call to action holds to the end.
 */
import { AbsoluteFill, Easing } from "remotion";

import { BRAND, HEADLINE } from "../brand";
import { COPY } from "../content";
import { accelerate, beat, bf, land, ramp, speedBlur, T, useFilmFrame } from "../engine/motion";
import { type Add, s, v } from "../engine/sound";
import { Backdrop } from "../parts/Backdrop";
import { Gloss } from "../parts/Gloss";
import { Iris } from "../parts/Iris";
import { LastFrameOf } from "../parts/LastFrameOf";
import { Shot } from "../parts/Shot";
import { TURN } from "./reveal";

const C = T.close;
/** The pan that spans the cut: starts at the reveal's exit speed (about 380 px a frame) and brakes. */
const pan = Easing.bezier(0.35, 0.65, 0.4, 1);
/** Frames from the start of the dive to the re-drop. */
const DIVE = 7;

export function Scene() {
  const frame = useFilmFrame("close");
  const start = bf(C.start);
  const lockup = bf(C.lockup);
  const cta = bf(C.cta);
  // One pan across the cut: the old frame and the coin move together, one screen width, blurred by
  // the pan's own speed (fastest on the cut) so the shutter smears them instead of stamping copies.
  const travel = (f: number) => 1920 * ramp(f, start - 1, bf(C.hero) - start + 4, 0, 1, pan);
  const p = travel(frame) / 1920;
  const panBlur = speedBlur(travel, frame);
  // The coin creeps closer through the break, then dives into the lens before the re-drop.
  const creep = ramp(frame, start, lockup - start, 0, 1, Easing.linear);
  const dive = ramp(frame, lockup - DIVE, DIVE, 0, 1, accelerate);
  const fill = ramp(frame, lockup - 3, 3, 0, 1, Easing.linear);
  const bob = 8 * Math.sin((frame - start) / 8);
  // The lockup: lands with a hard brake as the iris opens, then creeps.
  const mark = land(frame, lockup, 8, 50);
  const ctaIn = land(frame, cta, 7);
  const press = ramp(frame, cta + 10, 3, 1, 0.96) + ramp(frame, cta + 13, 5, 0, 0.04);
  return (
    <Backdrop frame={frame}>
      {frame < lockup ? (
        <>
          {/* The brand's lamp behind the hero. */}
          <div style={{ position: "absolute", left: 960 - 420 + 1920 * (1 - p), top: 120, width: 840, height: 840, borderRadius: 999, background: BRAND.accent, filter: "blur(150px)", opacity: 0.2 }} />
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `translateX(${1920 * (1 - p)}px)`, filter: `blur(${panBlur}px)` }}>
            <div style={{ transform: `translateY(${bob}px) scale(${(1 + 0.1 * creep) * (1 + 5 * dive)})`, filter: `blur(${dive * 10}px)` }}>
              <Shot shot="spin" frame={frame - start} size={640} span={TURN} />
            </div>
          </AbsoluteFill>
          <AbsoluteFill style={{ background: BRAND.accent, opacity: fill }} />
        </>
      ) : (
        <AbsoluteFill style={{ alignItems: "center" }}>
          <div style={{ position: "absolute", top: 290, display: "flex", alignItems: "center", gap: 44, transform: `translateY(${-30 * ctaIn}px) scale(${(1.12 - 0.12 * mark) * (1 + 0.03 * ramp(frame, lockup, 60, 0, 1, Easing.linear))})` }}>
            <svg width={200} height={200} viewBox={`0 0 ${BRAND.markBox} ${BRAND.markBox}`}>
              <path d={BRAND.markPath} fill={BRAND.accent} fillRule="evenodd" />
            </svg>
            <div style={{ position: "relative", ...HEADLINE, fontSize: 210 }}>
              {COPY.close.wordmark}
              <Gloss frame={frame} at={lockup + 5} length={12} />
            </div>
          </div>
          <div style={{ position: "absolute", top: 548, display: "flex", gap: 26, transform: `translateY(${-30 * ctaIn}px)` }}>
            {COPY.close.line.map((piece, i) => {
              const at = bf(C.words[i]!);
              const t = land(frame, at, 5);
              return frame < at ? null : (
                <span key={piece} style={{ ...HEADLINE, fontSize: 84, color: piece === COPY.close.accentWord ? BRAND.accent : BRAND.ink, opacity: Math.min(1, t * 3), transform: `translateY(${(1 - t) * 28}px)`, display: "inline-block" }}>{piece}</span>
              );
            })}
          </div>
          {frame >= cta ? (
            <div style={{ position: "absolute", top: 686, display: "flex", flexDirection: "column", alignItems: "center", gap: 26, opacity: Math.min(1, ctaIn * 3), transform: `translateY(${(1 - ctaIn) * 60}px)` }}>
              <div style={{ position: "relative", overflow: "hidden", padding: "26px 72px", borderRadius: 999, background: BRAND.ink, color: "white", fontSize: 50, fontWeight: 650, letterSpacing: "-0.02em", transform: `scale(${press})`, boxShadow: "0 30px 60px -24px rgb(20 16 40 / 0.55)" }}>
                {COPY.close.cta}
                <Gloss frame={frame} at={cta + 4} length={12} radius={999} />
              </div>
              <div style={{ fontSize: 40, fontWeight: 500, color: BRAND.muted }}>{COPY.close.url}</div>
            </div>
          ) : null}
        </AbsoluteFill>
      )}
      {/* The reveal's last frame, carried off by the pan. */}
      {p < 1 ? (
        <AbsoluteFill style={{ transform: `translateX(${-1920 * p}px)`, filter: `blur(${panBlur}px)` }}>
          <LastFrameOf scene="reveal" />
        </AbsoluteFill>
      ) : null}
      <Iris frame={frame} at={lockup} path={BRAND.markOutline} box={BRAND.markBox} colour={BRAND.accent} />
    </Backdrop>
  );
}

export function sounds(add: Add) {
  // The pan across the cut, and the coin braking into the centre.
  add(v("whoosh", 1), s(bf(C.whip) + 2), -11, { pan: -0.3 });
  add(v("whoosh_heavy"), beat(C.hero) + 0.03, -14, { pan: 0.2 });
  // The coin turns through the break: a soft air pass each time it goes edge-on (every half turn).
  for (let f = bf(C.start) + TURN / 4; f < bf(C.lockup) - DIVE; f += TURN / 2) if (f > bf(C.hero) + 6) add(v("air"), s(f), -24, { pan: f % TURN < TURN / 2 ? 0.15 : -0.15 });
  // The dive into the coin, rising into the re-drop.
  add(v("riser"), beat(C.lockup) - 0.09, -14);
  add(v("whoosh", 2), s(bf(C.lockup) - DIVE + 1), -15);
  // The re-drop: the logo opens out of the colour on a boom, an impact leading it, a shine as the light crosses it.
  add(v("impact"), beat(C.lockup) - 0.04, -11);
  add(v("boom"), beat(C.lockup) + 0.02, -10);
  add(v("shine"), s(bf(C.lockup) + 11), -15);
  // The line, piece by piece.
  C.words.forEach((at, i) => add(v("pop", i), s(bf(at) + 2), -17 - i * 0.5));
  // The call to action rises, a light crosses it, and it's pressed.
  add(v("whoosh", 3), beat(C.cta) + 0.05, -18);
  add(v("shine"), s(bf(C.cta) + 6), -19);
  add(v("button"), s(bf(C.cta) + 10), -15);
}
