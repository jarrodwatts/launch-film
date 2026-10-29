import { AbsoluteFill, Easing, interpolate } from "remotion";

import { MARKETS, VENUES } from "../data";
import { beat, bf, land, ramp, T, useFilmFrame } from "../motion";
import { BLUE, HEADLINE, INK, Sky } from "../parts";
import { type Add, s } from "../sound";
import { Mark, Mascot3D } from "../ui";

const O = T.offerings;

const ease = Easing.bezier(0.45, 0, 0.2, 1);
const swoop = Easing.bezier(0.5, 0, 0.15, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** The roller's word: left-aligned in the right half, while the galaxy owns the left. */
const ROLL = { x: 1040, y: 478, size: 120 };
/** The closing lockup, in the right half beside Auni: "Every market." over a chat box that says "One chat.", both lines starting at ROLL.x. */
const HEAD_Y = 320;
const BOX = { left: ROLL.x - 50, y: 640, w: 1800 - ROLL.x + 50, h: 200, text: 110 };

/** The galaxy's rings of markets. Each ring starts at a different market, so neighbouring rings never line up. */
const RINGS = [{ n: 24, r: 640, size: 96 }, { n: 32, r: 900, size: 84 }, { n: 32, r: 1180, size: 82 }];
const STARS = RINGS.flatMap((ring, k) => Array.from({ length: ring.n }, (_, j) => ({ ...ring, k, j, name: MARKETS[(j + k * 11) % MARKETS.length]! })));
/** Every other market of the outer ring isn't swallowed: it stays in orbit around Auni, into the chat. */
const KEEP = 2;

/** Where the i-th of n sits on a ring, starting at the top and going clockwise. */
function onRing(i: number, n: number, radius: number, turn = 0) {
  const a = -Math.PI / 2 + (i / n) * Math.PI * 2 + turn;
  return { x: Math.cos(a) * radius, y: Math.sin(a) * radius };
}

/** How far ring k (0 is the venues) has spiralled into Auni: inside out, two frames apart, faster as it closes. */
function closing(frame: number, k: number) {
  const m = bf(O.morph);
  return ramp(frame, m + k * 2, bf(O.gulp) - m - 6, 0, 1, Easing.bezier(0.5, 0, 0.9, 0.5));
}

/** The camera over the galaxy: where its middle sits on screen, how close it is, and its tilt and turn in degrees. */
function camera(frame: number) {
  const [f0, f1] = O.flood.map(bf) as [number, number];
  const dolly = ramp(frame, f0, f1 - f0, 0, 1, ease);
  const whip = ramp(frame, bf(O.galaxy), bf(O.aside) - bf(O.galaxy), 0, 1, Easing.bezier(0.7, 0, 0.3, 1));
  const aside = ramp(frame, bf(O.aside) - 5, 12);
  const creep = ramp(frame, bf(O.aside), bf(O.morph) - bf(O.aside), 0, 1, Easing.linear);
  // It pushes in on Auni as the last ring closes, never faster than the ring shrinks, so nothing swings out over the words.
  const push = closing(frame, 3);
  return {
    x: 960 - 470 * aside + 30 * push,
    y: 500 + 80 * dolly - 50 * aside + 10 * push,
    zoom: (1.12 - 0.1 * ramp(frame, bf(O.start), f0 - bf(O.start), 0, 1, Easing.linear) - 0.3 * dolly - 0.37 * whip + 0.015 * creep) * (1 + 3.6 * push ** 2),
    tilt: 20 + 24 * dolly - 32 * whip,
    turn: -8 + 30 * dolly + 50 * whip + 12 * creep,
    whip,
  };
}

/** Where a point on the galaxy's floor shows on screen, how much bigger things there look, and how near it is (z). */
function see(cam: ReturnType<typeof camera>, p: { x: number; y: number }) {
  const turn = (cam.turn * Math.PI) / 180;
  const tilt = (cam.tilt * Math.PI) / 180;
  const x = p.x * Math.cos(turn) - p.y * Math.sin(turn);
  const y = p.x * Math.sin(turn) + p.y * Math.cos(turn);
  const z = y * Math.sin(tilt) * cam.zoom;
  const k = (cam.zoom * 2400) / (2400 - z);
  return { x: cam.x + x * k, y: cam.y + y * Math.cos(tilt) * k, k, z };
}

/** How soft a thing at depth z is: far things sit in a haze, near ones a little soft too; the lens is on the floor's middle. */
const soft = (z: number) => Math.min(6, Math.max(0, -z / 90) + Math.max(0, z / 160));

type Spot = { readonly x: number; readonly y: number; readonly size: number };

/** The i-th of n markets in orbit around Auni: a flat ring, tipped a little, that passes in front of it and behind. */
function orbiting(frame: number, i: number, n: number, auni: Spot) {
  const a = (i / n) * Math.PI * 2 + frame * 0.04;
  const depth = Math.sin(a);
  const [x, y] = [Math.cos(a) * auni.size * 0.85, depth * auni.size * 0.4];
  const tip = -0.18;
  return { x: auni.x + x * Math.cos(tip) - y * Math.sin(tip), y: auni.y + auni.size * 0.05 + x * Math.sin(tip) + y * Math.cos(tip), depth, size: auni.size * (0.12 + 0.025 * depth) };
}

/**
 * Everywhere Auni can put your money. Close and tilted while the named venues land (Monad first),
 * a dolly out while the markets pour in, a whip out to all of it, which slides aside for the
 * roller. Then the galaxy spirals into Auni as the camera pushes in, and Auni keeps a ring of
 * the markets in orbit beside the one chat box: "Every market. One chat."
 */
export function Offerings() {
  const frame = useFilmFrame(O.start);
  const cam = camera(frame);
  const [f0, f1] = O.flood.map(bf) as [number, number];
  const gulpAt = bf(O.gulp);
  const spin = (frame - bf(O.start)) * 0.005;
  // Each ring spirals in the way it was turning, faster as it closes.
  const inward = (p: { x: number; y: number }, k: number) => {
    const t = closing(frame, k);
    const a = t * Math.PI * 1.3 * (k % 2 ? 1 : -1);
    const seen = see(cam, { x: (p.x * Math.cos(a) - p.y * Math.sin(a)) * (1 - t), y: (p.x * Math.sin(a) + p.y * Math.cos(a)) * (1 - t) });
    return { ...seen, t, shrink: 1 - 0.7 * t, fade: interpolate(t, [0.8, 1], [1, 0], { extrapolateLeft: "clamp" }) };
  };
  const grow = 1 + 0.35 * cam.whip;
  const middle = see(cam, { x: 0, y: 0 });
  // Auni spins as it swallows the galaxy, and gulps as the last ring goes in.
  const auni: Spot = { x: middle.x, y: middle.y, size: 280 * middle.k };
  const turning = frame >= bf(O.morph) && frame < gulpAt;
  const gulp = interpolate(frame - gulpAt, [0, 3, 9], [1, 1.15, 1], clamp);
  const wave = ramp(frame, gulpAt, 10);
  // The lockup creeps in while it's read; sent, it whips up and away, into your reply on X.
  const hold = ramp(frame, bf(O.open), bf(O.send) - bf(O.open), 0, 1, Easing.linear);
  const out = ramp(frame, bf(O.send) + 3, bf(O.end) - bf(O.send) - 3, 0, 1, Easing.in(Easing.quad));
  return (
    <Sky>
      <AbsoluteFill style={{ transform: `translateY(${-1000 * out}px) scale(${1 + 0.035 * hold})`, filter: `blur(${out * 14}px)` }}>
        <ChatBox frame={frame} />
        {STARS.map((star, i) => {
          const at = Math.round(f0 + (f1 - f0) * Math.sqrt(i / STARS.length));
          if (frame < at) return null;
          // Neighbouring rings turn opposite ways.
          const t = inward(onRing(star.j, star.n, star.r, spin * (star.k % 2 ? -1 : 1) + star.k * 0.3), star.k + 1);
          const enter = land(frame, at, 6);
          const size = star.size * t.k * grow * t.shrink * interpolate(enter, [0, 0.7, 1], [0.2, 1.15, 1]);
          const style = { position: "absolute", transform: "translate(-50%, -50%)", opacity: Math.min(1, enter * 3) } as const;
          if (star.k === 2 && star.j % KEEP === 0) {
            // A kept market leaves the spiral for its place in Auni's orbit as its ring closes.
            const o = orbiting(frame, star.j / KEEP, star.n / KEEP, auni);
            const b = interpolate(t.t, [0.45, 1], [0, 1], { ...clamp, easing: ease });
            return (
              <div key={i} style={{ ...style, left: interpolate(b, [0, 1], [t.x, o.x]), top: interpolate(b, [0, 1], [t.y, o.y]), zIndex: b < 1 ? Math.round(t.z) + 1000 : o.depth > 0 ? 1002 : 1000, filter: `blur(${interpolate(b, [0, 1], [soft(t.z), o.depth < 0 ? 1.5 : 0])}px)` }}>
                <Mark name={star.name} size={interpolate(b, [0, 1], [size, o.size])} ring />
              </div>
            );
          }
          return t.fade > 0 ? (
            <div key={i} style={{ ...style, left: t.x, top: t.y, zIndex: Math.round(t.z) + 1000, opacity: style.opacity * t.fade, filter: `blur(${soft(t.z)}px)` }}>
              <Mark name={star.name} size={size} ring />
            </div>
          ) : null;
        })}
        {VENUES.map((v, i) => {
          const at = bf(O.first[i]!);
          if (frame < at) return null;
          const t = inward(onRing(i, VENUES.length, 340, -spin), 0);
          const enter = land(frame, at, 7);
          return t.fade > 0 ? (
            <div key={v.name} style={{ position: "absolute", left: t.x, top: t.y, zIndex: Math.round(t.z) + 1000, transform: `translate(-50%, -50%) scale(${t.k * t.shrink * interpolate(enter, [0, 0.7, 1], [0.3, 1.15, 1])})`, opacity: Math.min(1, enter * 3) * t.fade, filter: `blur(${soft(t.z)}px)` }}>
              {/* Monad gets a faint lamp of its own purple, like a belief on the landing. */}
              {v.name === "Monad" ? <div style={{ position: "absolute", top: 0, left: -16, width: 200, height: 200, borderRadius: 999, background: "#836ef9", filter: "blur(50px)", opacity: 0.32 }} /> : null}
              <div style={{ width: 168, height: 168, borderRadius: 48, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 0 0 1.5px rgb(20 40 90 / 0.07), 0 20px 44px -14px rgb(40 70 140 / 0.3)" }}>
                <Mark name={v.logo} size={112} />
              </div>
              {/* The names are read up close; from the whip on they would only be specks. */}
              <div style={{ position: "absolute", top: 182, left: "50%", transform: "translateX(-50%)", fontSize: 34, fontWeight: 600, color: INK, letterSpacing: "-0.01em", whiteSpace: "nowrap", opacity: 1 - cam.whip }}>{v.name}</div>
            </div>
          ) : null;
        })}
        {/* The gulp's ring, going out from Auni the moment the last of it goes in. */}
        {wave > 0 && wave < 1 ? <div style={{ position: "absolute", zIndex: 999, left: auni.x, top: auni.y, width: auni.size, height: auni.size, borderRadius: 999, border: `6px solid ${BLUE}`, opacity: 0.5 * (1 - wave), transform: `translate(-50%, -50%) scale(${0.6 + 0.9 * wave})` }} /> : null}
        <div style={{ position: "absolute", zIndex: 1001, left: auni.x, top: auni.y, transform: `translate(-50%, -50%) scale(${gulp})` }}>
          <Mascot3D shot={turning ? "spin" : "idle"} frame={turning ? (frame - bf(O.morph)) * 2 : frame} size={auni.size} />
        </div>
        <Roller frame={frame} />
        <Headline frame={frame} />
      </AbsoluteFill>
    </Sky>
  );
}

/** The roller's words, each with how long it stays: the first few long enough to read, then faster and faster. */
const WORDS = [["Stocks", 11], ["Perps", 10], ["Predictions", 9], ["Yield", 5], ["Tokens", 3.5], ["Crypto", 2.5], ["Stocks", 2], ["Perps", 1.5], ["Predictions", 1.2], ["Yield", 1.2]] as const;

/** When each word of the roller lands, then "Every market.", spread over the cycle by how long each stays. */
export function rollTicks() {
  const [c0, c1] = O.cycle.map(bf) as [number, number];
  const total = WORDS.reduce((sum, [, stay]) => sum + stay, 0);
  let gone = 0;
  return [
    ...WORDS.map(([, stay]) => {
      const at = Math.round(c0 + ((c1 - c0) * gone) / total);
      gone += stay;
      return at;
    }),
    c1,
  ];
}

/** A slot-machine roller of what Auni trades, in the right half, speeding up until "Every market." */
function Roller({ frame }: { readonly frame: number }) {
  const ticks = rollTicks();
  const shown = ticks.filter((t) => frame >= t).length - 1;
  // From the landing on, the headline carries "Every market." on its own.
  if (shown < 0 || shown === WORDS.length) return null;
  const at = ticks[shown]!;
  const t = ramp(frame, at, Math.min(4, ticks[shown + 1]! - at));
  const enter = land(frame, bf(O.aside), 8);
  const line = ROLL.size * 1.4;
  const inset = (line - ROLL.size * 1.03) / 2;
  const word = (text: string, offset: number) => (
    <div style={{ ...HEADLINE, position: "absolute", left: 0, top: inset + offset * line, fontSize: ROLL.size, whiteSpace: "nowrap", filter: `blur(${(1 - t) * 5}px)` }}>{text}</div>
  );
  return (
    <div style={{ position: "absolute", zIndex: 2000, left: ROLL.x, top: ROLL.y - inset, width: 1920 - ROLL.x, height: line, overflow: "hidden", opacity: Math.min(1, enter * 2), maskImage: "linear-gradient(to bottom, transparent 0, #000 22%, #000 78%, transparent 100%)", transform: `translateX(${(1 - enter) * 120}px)` }}>
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${(1 - t) * line}px)` }}>
        {shown > 0 ? word(WORDS[shown - 1]![0], -1) : null}
        {word(WORDS[shown]![0], 0)}
      </div>
    </div>
  );
}

/** "Every market.": lands blue at the end of the roller, then, once Auni has swallowed the galaxy, rises to head the chat box. */
function Headline({ frame }: { readonly frame: number }) {
  const at = bf(O.cycle[1]!);
  if (frame < at) return null;
  const rise = ramp(frame, bf(O.gulp) + 2, 10, 0, 1, swoop);
  const punch = interpolate(frame - at, [0, 3, 8], [1.08, 1.03, 1], { extrapolateRight: "clamp" });
  return (
    <div style={{ ...HEADLINE, position: "absolute", zIndex: 2000, whiteSpace: "nowrap", color: BLUE, left: ROLL.x, top: interpolate(rise, [0, 1], [ROLL.y, HEAD_Y]), fontSize: ROLL.size, transformOrigin: "50% 50%", transform: `scale(${punch})` }}>
      Every market.
    </div>
  );
}

/** The one chat box: it unrolls under the headline, "One chat." types in, and it's sent. */
function ChatBox({ frame }: { readonly frame: number }) {
  const [t0, t1] = O.typed.map(bf) as [number, number];
  const open = ramp(frame, bf(O.open), t1 - bf(O.open), 0, 1, swoop);
  if (open <= 0) return null;
  const typed = ramp(frame, t0, t1 - t0, 0, 1, Easing.linear);
  const text = "One chat.";
  const press = interpolate(frame - bf(O.send), [-2, 0, 4], [1, 0.86, 1], clamp);
  const ready = frame >= t1;
  return (
    <div style={{ position: "absolute", zIndex: 1, left: BOX.left, top: BOX.y - BOX.h / 2, width: interpolate(open, [0, 1], [BOX.h, BOX.w]), height: BOX.h, borderRadius: BOX.h / 2, overflow: "hidden", background: "#fff", boxShadow: "inset 0 0 0 2px rgb(20 40 90 / 0.08), 0 2px 4px rgb(20 40 90 / 0.05), 0 40px 90px -24px rgb(40 70 140 / 0.35)", opacity: Math.min(1, open * 4) }}>
      <div style={{ width: BOX.w, height: BOX.h, display: "flex", alignItems: "center", padding: `0 30px 0 ${ROLL.x - BOX.left}px` }}>
        <div style={{ ...HEADLINE, flex: 1, fontSize: BOX.text, whiteSpace: "nowrap", display: "flex", alignItems: "center" }}>
          {text.slice(0, Math.round(text.length * typed))}
          {ready ? null : <span style={{ width: 7, height: BOX.text * 0.9, marginLeft: 6, borderRadius: 4, background: BLUE, opacity: Math.floor(frame / 5) % 2 ? 1 : 0.25 }} />}
        </div>
        <div style={{ width: 140, height: 140, borderRadius: 999, background: ready ? INK : "#e9ecf2", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${press})` }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export function sounds(add: Add) {
  // Offerings: each named venue pops in with a little whoosh; the markets tick in; the camera moves are air.
  O.first.forEach((n, i) => {
    add(["pop_03", "pop_02", "main_pop"][i % 3]!, beat(n) + 0.06, -13, { pan: [-0.3, 0, 0.3][i % 3] });
    add("fast_woosh_04", beat(n) - 0.02, -23);
  });
  add("stereo_air_whoosh", beat(O.flood[0]!) + 0.4, -15);
  for (let k = O.flood[0]! * 2; k < O.flood[1]! * 2; k++) add("tick", beat(k / 2), -24, { pan: ((k % 3) - 1) * 0.45 });
  add("fast_woosh_03", beat(O.galaxy) + 0.1, -11);
  add("bass_swoosh", beat(O.galaxy) + 0.2, -14);
  // The galaxy slides aside as the roller slides in from the right.
  add("swoosh_01", beat(O.aside), -13, { pan: -0.4 });
  add("fast_woosh_04", beat(O.aside) + 0.08, -17, { pan: 0.5 });
  // The roller ticks faster and faster, then lands on "Every market." with a hit and a shine.
  const ticks = rollTicks();
  ticks.slice(0, -1).forEach((t, i) => {
    add("tick", s(t), -14 + Math.min(4, i * 0.4));
    if (i % 2 === 0) add("mouse_click_01", s(t) + 0.01, -22);
  });
  add("whoosh_hit", s(ticks[ticks.length - 1]!), -11);
  add("shine", s(ticks[ticks.length - 1]!) + 0.12, -15);
  // The galaxy spirals into Auni, who spins as it swallows, while the camera pushes in and rises to the gulp.
  add("shockwave_whoosh_01", beat(O.morph) + 0.3, -11);
  add("whoosh_02", beat(O.morph) + 0.25, -9);
  add("perfect_riser", beat(O.gulp), -16);
  // The gulp, and the orbit catching around Auni.
  add("quick_bass_impact", beat(O.gulp), -11);
  add("reverse_cymbal_ping", beat(O.gulp), -15);
  add("orb", beat(O.gulp) + 0.03, -18);
  // "Every market." rises; the chat box unrolls and lands.
  add("fast_woosh_01", s(bf(O.gulp) + 4), -16, { pan: 0.3 });
  add("swoosh_01", beat(O.open) + 0.08, -14, { pan: 0.4 });
  add("main_pop", beat(O.typed[1]!), -14);
  // "One chat." types in and the send button arms; it's sent and the whole thing whips up and away.
  add("keyboard_typing", beat(O.typed[0]!), -15, { keep: beat(O.typed[1]!) - beat(O.typed[0]!) + 0.05 });
  add("switch_click_01", beat(O.typed[1]!) + 0.04, -19);
  add("button_click", beat(O.send), -12);
  add("iphone_message", beat(O.send) + 0.05, -16);
  add("stereo_air_whoosh", s(bf(O.send) + 5), -15);
  add("fast_woosh_02", s(bf(O.send) + 7), -10);
}
