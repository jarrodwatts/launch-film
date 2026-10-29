import { AbsoluteFill, Easing, interpolate } from "remotion";

import { BUTTON_Y, CARD_H, Coins, Confetti, moveTop, PositionCard, ROW, STEP, W } from "../card";
import { HERO, RECEIPTS, RESEARCH } from "../data";
import { beat, bf, land, ramp, T, useFilmFrame } from "../motion";
import { BLUE, BUBBLE, INK, MascotIris, MUTED, Sky } from "../parts";
import { type Add, one, s, WOOSH } from "../sound";
import { Composer, Mark, Mascot3D, SHOT_FRAMES, Status } from "../ui";

const R = T.reveal;
// The composer's send button, from the composer's own layout (1240 wide, 128 tall, 18 padding, 96 button).
const SEND = { x: 1240 - 18 - 48, y: 64 };
// The colour the fly-through ends on, filling the frame: Auni's body, close up.
const FLY_FILL = "#bae5ff";

// The stage: Auni's steps in one column, and the position card grows out of the last of them.
const X0 = (1920 - W) / 2;
const stepTop = (i: number) => 300 + i * (STEP + 16);
const TOP = stepTop(RESEARCH.length - 1);
const D = 2400;

type Camera = { readonly x: number; readonly y: number; readonly zoom: number; readonly rx: number; readonly ry: number };
type Key = Camera & { readonly at: number; readonly ease?: (t: number) => number };

/** The camera's path: where it looks (x, y on the stage), how close, and how it's turned, eased between keys. */
function camera(frame: number): Camera {
  const at = R.research.map(bf);
  const research = at.map((a, i): Key => {
    // Frame everything on screen with a margin: your take (gone by the fourth step), Auni, the steps.
    const top = i >= 3 ? 250 : 130;
    const bottom = stepTop(i) + STEP;
    return { at: a + 2, x: 880, y: (top + bottom) / 2, zoom: Math.min(1.3, 940 / (bottom - top)), rx: 6, ry: -9 + i };
  });
  const card = TOP + CARD_H / 2;
  const row = (i: number) => TOP + moveTop(i) + 56;
  const button = TOP + BUTTON_Y - 150;
  const keys: Key[] = [
    { at: at[0]! - 2, x: 880, y: 260, zoom: 1.45, rx: 8, ry: -12 },
    ...research,
    { at: bf(R.found) + 9, x: 960, y: TOP + 250, zoom: 1.32, rx: 4, ry: -4 },
    { at: bf(R.form), x: 960, y: TOP + 260, zoom: 1.4, rx: 3, ry: -2 },
    // The showcase: one long orbit. It pulls back as the card grows, turned so its edge shows,
    // pushes close on the belief, racks down to the button for the tap, and follows the moves.
    { at: bf(R.formed), x: 960, y: card, zoom: 0.98, rx: 10, ry: -24 },
    { at: bf(R.look), x: 960, y: TOP + 150, zoom: 1.42, rx: 6, ry: -15 },
    { at: bf(R.pointer), x: 960, y: TOP + 160, zoom: 1.46, rx: 5, ry: -12 },
    { at: bf(R.tap) - 4, x: 1040, y: button, zoom: 1.5, rx: 10, ry: -4 },
    { at: bf(R.tap) + 3, x: 1030, y: button + 10, zoom: 1.47, rx: 9, ry: -2 },
    { at: bf(R.receipts[1]!), x: 960, y: row(1), zoom: 1.2, rx: 6, ry: 8 },
    { at: bf(R.receipts[3]!) + 6, x: 960, y: row(3) - 120, zoom: 1.1, rx: 6, ry: 13 },
    // All in: the camera lands face-on with a hard brake, then slowly pulls back to make room for Auni.
    { at: bf(R.allIn), x: 960, y: card, zoom: 1.02, rx: 0, ry: 0, ease: Easing.bezier(0.2, 0.9, 0.3, 1) },
    { at: bf(R.end), x: 1070, y: card - 20, zoom: 0.88, rx: 0, ry: -3, ease: Easing.bezier(0.2, 0.6, 0.4, 1) },
  ];
  const next = keys.findIndex((k) => k.at > frame);
  if (next <= 0) return keys[next === 0 ? 0 : keys.length - 1]!;
  const a = keys[next - 1]!;
  const b = keys[next]!;
  const t = (b.ease ?? Easing.inOut(Easing.cubic))((frame - a.at) / (b.at - a.at));
  const mix = (k: keyof Camera) => a[k] + (b[k] - a[k]) * t;
  return { x: mix("x"), y: mix("y"), zoom: mix("zoom"), rx: mix("rx"), ry: mix("ry") };
}

/** Where a point on the stage lands on screen, through the camera and its perspective. */
function project(c: Camera, x: number, y: number) {
  const [vx, vy] = [x - c.x, y - c.y];
  const ry = (c.ry * Math.PI) / 180;
  const rx = (c.rx * Math.PI) / 180;
  const x1 = vx * Math.cos(ry);
  const z1 = -vx * Math.sin(ry);
  const y2 = vy * Math.cos(rx) - z1 * Math.sin(rx);
  const z2 = vy * Math.sin(rx) + z1 * Math.cos(rx);
  const k = D / (D - z2);
  return { x: 960 + x1 * c.zoom * k, y: 540 + y2 * c.zoom * k };
}

/**
 * A pointer that glides in on a curve from `from` (offset from the target), presses on the target
 * at `press` with a ripple `ring` across, and, given `out`, slips away down and right.
 */
function Cursor({ frame, x, y, from, start, press, ring, out }: { readonly frame: number; readonly x: number; readonly y: number; readonly from: { x: number; y: number }; readonly start: number; readonly press: number; readonly ring: number; readonly out?: number | undefined }) {
  const t = ramp(frame, start, press - start - 2, 0, 1, Easing.bezier(0.3, 0.7, 0.2, 1));
  const down = interpolate(frame - press, [-2, 0, 4], [1, 0.82, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const spread = ramp(frame, press, 12);
  const leave = out === undefined ? 0 : ramp(frame, out, 8, 0, 1, Easing.in(Easing.cubic));
  // The arrow's tip is at (4, 2.5) of its 24 grid, drawn at 64px.
  const tip = 64 / 24;
  return (
    <>
      {frame >= press ? <div style={{ position: "absolute", left: x - ring / 2, top: y - ring / 2, width: ring, height: ring, borderRadius: 999, background: "rgb(255 255 255 / 0.4)", boxShadow: `inset 0 0 0 8px ${BLUE}`, opacity: 1 - spread * spread, transform: `scale(${0.3 + 0.7 * spread})` }} /> : null}
      <div style={{ position: "absolute", left: x + from.x * (1 - t) + Math.sin(t * Math.PI) * 50 + leave * 300 - 4 * tip, top: y + from.y * (1 - t) + leave * 400 - 2.5 * tip, opacity: Math.min(1, t * 4) * (1 - leave) }}>
        <svg width="64" height="64" viewBox="0 0 24 24" style={{ transform: `scale(${down})`, transformOrigin: "4px 2.5px", filter: "drop-shadow(0 6px 10px rgb(16 22 35 / 0.3))" }}>
          <path d="M4 2.5 L4 19 L8.6 14.8 L11.6 21.4 L14.4 20.2 L11.4 13.7 L17.6 13.5 Z" fill={INK} stroke="white" strokeWidth={1.4} strokeLinejoin="round" />
        </svg>
      </div>
    </>
  );
}

/**
 * The drop. The take lands in Auni's box; a cursor sends it; Auni turns toward the camera in 3D
 * until its body fills the frame, and opens on its research. The last step finds four moves,
 * they drop out of it, and the step grows into the position card around them; the camera
 * orbits the card, pushes in on the belief, racks down to the button, a tap places all four,
 * and it comes to rest face-on with the moves all in and Auni beside it.
 */
export function Reveal() {
  const frame = useFilmFrame(R.start);
  const drop = bf(R.start);
  const send = bf(R.send);
  const fly = bf(R.fly) + 1;
  const research = bf(R.research[0]!);
  const slam = land(frame, drop, 7);
  const flyT = ramp(frame, fly, research - fly, 0, 1, Easing.linear);
  const flash = interpolate(frame - drop, [0, 1, 4], [0.9, 0.6, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Sky>
      {frame < research + 2 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `scale(${1.5 - 0.3 * slam + 0.04 * ramp(frame, drop, send - drop, 0, 1, Easing.linear)})`, filter: `blur(${(1 - slam) * 16}px)` }}>
          <div style={{ position: "relative", transform: "translateY(-70px)" }}>
            <div style={{ position: "relative", height: 360, display: "flex", justifyContent: "center", zIndex: 2 }}>
              {frame < fly ? (
                <Mascot3D shot="spin" frame={frame - drop} size={400} style={{ marginBottom: -40 }} />
              ) : (
                // The real 3D fly-through: it turns and the camera dollies in until it fills the frame,
                // its rendered frames played as fast as the beats before the research allow.
                <div style={{ position: "absolute", top: 180 - 200, transform: `translateY(${flyT * 330}px) scale(${1 + flyT * 4})`, transformOrigin: "50% 50%" }}>
                  <Mascot3D shot="fly" frame={((frame - fly) * SHOT_FRAMES.fly) / (research - fly)} size={400} />
                </div>
              )}
            </div>
            <div style={{ position: "relative", opacity: 1 - ramp(frame, fly, 8) }}>
              <Composer text={HERO.text} typed={ramp(frame, drop + 2, bf(R.cursor) - drop, 0, 1, Easing.linear)} pressed={interpolate(frame - send, [-2, 0, 4], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
              <div style={{ position: "absolute", left: 0, top: 0 }}>
                <Cursor frame={frame} x={SEND.x} y={SEND.y} from={{ x: 520, y: 360 }} start={bf(R.cursor)} press={send} ring={200} />
              </div>
            </div>
          </div>
          {/* The last of the fly-through: the frame is Auni's body. */}
          <AbsoluteFill style={{ background: FLY_FILL, opacity: ramp(frame, research - 4, 4) }} />
        </AbsoluteFill>
      ) : null}
      {frame >= research - 1 ? <Stage frame={frame} /> : null}
      {frame >= research - 1 ? <MascotIris open={ramp(frame, research - 1, 7)} colour={FLY_FILL} /> : null}
      <AbsoluteFill style={{ background: "white", opacity: flash }} />
    </Sky>
  );
}

/**
 * Everything after the fly-through, on one stage under one moving camera: your take, Auni's
 * steps, and the card that grows out of the last one. The camera's focus sets the depth of field.
 */
function Stage({ frame }: { readonly frame: number }) {
  const c = camera(frame);
  const found = bf(R.found);
  const form = bf(R.form);
  const tap = bf(R.tap);
  const allIn = bf(R.allIn);
  // Rack focus: while the camera is close (the belief, the button, the receipts), what's far from its focus softens.
  const dof = ramp(frame, bf(R.formed), bf(R.look) - bf(R.formed)) - ramp(frame, bf(R.receipts[3]!), allIn - bf(R.receipts[3]!));
  const blur = (y: number) => dof * Math.min(7, Math.max(0, (Math.abs(y - c.y) - 220) / 60));
  // The pointer aims at the button's empty right end, so it never covers the label.
  const button = project(c, X0 + W - 170, TOP + BUTTON_Y);
  const last = land(frame, bf(R.research.at(-1)!), 7);
  return (
    <AbsoluteFill style={{ perspective: D }}>
      {/* The celebration fills the frame around the card, behind it, so the card stays clear to read. */}
      <Confetti frame={frame} at={allIn} />
      <Coins frame={frame} at={allIn + 1} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: "0 0", transformStyle: "preserve-3d", transform: `translate(960px, 540px) scale(${c.zoom}) rotateX(${c.rx}deg) rotateY(${c.ry}deg) translate(${-c.x}px, ${-c.y}px)` }}>
        <Research frame={frame} />
        <div style={{ position: "absolute", left: X0, top: TOP, transformStyle: "preserve-3d", opacity: Math.min(1, last * 3), transform: `translateX(${(1 - last) * 220}px) translateZ(${(1 - last) * 260}px) rotateY(${(1 - last) * -40}deg)` }}>
          {frame >= bf(R.research.at(-1)!) ? (
            <PositionCard frame={frame} found={found} chipsAt={found + 5} form={form} formed={bf(R.formed)} tapAt={tap} receiptsAt={R.receipts.map(bf)} allInAt={allIn} blur={(y) => blur(TOP + y)} />
          ) : null}
        </div>
      </div>
      {frame >= bf(R.pointer) && frame < allIn ? <Cursor frame={frame} x={button.x} y={button.y} from={{ x: 420, y: 420 }} start={bf(R.pointer)} press={tap} ring={280} out={tap + 4} /> : null}
    </AbsoluteFill>
  );
}

/**
 * Your take, sent, and Auni's steps under it, a step a beat (then faster) as it works. Once the
 * last step finds the moves, these fall back out of focus, and leave as the card forms.
 */
function Research({ frame }: { readonly frame: number }) {
  const at = R.research.map(bf);
  const back = ramp(frame, bf(R.found), 9);
  const gone = ramp(frame, bf(R.form), 14);
  if (gone >= 1) return null;
  const behind = { filter: `blur(${back * 7}px)`, opacity: (1 - 0.5 * back) * (1 - gone), transform: `translateZ(${-160 * back}px) translateY(${-200 * gone}px)` };
  return (
    <>
      {/* Your take, as you sent it: set back in depth so it never competes with the steps, and gone once they fill the frame. */}
      <div style={{ position: "absolute", right: X0, top: 150, padding: "22px 36px", borderRadius: 40, background: BUBBLE, fontSize: 46, color: INK, letterSpacing: "-0.02em", whiteSpace: "nowrap", opacity: 1 - ramp(frame, at[3]!, 8), filter: `blur(${2.5 + back * 6}px)`, transform: `translateZ(${-220 - 160 * back}px) translateY(${-200 * gone}px)` }}>{HERO.text}</div>
      <div style={{ position: "absolute", left: X0 - 180, top: stepTop(0) - 28, ...behind }}>
        <Mascot3D shot="idle" frame={frame} size={150} />
      </div>
      {RESEARCH.slice(0, -1).map((step, i) => {
        const start = at[i]!;
        if (frame < start) return null;
        const t = land(frame, start, 7);
        const done = ramp(frame, bf(R.research[i]! + 0.4), 5);
        return (
          <div key={step.doing} style={{ position: "absolute", left: X0, top: stepTop(i), width: W, height: STEP, boxSizing: "border-box", display: "flex", alignItems: "center", gap: 22, padding: "0 30px 0 22px", borderRadius: 30, ...ROW, ...behind, opacity: Math.min(1, t * 3) * behind.opacity, transform: `${behind.transform} translateX(${(1 - t) * 220}px) translateZ(${(1 - t) * 260}px) rotateY(${(1 - t) * -40}deg)` }}>
            <div style={{ transform: `rotate(${done > 0 ? 0 : (frame - start) * 24}deg)` }}>
              <Status size={50} done={done} />
            </div>
            <div style={{ fontSize: 42, fontWeight: 600, color: done > 0.5 ? INK : MUTED, letterSpacing: "-0.02em", whiteSpace: "nowrap", flex: 1 }}>{done > 0.5 ? step.did : `${step.doing}...`}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, opacity: done }}>
              {step.logos.map((l) => (
                <Mark key={l} name={l} size={44} ring />
              ))}
              <span style={{ fontSize: 36, fontWeight: 600, color: MUTED, whiteSpace: "nowrap" }}>{step.found}</span>
            </div>
          </div>
        );
      })}
    </>
  );
}

export function sounds(add: Add) {
  // The drop: Auni spins in with a swoosh that turns with it, the take types, the cursor clicks send.
  add("whoosh_hit", beat(R.start) + 0.03, -9);
  add("bass_swoosh", beat(R.start) + 0.12, -10);
  add("stereo_air_whoosh", beat(R.start) + 0.35, -15);
  add("keyboard_typing", beat(R.start) + 0.3, -20, { keep: beat(R.cursor) - beat(R.start) - 0.2 });
  add("swoosh_01", (beat(R.cursor) + beat(R.send)) / 2, -17, { pan: 0.4 });
  add("mouse_click_01", beat(R.send), -9);
  add("button_click", beat(R.send) + 0.01, -15);
  // The 3D fly-through: a swoosh as Auni turns, a rush as the lens dives into it, a hit as it opens on the research.
  const fly = (t: number) => beat(R.fly) + t * (beat(R.research[0]!) - beat(R.fly));
  add("swoosh_02", fly(0.13), -11);
  add("fast_woosh_02", fly(0.39), -12);
  add("bass_swoosh", fly(0.65), -10);
  add("shockwave_whoosh_01", beat(R.research[0]!), -15);
  add("whoosh_hit", beat(R.research[0]!) + 0.04, -14);
  // Research: each step swooshes in, its spinner hums, it ticks when it lands.
  R.research.forEach((n, i) => {
    add(WOOSH[i % WOOSH.length]!, beat(n), -21, { pan: 0.3 });
    add("sonar_pluck", beat(n) + 0.05, -27);
    if (i < R.research.length - 1) add("tick", beat(n) + one * 0.4, -15, { pan: ((i % 3) - 1) * 0.25 });
  });
  // Found: the step floods blue with a hit and a shine, and the four moves drop out of it.
  add("cinematic_hit", beat(R.found), -14);
  add("shine", beat(R.found) + 0.12, -13);
  add("whoosh_02", beat(R.found) + 0.1, -19);
  RECEIPTS.forEach((_, i) => add(["pop_03", "main_pop", "pop_02", "main_pop"][i]!, s(bf(R.found) + 5 + i * 3 + 3), -15, { pan: (i - 1.5) * 0.2 }));
  // The step grows into the card: the label rolls out, a swoosh as the camera pulls back round it,
  // a pop as the belief's coin rises in, a shine across the header.
  add("whoosh_04", beat(R.form), -18);
  add("swoosh_02", beat(R.form) + 0.15, -12);
  add("main_pop", s(bf(R.formed) - 6), -17);
  add("shine", s(bf(R.formed) - 2), -15);
  // The showcase: the camera pushes in on the belief, then racks down to the button.
  add("swoosh_02", s(bf(R.formed) + 2), -14, { pan: -0.3 });
  add("stereo_air_whoosh", beat(R.look) + 0.1, -18);
  add("whoosh_05", beat(R.pointer) + 0.1, -15, { pan: 0.3 });
  // The pointer glides in and taps once; the camera pulls back as each move rolls over to placed.
  add("swoosh_01", (beat(R.pointer) + beat(R.tap)) / 2, -16, { pan: 0.4 });
  add("mouse_click_01", beat(R.tap), -9);
  add("button_click", beat(R.tap) + 0.01, -13);
  add("whoosh_03", beat(R.tap) + 0.25, -19);
  R.receipts.forEach((n, i) => {
    add("item_purchase", beat(n) + 0.04, -14, { pan: (i % 2 ? -0.2 : 0.2) });
    add("tick", beat(n) + 0.02, -20);
  });
  // All in: the ding and a big hit, a light across the card, the coins flung out, the confetti cannons.
  add("pay_ding", beat(R.allIn) + 0.03, -9);
  add("impact_whoosh_drum", beat(R.allIn) + 0.02, -11);
  add("shine", beat(R.allIn) + 0.15, -14);
  add("swish_boom_02", beat(R.allIn) + 0.06, -16);
  add("pop_02", beat(R.allIn) + 0.04, -15, { pan: -0.6 });
  add("pop_02", beat(R.allIn) + 0.07, -15, { pan: 0.6 });
  add("cha_ching", s(bf(R.allIn) + 3), -13);
  [0, 1, 2, 3].forEach((i) => add("pop_03", s(bf(R.allIn) + 2 + i * 2), -19, { pan: i % 2 ? 0.45 : -0.45 }));
  add("fast_woosh_03", s(bf(R.allIn) + 12), -14);
  // Auni slides out from behind the card, jumps, and lands.
  add("swoosh_01", s(bf(R.allIn) + 4), -12, { pan: 0.5 });
  add("fast_woosh_01", s(bf(R.allIn) + 14), -12, { pan: 0.5 });
  add("pop_01", s(bf(R.allIn) + 26), -16, { pan: 0.5 });
}
