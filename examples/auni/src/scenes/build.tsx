import { AbsoluteFill, Easing, interpolate } from "remotion";

import { Gloss } from "../card";
import { HERO, QUESTION, REPLIES, TAKES } from "../data";
import { accelerate, beat, bf, land, ramp, T, useFilmFrame } from "../motion";
import { HEADLINE, Sky } from "../parts";
import { type Add, s, WOOSH } from "../sound";
import { Avatar, reaches, Tweet } from "../ui";

const B = T.build;
const Q = T.question;
// Where each take lands in the opening stack, and its tilt.
const SPOTS = [
  { x: -240, y: -130, r: -3 }, { x: 230, y: 120, r: 2.5 }, { x: -210, y: 150, r: 1.5 }, { x: 250, y: -140, r: -2 },
  { x: -60, y: -40, r: -1 }, { x: 110, y: 50, r: 2 },
];

/** The first takers, piling in under the hero's post as its replies arrive; their takes land next. */
const CROWD = TAKES.slice(0, B.takes.length);
/** The hero's reply count at which each of the crowd piles in. */
const PILE = [1, 5, 25, 120, 500];
const REPLIED = HERO.likes / 9;

/** Big posts that whip past the lens while the camera pulls back, like pages in the wind; gone before the headline. */
const FLYERS = [0, 0.25, 0.5, 0.75].map((after, i) => ({ at: B.wall + after, from: i % 2 ? 1 : -1, y: [-260, 200, -40, 300][i]!, take: i % TAKES.length }));

/**
 * The build. One take types itself out and posts, and the engagement floods in; then the timeline
 * answers, take after take, faster and faster, until the camera pulls back on a wall of them with
 * more flying past, and "Everyone has a take."
 */
export function Build() {
  const frame = useFilmFrame(T.start);
  const wall = bf(B.wall);
  const lands = [B.hero, ...B.takes].map(bf);
  const cards = [HERO, ...CROWD];
  const typed = ramp(frame, bf(B.hero) + 4, bf(B.typed) - bf(B.hero) - 4, 0, 1, Easing.linear);
  const posted = bf(B.posted);
  // The first take fills the frame while it types, leans in as the engagement floods in, then makes room for the others.
  const lead = 1.5 - 0.06 * land(frame, lands[0]!, 12) + 0.04 * ramp(frame, lands[0]!, posted - lands[0]!, 0, 1, Easing.linear) + 0.12 * ramp(frame, posted, lands[1]! - posted, 0, 1, Easing.inOut(Easing.quad)) - 0.57 * ramp(frame, lands[1]!, 8);
  const out = ramp(frame, wall, bf(B.everyone) - wall + 6, 0, 1, Easing.bezier(0.3, 0, 0.2, 1));
  const shake = frame >= bf(B.shake) ? Math.sin((frame - bf(B.shake)) * 2.4) * 14 * Math.exp(-(frame - bf(B.shake)) / 4) : 0;
  const dim = ramp(frame, bf(B.everyone), 6);
  // The camera glides after each take as it lands, so the newest one sits near the middle of the frame.
  const focus = lands.slice(1).reduce((at, start, i) => {
    const t = ramp(frame, start, 10);
    return { x: at.x + (SPOTS[i]!.x - at.x) * t, y: at.y + (SPOTS[i]!.y - at.y) * t };
  }, { x: 0, y: 0 });
  return (
    <Sky>
      <AbsoluteFill style={{ transform: `translateX(${shake}px)` }}>
        {frame >= wall - 2 ? <Wall frame={frame} out={out} dim={dim} /> : null}
        {/* The opening stack: the camera pulls back past it, so it drops out of focus onto the wall behind. */}
        <AbsoluteFill style={{ transform: `scale(${1 - 0.5 * out}) translate(${-0.7 * focus.x}px, ${-0.7 * focus.y}px)`, opacity: 1 - ramp(out, 0.15, 0.3), filter: `blur(${30 * ramp(out, 0, 0.15, 0, 1, Easing.linear)}px)` }}>
          {cards.map((take, i) => {
            const start = lands[i]!;
            if (frame < start) return null;
            const arrive = land(frame, start, 7);
            const depth = lands.slice(i + 1).reduce((sum, later) => sum + ramp(frame, later, 7), 0);
            const spot = i === 0 ? { x: 0, y: 0, r: 0 } : SPOTS[i - 1]!;
            const scale = (i === 0 ? lead : 2.3 - 1.15 * arrive) * 0.88 ** depth;
            const pop = i === 0 ? interpolate(frame - posted, [0, 3, 9], [1, 1.04, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
            return (
              <AbsoluteFill key={take.handle} style={{ alignItems: "center", justifyContent: "center" }}>
                <div style={{ position: "relative", transform: `translate(${spot.x}px, ${spot.y}px) rotate(${spot.r}deg) scale(${scale * pop})`, opacity: i === 0 ? Math.min(1, (frame - start + 1) / 3) : 1, filter: `blur(${(i ? (1 - arrive) * 14 : 0) + depth * 2.6}px)` }}>
                  <Tweet tweet={take} frame={frame} since={i === 0 ? posted : undefined} typed={i === 0 ? typed : undefined} reply={depth > 0.5 ? REPLIES[i % REPLIES.length] : undefined} />
                  {i === 0 ? <Gloss frame={frame} at={posted} length={12} radius={34} /> : null}
                  {i === 0 ? <Crowd frame={frame} fade={depth} /> : null}
                  {/* Takes further back sit in the haze, without showing through the ones on top. */}
                  <div style={{ position: "absolute", inset: 0, borderRadius: 34, background: "#eef2fb", opacity: Math.min(0.6, 0.18 * depth) }} />
                </div>
              </AbsoluteFill>
            );
          })}
        </AbsoluteFill>
        {FLYERS.map((f) => {
          const t = ramp(frame, bf(f.at), 8, 0, 1, Easing.bezier(0.3, 0, 0.7, 1));
          if (t <= 0 || t >= 1) return null;
          return (
            <AbsoluteFill key={f.at} style={{ alignItems: "center", justifyContent: "center" }}>
              <div style={{ transform: `translate(${f.from * interpolate(t, [0, 1], [1500, -1500])}px, ${f.y}px) rotate(${f.from * (12 - 24 * t)}deg) scale(${1.8 - 0.4 * Math.sin(t * Math.PI)})`, filter: "blur(10px)" }}>
                <Tweet tweet={TAKES[f.take]!} />
              </div>
            </AbsoluteFill>
          );
        })}
      </AbsoluteFill>
      <Everyone frame={frame} />
    </Sky>
  );
}

/** The faces of the first takers, piling in under the hero's post as its replies arrive; they leave as it's buried. */
function Crowd({ frame, fade }: { readonly frame: number; readonly fade: number }) {
  return (
    <div style={{ position: "absolute", left: 30, bottom: -56, display: "flex", opacity: 1 - fade }}>
      {CROWD.map((who, i) => {
        const t = land(frame, bf(B.posted) + reaches(REPLIED, PILE[i]!), 7);
        const pop = interpolate(t, [0, 0.6, 1], [0.3, 1.15, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return t > 0 ? (
          <div key={who.handle} style={{ marginLeft: i ? -20 : 0, borderRadius: 999, boxShadow: "0 0 0 5px #fff, 0 10px 24px -6px rgb(40 70 140 / 0.35)", transform: `translateY(${(1 - t) * -40}px) scale(${pop})`, opacity: Math.min(1, t * 3) }}>
            <Avatar who={who} size={64} />
          </div>
        ) : null;
      })}
    </div>
  );
}

/**
 * The timeline as a wall that keeps growing as the camera pulls back: no gaps, takes everywhere.
 * It shows only once the stack in front is out of focus, and falls away into the question.
 */
function Wall({ frame, out, dim }: { readonly frame: number; readonly out: number; readonly dim: number }) {
  const all = [HERO, ...TAKES];
  const since = frame - bf(B.wall);
  const columns = 9;
  const rows = 9;
  const fall = ramp(frame, bf(B.end - 0.5), bf(B.end) - bf(B.end - 0.5), 0, 1, accelerate);
  const zoom = (2.1 - 1.55 * out) * (1 - 0.3 * fall);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: ramp(out, 0.08, 0.12, 0, 1, Easing.linear) * (1 - 0.55 * dim) * (1 - fall), filter: `blur(${dim * 7 + fall * 16}px)` }}>
      <div style={{ position: "relative", width: columns * 480, height: rows * 330, transform: `scale(${zoom}) rotate(${-4 + 4 * out}deg)` }}>
        {Array.from({ length: columns }, (_, c) => {
          const speed = c % 2 ? 3.4 : -2.6;
          return (
            <div key={c} style={{ position: "absolute", left: c * 480, top: since * speed - 330 }}>
              {Array.from({ length: rows + 2 }, (_, r) => {
                const take = all[(c * 4 + r * 3) % all.length]!;
                const pop = bf(B.wall) + ((c * 5 + r * 3) % 11);
                const reply = frame > pop + 6 && (c + r) % 3 === 0 ? REPLIES[(c + r) % REPLIES.length] : undefined;
                return (
                  <div key={r} style={{ width: 460, height: 330, transform: "scale(0.44)", transformOrigin: "0 0" }}>
                    <Tweet tweet={take} frame={frame} reply={reply} />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

/** "Everyone has a take." lands on the first punch and grows on the second. */
function Everyone({ frame }: { readonly frame: number }) {
  const start = bf(B.everyone);
  if (frame < start) return null;
  const t = land(frame, start, 6);
  const punch = frame >= bf(B.shake) ? interpolate(frame - bf(B.shake), [0, 3, 10], [1, 1.12, 1.06], { extrapolateRight: "clamp" }) : 1;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ ...HEADLINE, fontSize: 150, transform: `scale(${(1.4 - 0.4 * t) * punch})`, opacity: Math.min(1, t * 3), filter: `blur(${(1 - t) * 14}px)` }}>Everyone has a take.</div>
    </AbsoluteFill>
  );
}

/**
 * The quiet bar before the drop: the wall has fallen away, and Auni's question pulls into focus
 * on the cut. On the last half beat the camera dives into it, speeding up into the cut.
 */
export function Question() {
  const frame = useFilmFrame(Q.start);
  const start = bf(Q.start);
  const arrive = land(frame, start, 8, 30);
  // In focus as soon as it lands, while the scale keeps creeping.
  const focus = ramp(frame, start, 8);
  const dive = ramp(frame, bf(Q.dive), bf(0) - bf(Q.dive), 0, 1, accelerate);
  return (
    <Sky>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `scale(${1 + 0.05 * ramp(frame, start, bf(0) - start, 0, 1, Easing.linear) + 2.6 * dive})`, filter: `blur(${dive * 20}px)` }}>
        <div style={{ position: "relative", transform: `scale(${1.95 - 0.3 * arrive})`, filter: `blur(${(1 - focus) * 12}px)` }}>
          <Tweet tweet={QUESTION} />
          <Gloss frame={frame} at={start + 2} length={12} radius={34} />
        </div>
      </AbsoluteFill>
    </Sky>
  );
}

export function sounds(add: Add) {
  // The first take types itself out, then posts with a pop and a shine as its counts slide in.
  add("keyboard_typing", beat(B.hero) + 0.45, -16, { keep: beat(B.typed) - beat(B.hero) - 0.2 });
  add("pop_03", beat(B.posted), -12);
  add("shine", beat(B.posted) + 0.15, -16);
  add("swoosh_01", beat(B.posted) + 0.12, -19);
  // The engagement floods in: the first like, ticks as the counts roll (speeding up into a rattle until
  // the first take lands), a pop as each replier lands under the post, and a riser into that first take.
  const live = beat(B.posted);
  add("favorite", live + s(reaches(HERO.likes, 1)), -13, { pan: 0.15 });
  const flood = bf(B.takes[0]!) - bf(B.posted);
  for (let at = reaches(HERO.likes, 1), gap = 4; at < flood; at += gap, gap = Math.max(1.2, gap * 0.86)) {
    add("tick", live + s(at), -23 + 6 * (at / flood), { pan: Math.sin(at) * 0.4 });
  }
  CROWD.forEach((_, i) => add(["pop_02", "main_pop", "pop_03"][i % 3]!, live + s(reaches(REPLIED, PILE[i]!)), -17, { pan: -0.4 }));
  add("riser_01", beat(B.takes[0]!) - 0.02, -15);
  // The timeline answers: a whoosh as each take flies in, a soft pop as it lands, a tick as a reply chip appears.
  B.takes.forEach((n, i) => {
    add(WOOSH[i % 4]!, beat(n), -13, { pan: i % 2 ? -0.35 : 0.35 });
    add("pop_02", beat(n) + 0.18, -22, { pan: i % 2 ? -0.35 : 0.35 });
    if (i) add("tick", beat(n) + 0.2, -24);
  });
  // The camera pulls back on air; posts fly past the lens like pages; replies tick in across the wall.
  add("stereo_air_whoosh", beat(B.wall) + 0.2, -13);
  FLYERS.forEach((f, i) => add(WOOSH[i % 4]!, beat(f.at) + 0.15, -12, { pan: f.from * -0.6 }));
  for (let k = 0; k < 8; k++) add("tick", beat(B.wall) + 0.12 * k + 0.1, -25, { pan: ((k % 3) - 1) * 0.5 });
  add("impact_whoosh_drum", beat(B.everyone), -10);
  add("quick_bass_impact", beat(B.shake), -15);
  add("swoosh_02", beat(B.end - 0.5), -16);

  // The quiet bar: the wall falls away, Auni's question pings in and shines, the camera dives.
  add("reverse_cymbal_ping", beat(Q.start) + 0.1, -20);
  add("positive_notification", beat(Q.start), -12);
  add("shine", beat(Q.start) + 0.12, -17);
  add("perfect_riser", beat(0) - 0.03, -15);
  add("fast_woosh_02", beat(Q.dive) + 0.12, -11);
}
