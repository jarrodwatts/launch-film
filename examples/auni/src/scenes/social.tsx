import { AbsoluteFill, Easing, interpolate } from "remotion";

import { BeliefIcon } from "../belief";
import { Gloss } from "../card";
import { COPIERS, HERO_BELIEF, type Person, QUESTION, RECEIPTS, YOU } from "../data";
import { accelerate, beat, bf, land, ramp, settle, T, useFilmFrame } from "../motion";
import { BLUE, HEADLINE, INK, MUTED, Sky } from "../parts";
import { type Add, s, WOOSH } from "../sound";
import { Avatar, GREEN, Mark, Marks, Status, Tweet, Verified } from "../ui";

const S = T.social;

// The scene is one world, in px around your post, that the camera moves over.
const POST = { left: -540, top: -330, width: 1080 };
/** Your face on the post: every coin flies here. */
const ME = { x: POST.left + 75, y: POST.top + 69 };
/** The post's Copy button, where every cursor clicks. */
const COPY = { x: 375, y: 200 };
const CARD = 620;
/**
 * Where each person's copy lands (its centre): beside your post first, then filling the frame
 * around it, three rows in the inner columns and two staggered in the outer, none touching.
 */
const SLOTS = [
  [950, -140],
  [-950, -140],
  [950, -800],
  [-950, 520],
  [950, 520],
  [-950, -800],
  [1640, -470],
  [-1640, 190],
  [1640, 190],
  [-1640, -470],
] as const;
/** Where a copy's owner's face sits on their card, where their coin sets off. */
const face = (i: number) => ({ x: SLOTS[i]![0] - CARD / 2 + 64, y: SLOTS[i]![1] - 66 });

/** Each person's moments, in frames: their cursor arrives, clicks Copy, their copy lands, their coin sets off and reaches you. */
function moments(i: number) {
  const click = bf(S.copies[i]!);
  // The first copy plays out slowly enough to follow, its card read before its coin leaves; the rest come quicker and quicker.
  const first = i === 0;
  const land = click + (first ? 9 : 7);
  const pay = land + (first ? 5 : 1);
  return { arrive: click - (first ? 14 : 8), click, land, pay, paid: pay + (first ? 13 : 9) };
}

/** The camera: where it looks (world px) and how close, from the thread to everyone at once. */
const SHOTS: readonly (readonly [number, number, number, number])[] = [
  [S.start, 0, -290, 1],
  // It leads the position unfurling, so the Copy button never drops out of frame.
  [S.posted - 0.5, 0, -250, 1],
  [S.posted + 1, 0, -140, 0.95],
  // Over as the first copy flies, close enough to read it and its coin coming back.
  [S.copies[0]! - 0.75, 0, -140, 0.97],
  [S.copies[0]! + 0.75, 360, -140, 0.92],
  [S.copies[1]! - 0.5, 360, -140, 0.93],
  // Then out, just ahead of the copies, until the whole crowd fills the frame.
  [S.copies[1]! + 0.75, 0, -140, 0.62],
  [S.copies[6]! + 0.75, 0, -140, 0.48],
  [S.end, 0, -140, 0.46],
];
function camera(frame: number) {
  const k = Math.max(0, SHOTS.findIndex(([b]) => bf(b) > frame) - 1);
  const [b0, x0, y0, z0] = SHOTS[k]!;
  const [b1, x1, y1, z1] = SHOTS[Math.min(k + 1, SHOTS.length - 1)]!;
  const t = ramp(frame, bf(b0), Math.max(1, bf(b1) - bf(b0)), 0, 1, Easing.inOut(Easing.cubic));
  return { x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t, z: z0 + (z1 - z0) * t };
}

/**
 * The pitch for the social side, picked up from the opening on X: you answer Auni's question
 * with your position attached. People arrive, each clicks Copy, and the same position lands in
 * their hands while a coin flies back to you; more and more of them, until the camera lifts your
 * face out of the crowd, coins pouring in, under "Get paid when people copy you."
 */
export function Social() {
  const frame = useFilmFrame(S.start);
  const start = bf(S.start);
  const enter = land(frame, start, 10);
  const lift = ramp(frame, bf(S.lift), 10);
  const out = ramp(frame, bf(S.out), bf(S.end) - bf(S.out), 0, 1, accelerate);
  const cam = camera(frame);
  // Lifting your face pulls focus: the crowd falls back and out of focus behind it.
  const z = cam.z * (1 - 0.1 * lift);
  const screen = (p: { x: number; y: number }) => ({ x: 960 + (p.x - cam.x) * z, y: 540 + (p.y - cam.y) * z });
  return (
    <Sky>
      <AbsoluteFill style={{ transform: `scale(${1 + 1.2 * out})`, filter: `blur(${out * 24}px)`, opacity: 1 - ramp(frame, bf(S.end) - 4, 4) }}>
        <AbsoluteFill style={{ filter: `blur(${(1 - enter) * 16 + lift * 16}px)`, opacity: 1 - 0.55 * lift }}>
          <div style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0", transform: `translate(${960 - cam.x * z}px, ${540 - cam.y * z + (1 - enter) * 400}px) scale(${z})` }}>
            <World frame={frame} />
          </div>
        </AbsoluteFill>
        <Payoff frame={frame} from={screen(ME)} size={70 * z} />
      </AbsoluteFill>
    </Sky>
  );
}

/** Everything the camera flies over: the thread, the cursors, the copies, and the coins coming back. */
function World({ frame }: { readonly frame: number }) {
  const copies = COPIERS.map((_, i) => moments(i));
  const landed = copies.filter((m) => frame >= m.land).length;
  const press = Math.max(0, ...copies.map((m) => interpolate(frame - m.click, [-1, 1, 6], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })));
  const typed = ramp(frame, bf(S.typing), bf(S.posted) - bf(S.typing) - 2, 0, 1, Easing.linear);
  const posted = bf(S.posted);
  const unfurl = land(frame, posted, 8);
  return (
    <>
      {/* Auni's question from the opening, and the thread line down to your answer. */}
      <div style={{ position: "absolute", left: POST.left, top: POST.top - 36, opacity: 0.75, transform: "translateY(-100%) scale(0.86)", transformOrigin: "0 100%" }}>
        <Tweet tweet={QUESTION} width={POST.width} />
      </div>
      <div style={{ position: "absolute", left: POST.left + 74, top: POST.top - 36, width: 4, height: 36, background: "#cfd9de" }} />
      <div style={{ position: "absolute", left: POST.left, top: POST.top }}>
        <Tweet
          tweet={{ ...YOU, text: "I am.", likes: 9400, verified: true, ago: "now" }}
          frame={frame}
          // Its counts are already in when it posts: ticking under the moving camera, they'd smear.
          since={bf(S.typing) - 45}
          typed={frame < posted ? typed : undefined}
          width={POST.width}
          attachment={frame >= posted ? <Attached frame={frame} unfurl={unfurl} landed={landed} press={press} /> : undefined}
        />
        <Gloss frame={frame} at={posted + 2} length={12} radius={34} />
        <Paid frame={frame} hits={copies.map((m) => m.paid)} x={ME.x - POST.left} y={ME.y - POST.top} d={70} on={0} />
      </div>
      {COPIERS.map((who, i) => (
        <Copier key={who.handle} frame={frame} who={who} i={i} />
      ))}
    </>
  );
}

/** 1 just as something lands, easing back to 0. */
const pulse = (frame: number, at: number) => interpolate(frame - at, [0, 2, 10], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

/**
 * Your face (diameter `d`, centred on x, y) taking coins: it jumps as each one lands (`hits`, in
 * frames) and a ring spreads out from it. `on` (0 to 1) rings it in white and blue for the payoff.
 */
function Paid({ frame, hits, x, y, d, on }: { readonly frame: number; readonly hits: readonly number[]; readonly x: number; readonly y: number; readonly d: number; readonly on: number }) {
  const hit = pulse(frame, hits.filter((at) => frame >= at).at(-1) ?? -1e9);
  return (
    <div style={{ position: "absolute", left: x - d / 2, top: y - d / 2, width: d, height: d }}>
      {hits.map((at, k) => {
        const t = (frame - at) / 14;
        if (t < 0 || t >= 1) return null;
        const r = d + 120 * settle(t);
        return <div key={k} style={{ position: "absolute", left: (d - r) / 2, top: (d - r) / 2, width: r, height: r, borderRadius: 999, boxShadow: `inset 0 0 0 ${2 + 7 * (1 - t)}px ${BLUE}`, opacity: 0.8 * (1 - t) }} />;
      })}
      <div style={{ borderRadius: 999, transform: `scale(${1 + 0.15 * hit})`, boxShadow: `0 0 0 ${0.035 * d * on}px #fff, 0 0 0 ${0.065 * d * on + 6 * hit}px ${BLUE}, 0 ${0.1 * d * on}px ${0.3 * d * on + 40 * hit}px -10px rgb(61 99 224 / ${0.5 + 0.3 * hit})` }}>
        <Avatar who={YOU} size={d} />
      </div>
    </div>
  );
}

/** Your position as it unfurls under the post: the belief, its moves, who copied it, and Copy. */
function Attached({ frame, unfurl, landed, press }: { readonly frame: number; readonly unfurl: number; readonly landed: number; readonly press: number }) {
  return (
    <div style={{ borderRadius: 30, overflow: "hidden", boxShadow: "inset 0 0 0 1.5px rgb(15 20 25 / 0.1)", background: "#fff", opacity: Math.min(1, unfurl * 3), transform: `translateY(${(1 - unfurl) * 30}px) scale(${0.94 + 0.06 * unfurl})`, transformOrigin: "50% 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 24, padding: "24px 30px", background: BLUE, color: "#fff" }}>
        <div style={{ borderRadius: 999, padding: 6, background: "rgb(255 255 255 / 0.25)", boxShadow: "inset 0 0 0 2px rgb(255 255 255 / 0.5)" }}>
          <BeliefIcon size={72} />
        </div>
        <div>
          <div style={{ fontSize: 24, fontWeight: 600, opacity: 0.85 }}>My position</div>
          <div style={{ ...HEADLINE, fontSize: 48, color: "#fff" }}>{HERO_BELIEF.name}</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px", padding: "20px 30px 6px" }}>
        {RECEIPTS.map((r) => (
          <div key={r.did} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 27, fontWeight: 600, color: INK, whiteSpace: "nowrap" }}>
            <Status size={32} done={1} colour={GREEN} />
            <Mark name={r.logo} size={38} />
            {r.did}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 22, padding: "14px 24px 20px 30px" }}>
        <div style={{ display: "flex" }}>
          {COPIERS.slice(0, landed).map((who, i) => {
            const t = land(frame, moments(i).land, 6);
            return (
              <div key={who.handle} style={{ marginLeft: i ? -20 : 0, borderRadius: 999, boxShadow: "0 0 0 4px #fff", transform: `scale(${interpolate(t, [0, 0.7, 1], [0.3, 1.2, 1])})` }}>
                <Avatar who={who} size={56} />
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 40px", borderRadius: 999, background: INK, color: "#fff", fontSize: 34, fontWeight: 700, transform: `scale(${1 - 0.1 * press})`, boxShadow: `0 0 0 ${8 * press}px rgb(61 99 224 / 0.35)` }}>
          <CopyIcon />
          Copy
        </div>
      </div>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinejoin="round">
      <rect x="8" y="8" width="13" height="13" rx="3" />
      <path d="M16 8V6a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h2" />
    </svg>
  );
}

/**
 * One person copying: their cursor (their face on it) comes in and clicks Copy, the same
 * position flies out of the post into their hands with their name on it, and a coin flies
 * from them back to you.
 */
function Copier({ frame, who, i }: { readonly frame: number; readonly who: Person; readonly i: number }) {
  const m = moments(i);
  if (frame < m.arrive) return null;
  const [sx, sy] = SLOTS[i]!;
  const side = Math.sign(sx);
  // The cursor sweeps in from beyond their spot, and is gone once its copy is on the way.
  const glide = ramp(frame, m.arrive, m.click - m.arrive - 1, 0, 1, Easing.bezier(0.3, 0, 0.1, 1));
  // It comes up from under the post, on its side, so its tag never crosses the moves; each lands
  // on a slightly different spot of the button, so a rush of them doesn't stack up.
  const cx = interpolate(glide, [0, 1], [COPY.x + side * 800, COPY.x + ((i % 3) - 1) * 50]);
  const cy = interpolate(glide, [0, 1], [COPY.y + 900, COPY.y + ((i % 2) - 0.5) * 24]);
  const click = interpolate(frame - m.click, [-1, 1, 5], [1, 0.82, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const gone = ramp(frame, m.click + 2, 5);
  // The copy arcs from the Copy button to their spot and lands with a little bounce: over the top
  // to the top row, under for the rest, so it never covers your face as a coin lands on it.
  const fly = land(frame, m.click + 1, m.land - m.click - 1);
  const arc = sy < -400 ? 160 : -120;
  const pop = interpolate(frame - m.land, [0, 3, 9], [1, 1.06, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const x = interpolate(fly, [0, 1], [COPY.x, sx]);
  // Landed, it floats gently, so the crowd never sits still.
  const y = interpolate(fly, [0, 1], [COPY.y, sy]) - Math.sin(Math.min(1, fly) * Math.PI) * arc + Math.sin((frame - m.land) / 14 + i) * 8 * Math.min(1, fly);
  // Their coin, from their face back to yours; the first one big, and low enough to stay clear of Auni's question.
  const from = face(i);
  const first = i === 0;
  const coin = ramp(frame, m.pay, m.paid - m.pay, 0, 1, Easing.bezier(0.45, 0, 0.55, 1));
  return (
    <>
      {frame > m.click ? (
        <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${(0.25 + 0.75 * Math.min(1, fly)) * pop}) rotate(${(1 - Math.min(1, fly)) * side * -8}deg)`, opacity: Math.min(1, fly * 4) }}>
          <CopyCard who={who} />
        </div>
      ) : null}
      {gone < 1 ? (
        <div style={{ position: "absolute", left: cx, top: cy, opacity: 1 - gone, transform: `scale(${click})`, transformOrigin: "0 0" }}>
          <Cursor who={who} named={i < 4} />
        </div>
      ) : null}
      {coin > 0 && coin < 1 ? <Coin x={interpolate(coin, [0, 1], [from.x, ME.x])} y={interpolate(coin, [0, 1], [from.y, ME.y]) - Math.sin(coin * Math.PI) * (first ? 60 : 220)} size={first ? 130 : 110} turn={frame} /> : null}
    </>
  );
}

/** Someone else's pointer on your post: an arrow, and a tag with their face (and name, for the first few). */
function Cursor({ who, named }: { readonly who: Person; readonly named: boolean }) {
  return (
    <div style={{ position: "relative" }}>
      <svg width="58" height="58" viewBox="0 0 24 24" style={{ filter: "drop-shadow(0 4px 8px rgb(16 22 35 / 0.3))" }}>
        <path d="M3 2l7.5 19 2.6-7.9L21 10.5z" fill={BLUE} stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" />
      </svg>
      <div style={{ position: "absolute", left: 44, top: 44, display: "flex", alignItems: "center", gap: 12, padding: named ? "8px 24px 8px 8px" : 8, borderRadius: 999, background: BLUE, color: "#fff", fontSize: 30, fontWeight: 700, whiteSpace: "nowrap", boxShadow: "0 12px 26px -8px rgb(16 22 35 / 0.4)" }}>
        <Avatar who={who} size={52} />
        {named ? who.name : null}
      </div>
    </div>
  );
}

/** The same position, in their hands: their face and name on top, then your belief, all four moves in. */
function CopyCard({ who }: { readonly who: Person }) {
  return (
    <div style={{ width: CARD, borderRadius: 36, background: "#fff", padding: 18, boxShadow: "inset 0 0 0 1.5px rgb(20 40 90 / 0.07), 0 30px 60px -20px rgb(40 70 140 / 0.4)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "4px 8px 16px" }}>
        <Avatar who={who} size={84} />
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 36, fontWeight: 700, color: INK, whiteSpace: "nowrap" }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{who.name}</span>
            {who.verified ? <Verified size={32} /> : null}
          </div>
          <div style={{ fontSize: 34, color: MUTED }}>copied your position</div>
        </div>
      </div>
      <div style={{ borderRadius: 24, overflow: "hidden", boxShadow: "inset 0 0 0 1.5px rgb(20 40 90 / 0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", background: BLUE }}>
          <BeliefIcon size={54} />
          <div style={{ ...HEADLINE, fontSize: 33, color: "#fff", whiteSpace: "nowrap" }}>{HERO_BELIEF.name}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px" }}>
          <Marks names={HERO_BELIEF.logos} size={46} />
          <div style={{ flex: 1 }} />
          <Status size={38} done={1} colour={GREEN} />
          <span style={{ fontSize: 34, fontWeight: 700, color: GREEN }}>Same 4 moves</span>
        </div>
      </div>
    </div>
  );
}

/** A dollar coin with an edge, rocking as it flies (`turn` drives the rock), centred on (x, y). */
function Coin({ x, y, size, turn }: { readonly x: number; readonly y: number; readonly size: number; readonly turn: number }) {
  return (
    <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, perspective: 600 }}>
      <div style={{ position: "relative", width: size, height: size, transformStyle: "preserve-3d", transform: `rotateY(${Math.sin(turn * 0.45) * 50}deg)` }}>
        {Array.from({ length: 4 }, (_, k) => (
          <div key={k} style={{ position: "absolute", inset: 0, borderRadius: 999, background: "#1f5fbf", transform: `translateZ(${-(k + 1) * 2.5}px)` }} />
        ))}
        <Mark name="venue:usdc" size={size} ring style={{ position: "relative" }} />
      </div>
    </div>
  );
}

/**
 * The payoff: your face lifts out of the post into the foreground, coins pour into it from all
 * around above it, faster and faster, and the line lands under it.
 */
function Payoff({ frame, from, size }: { readonly frame: number; readonly from: { x: number; y: number }; readonly size: number }) {
  const liftAt = bf(S.lift);
  if (frame < liftAt) return null;
  const t = land(frame, liftAt, 12);
  const to = { x: 960, y: 320 };
  const coins = coinTimes();
  const line = bf(S.line);
  const words = ["when", "people", "copy", "you."];
  return (
    <AbsoluteFill>
      {coins.map((at, k) => {
        const c = ramp(frame, at, FLIGHT, 0, 1, Easing.bezier(0.3, 0, 0.7, 1));
        if (c <= 0 || c >= 1) return null;
        // Each sets off from somewhere along the top and sides, so none crosses the line below.
        const a = Math.PI * (1 + ((k * 0.618) % 1));
        const p = { x: to.x + 980 * Math.cos(a), y: to.y + 420 * Math.sin(a) };
        return <Coin key={k} x={interpolate(c, [0, 1], [p.x, to.x])} y={interpolate(c, [0, 1], [p.y, to.y]) - Math.sin(c * Math.PI) * 100} size={interpolate(c, [0, 1], [140, 100])} turn={frame + k * 7} />;
      })}
      <Paid frame={frame} hits={coins.map((at) => at + FLIGHT)} x={interpolate(t, [0, 1], [from.x, to.x])} y={interpolate(t, [0, 1], [from.y, to.y])} d={interpolate(t, [0, 1], [size, 280])} on={t} />
      <div style={{ position: "absolute", top: 520, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {frame >= line ? (
          <div style={{ ...HEADLINE, fontSize: 200, color: BLUE, transform: `scale(${1.3 - 0.3 * land(frame, line, 6)})`, opacity: Math.min(1, land(frame, line, 6) * 3), filter: `blur(${(1 - land(frame, line, 6)) * 10}px)` }}>Get paid</div>
        ) : null}
        <div style={{ display: "flex", gap: 30, marginTop: 6 }}>
          {words.map((word, i) => {
            const at = bf(S.line + 0.5 + i * 0.5);
            const w = land(frame, at, 5);
            return frame < at ? null : (
              <span key={word} style={{ ...HEADLINE, fontSize: 112, display: "inline-block", opacity: Math.min(1, w * 3), transform: `translateY(${(1 - w) * 40}px)`, filter: `blur(${(1 - w) * 8}px)` }}>
                {word}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
}

/** How long a payoff coin is in the air, in frames. */
const FLIGHT = 12;
/** When each payoff coin sets off: a few at first, then a pour. */
function coinTimes() {
  const [a, b] = S.paid.map(bf) as [number, number];
  const n = 36;
  return Array.from({ length: n }, (_, k) => Math.round(a + (b - a) * Math.sqrt(k / (n - 1))));
}

export function sounds(add: Add) {
  // Back on X: the thread rises in, "I am." types and posts with a pop, the position unfurls with a shine.
  add("swoosh_01", beat(S.start) + 0.05, -12);
  add("keyboard_typing", beat(S.typing), -19, { keep: beat(S.posted) - beat(S.typing) - 0.1 });
  add("pop_03", beat(S.posted), -12);
  add("swoosh_02", s(bf(S.posted) + 3), -18);
  add("shine", s(bf(S.posted) + 6), -17);
  // The camera eases in on the first copy, then pulls out to everyone.
  add("whoosh_02", beat(S.copies[0]! - 0.75) + 0.1, -19);
  add("stereo_air_whoosh", beat(S.copies[1]! - 0.5) + 0.1, -18);
  add("bass_swoosh", beat(S.copies[2]!) + 0.3, -17);
  // Each person: their cursor sweeps in, clicks Copy, their copy flies out and lands, their coin reaches you.
  COPIERS.forEach((_, i) => {
    const m = moments(i);
    const pan = Math.sign(SLOTS[i]![0]) * (Math.abs(SLOTS[i]![0]) > 1000 ? 0.6 : 0.35);
    const quiet = Math.min(6, i);
    add(WOOSH[i % 4]!, s(m.arrive + 4), -24 - quiet / 2, { pan });
    add("mouse_click_01", s(m.click), -13 - quiet / 2);
    add("swoosh_02", s(m.click + 3), -24, { pan });
    add(["pop_02", "main_pop"][i % 2]!, s(m.land), -15 - quiet / 2, { pan });
    if (i === 0) add("whoosh_01", s(m.pay), -17, { pan: -0.2 });
    add(["pay_ding", "item_purchase"][i % 2]!, s(m.paid), (i === 0 ? -10 : -14) - quiet / 2, { pan: -0.3 });
  });
  // Your face lifts out of the crowd; coins pour into it, a ding each, a till on the last; the line lands.
  add("whoosh_hit", s(bf(S.lift) + 4), -13);
  add("riser_01", beat(S.paid[1]!), -17);
  coinTimes().forEach((at, k) => {
    if (k % 3 === 0) add(WOOSH[k % 4]!, s(at + 3), -26, { pan: ((k % 5) - 2) * 0.25 });
    add(["item_purchase", "pay_ding", "pop_01"][k % 3]!, s(at + FLIGHT), -20, { pan: ((k % 5) - 2) * 0.1 });
  });
  add("cash_register_01", s(coinTimes().at(-1)! + FLIGHT) + 0.05, -12);
  add("quick_bass_impact", beat(S.line), -11);
  [0.5, 1, 1.5, 2].forEach((n) => add("tick", beat(S.line + n), -19));
  add("fast_woosh_01", beat(S.out) + 0.15, -12);
}
