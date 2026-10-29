/**
 * The drop is the reveal. On beat 0 the product's card slams in and fills the frame. Its rows deal
 * in a half beat apart, a pointer taps "Book it", the count rolls to 4 of 4 as each row ticks over,
 * the brand coin rises and turns, and a light sweeps the card as it goes face-on. One camera keys
 * across a single stage the whole time (orbit, push in, settle), then accelerates out into the
 * close, which carries this scene's real last frame off with the same move.
 */
import type { ReactNode } from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";

import { BRAND, HEADLINE } from "../brand";
import { COPY, PEOPLE } from "../content";
import { camera, lens, project, stage } from "../engine/camera";
import { accelerate, beat, bf, brake, land, ramp, speedBlur, T, useFilmFrame } from "../engine/motion";
import { type Add, s, v } from "../engine/sound";
import { Avatar } from "../parts/Avatar";
import { Backdrop } from "../parts/Backdrop";
import { Count, climb, reaches } from "../parts/Count";
import { Cursor } from "../parts/Cursor";
import { Gloss } from "../parts/Gloss";
import { Mark } from "../parts/Mark";
import { Shot } from "../parts/Shot";

const R = T.reveal;
const ROWS = COPY.reveal.rows;

// The card on the stage (stage pixels): centred, with the button across its foot.
const W = 1100;
const H = 880;
const X0 = (1920 - W) / 2;
const Y0 = (1080 - H) / 2;
const rowTop = (i: number) => 210 + i * 130;
const BUTTON = { top: 740, height: 104 };
/** Frames per turn of the coin: about 0.15 rad a frame, slow enough that shutter blur smears it instead of stacking rings. */
export const TURN = 40;
/** How far the scene pans left as it accelerates out; the close carries its last frame on from there. */
const OUT = 700;

/** The frame each row is booked: when the rolling count passes its number, the same moment its tick sounds. */
const bookedAt = (i: number) => bf(R.count[0]!) + reaches(ROWS.length, i + 1) * (bf(R.count[1]!) - bf(R.count[0]!));

const cam = camera([
  { at: bf(R.land), x: 960, y: 540, zoom: 1, rx: 10, ry: -16 },
  { at: bf(R.rows[0]!), x: 960, y: 530, zoom: 1.04, rx: 9, ry: -13 },
  { at: bf(R.cursor), x: 960, y: 560, zoom: 1.1, rx: 7, ry: -9 },
  // Rack down to the button for the tap, then pull back as the rows tick over.
  { at: bf(R.tap) - 4, x: 1080, y: Y0 + BUTTON.top - 40, zoom: 1.26, rx: 11, ry: -5 },
  { at: bf(R.tap) + 3, x: 1070, y: Y0 + BUTTON.top - 30, zoom: 1.24, rx: 10, ry: -3 },
  { at: bf(R.count[1]!), x: 960, y: 570, zoom: 1.03, rx: 6, ry: 5 },
  // Done: face-on with a hard brake, then the orbit shows the card's edge, a push in, and it settles.
  { at: bf(R.done), x: 960, y: 540, zoom: 1, rx: 0, ry: 0, ease: brake },
  { at: bf(R.hold) - 4, x: 960, y: 540, zoom: 0.93, rx: 7, ry: 15 },
  { at: bf(R.hold) + 8, x: 950, y: 520, zoom: 1.02, rx: 3, ry: 7 },
  { at: bf(R.out), x: 960, y: 530, zoom: 1.0, rx: 2, ry: 4 },
]);

function Check({ size, drawn, colour }: { readonly size: number; readonly drawn: number; readonly colour: string }) {
  const pop = interpolate(drawn, [0, 0.4, 1], [0.6, 1.15, 1]);
  return (
    <div style={{ width: size, height: size, borderRadius: 999, flex: "none", border: `3px solid ${drawn > 0 ? colour : BRAND.line}`, background: drawn > 0 ? colour : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${drawn > 0 ? pop : 1})` }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - drawn} />
      </svg>
    </div>
  );
}

/** The card's thickness: the same rounded shape stacked 8 deep behind it, darker as it goes back. */
function Edge() {
  return (
    <>
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} style={{ position: "absolute", inset: 0, borderRadius: 56, background: `rgb(${226 - i * 4} ${222 - i * 4} ${236 - i * 3})`, transform: `translateZ(${-(i + 1) * 3}px)` }} />
      ))}
    </>
  );
}

/** The button: "Book it", pressed, then its label rolls over to the count, then to done. Labels roll, never crossfade. */
function Button({ frame }: { readonly frame: number }) {
  const tap = bf(R.tap);
  const count0 = bf(R.count[0]!);
  const done = bf(R.done);
  const press = interpolate(frame - tap, [-2, 0, 5], [1, 0.96, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const roll = (at: number) => ramp(frame, at, 4, 0, 1, Easing.in(Easing.quad));
  const enter = (at: number) => 1 - ramp(frame, at + 3, 5);
  const value = climb(ROWS.length, ramp(frame, count0, bf(R.count[1]!) - count0, 0, 1, (t) => t));
  const label = (y: number, child: ReactNode) => (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 18, transform: `translateY(${y * 100}%)` }}>{child}</div>
  );
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: BUTTON.top, height: BUTTON.height, borderRadius: 999, overflow: "hidden", background: frame >= done ? BRAND.good : BRAND.accent, color: "white", fontSize: 46, fontWeight: 700, letterSpacing: "-0.02em", transform: `scale(${press})`, boxShadow: "0 24px 50px -22px rgb(60 30 20 / 0.55)" }}>
      {frame < count0 + 3 ? label(-roll(count0), COPY.reveal.button) : null}
      {frame >= count0 + 3 && frame < done + 3 ? label(enter(count0) - roll(done), (
        <>
          <Count value={value} total={ROWS.length} />
          <span>{COPY.reveal.booked}</span>
        </>
      )) : null}
      {frame >= done + 3 ? label(enter(done), (
        <>
          <Check size={52} drawn={ramp(frame, done + 4, 8)} colour="rgb(255 255 255 / 0.25)" />
          {COPY.reveal.done}
        </>
      )) : null}
      <Gloss frame={frame} at={done} length={14} radius={999} />
    </div>
  );
}

function Card({ frame }: { readonly frame: number }) {
  const done = bf(R.done);
  return (
    <div style={{ position: "absolute", left: X0, top: Y0, width: W, height: H, transformStyle: "preserve-3d" }}>
      <Edge />
      <div style={{ position: "absolute", inset: 0, borderRadius: 56, background: BRAND.surface, boxShadow: "0 60px 120px -40px rgb(50 30 90 / 0.35)", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 56, top: 52, right: 56, display: "flex", alignItems: "center", gap: 28 }}>
          <Mark name="brand:acme" size={92} />
          <div style={{ flex: 1 }}>
            <div style={{ ...HEADLINE, fontSize: 54 }}>{COPY.reveal.title}</div>
            <div style={{ fontSize: 34, fontWeight: 500, color: BRAND.muted, marginTop: 8 }}>{COPY.reveal.sub}</div>
          </div>
          <div style={{ display: "flex" }}>
            {PEOPLE.map((p, i) => (
              <div key={p.key} style={{ marginLeft: i ? -18 : 0, borderRadius: 999, boxShadow: "0 0 0 5px white" }}>
                <Avatar who={p} size={64} />
              </div>
            ))}
          </div>
        </div>
        {ROWS.map((row, i) => {
          const at = bf(R.rows[i]!);
          if (frame < at) return null;
          const t = land(frame, at, 7);
          const booked = ramp(frame, bookedAt(i), 7);
          return (
            <div key={row.what} style={{ position: "absolute", left: 40, right: 40, top: rowTop(i), height: 116, borderRadius: 32, background: booked > 0 ? "#f3fbf5" : "#f7f6fb", display: "flex", alignItems: "center", gap: 28, padding: "0 34px", opacity: Math.min(1, t * 3), transform: `translateY(${(1 - t) * 60}px)`, filter: `blur(${(1 - t) * 8}px)` }}>
              <Mark name={row.logo} size={72} ring />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 42, fontWeight: 650, color: BRAND.ink, letterSpacing: "-0.02em" }}>{row.what}</div>
                <div style={{ fontSize: 32, fontWeight: 500, color: BRAND.muted }}>{row.detail}</div>
              </div>
              <Check size={60} drawn={booked} colour={BRAND.good} />
            </div>
          );
        })}
        <Button frame={frame} />
        <Gloss frame={frame} at={done} length={16} radius={56} strength={0.6} />
      </div>
    </div>
  );
}

export function Scene() {
  const frame = useFilmFrame("reveal");
  const drop = bf(R.land);
  const c = cam(frame);
  // On the drop the whole stage slams in from too close and out of focus, with a white flash.
  const slam = land(frame, drop, 7);
  const flash = interpolate(frame - drop, [0, 1, 4], [0.7, 0.45, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // Out: the camera pans left, accelerating into the cut, blurred by its own speed so the shutter
  // smears it instead of stamping copies; the close carries on from OUT.
  const x = (f: number) => -OUT * ramp(f, bf(R.out), bf(R.end) - bf(R.out), 0, 1, accelerate);
  const spin = bf(R.spin);
  const rise = land(frame, spin, 9);
  // The pointer aims at the button's empty right end, so it never covers the label.
  const target = project(c, X0 + W - 150, Y0 + BUTTON.top + BUTTON.height / 2);
  return (
    <Backdrop frame={frame} grid>
      <AbsoluteFill style={{ transform: `translateX(${x(frame)}px) scale(${1.5 - 0.5 * slam})`, filter: `blur(${(1 - slam) * 16 + speedBlur(x, frame)}px)` }}>
        <div style={lens}>
          <div style={stage(c)}>
            <Card frame={frame} />
            {/* The brand coin rises out from behind the card's right edge and keeps turning beside it. */}
            {frame >= spin ? (
              <div style={{ position: "absolute", left: X0 + W - 40, top: Y0 + 20, transform: `translateZ(90px) translateY(${(1 - rise) * 160}px) scale(${0.5 + 0.5 * rise})`, opacity: Math.min(1, rise * 3) }}>
                <Shot shot="spin" frame={frame - spin} size={250} span={TURN} />
              </div>
            ) : null}
          </div>
        </div>
        <Cursor frame={frame} x={target.x} y={target.y} from={{ x: 420, y: 380 }} start={bf(R.cursor)} press={bf(R.tap)} ring={240} out={bf(R.tap) + 5} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "white", opacity: flash }} />
    </Backdrop>
  );
}

export function sounds(add: Add) {
  // The drop: the biggest hit of the film, a low boom under it, air as the card settles.
  add(v("impact"), beat(R.land) + 0.02, -8);
  add(v("boom"), beat(R.land) + 0.06, -11);
  add(v("air"), beat(R.land) + 0.3, -19);
  // Rows deal in: a soft whoosh leads each, a pop as it lands.
  R.rows.forEach((at, i) => {
    add(v("whoosh", i), beat(at) - 0.03, -24, { pan: 0.15 });
    add(v("pop", i), s(bf(at) + 2), -15 - i * 0.5, { pan: i % 2 ? 0.15 : -0.15 });
  });
  // The pointer glides in from the lower right, and taps.
  add(v("whoosh", 1), beat(R.cursor) + 0.06, -20, { pan: 0.4 });
  add(v("click"), beat(R.tap), -10, { pan: 0.25 });
  add(v("button"), beat(R.tap) + 0.02, -14);
  // The coin rises and turns.
  add(v("whoosh", 2), beat(R.spin) + 0.05, -16, { pan: 0.45 });
  add(v("shine"), s(bf(R.spin) + 9), -19, { pan: 0.45 });
  // The button's label rolls over to the count.
  add(v("switch"), beat(R.count[0]!) + 0.03, -19);
  // The count rolls: a tick as each number turns over, from the same reaches() the picture uses,
  // getting louder as it speeds up, and a pop as each row ticks to booked.
  ROWS.forEach((_, i) => {
    add(v("tick"), s(bookedAt(i)), -21 + i, { pan: -0.1 });
    add(v("pop", i + 1), s(bookedAt(i) + 3), -18, { pan: -0.1 });
  });
  // Done: the button turns green with a ding, a till for the money side, a light across the card.
  add(v("ding"), beat(R.done) + 0.02, -11);
  add(v("cash"), beat(R.done) + 0.08, -15);
  add(v("shine"), s(bf(R.done) + 6), -15);
  // The orbit and the push in, then the camera settles.
  add(v("air"), beat(R.orbit) + 0.2, -18, { pan: 0.3 });
  add(v("whoosh", 3), beat(R.hold), -21, { pan: -0.2 });
  add(v("switch"), s(bf(R.hold) + 8), -22);
  // Out: the camera accelerates away to the left, peaking on the cut.
  add(v("whoosh", 0), beat(R.out) + 0.05, -18, { pan: -0.3 });
  add(v("whoosh_heavy"), beat(R.end) - 0.03, -12, { pan: -0.4 });
}
