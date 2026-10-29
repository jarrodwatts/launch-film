/**
 * The hook, before the drop. A group chat fills up with a plan, message after message, faster and
 * faster, while the camera pulls back on it. On the quiet bar the chat falls away and one line
 * types itself out alone: the question the drop will answer. Then the camera dives into it,
 * accelerating into the cut, so the reveal starts at full speed.
 */
import { AbsoluteFill, Easing } from "remotion";

import { BRAND, HEADLINE } from "../brand";
import { COPY, PEOPLE } from "../content";
import { accelerate, beat, bf, land, ramp, T, useFilmFrame } from "../engine/motion";
import { type Add, s, v } from "../engine/sound";
import { Avatar } from "../parts/Avatar";
import { Backdrop } from "../parts/Backdrop";
import { Typed } from "../parts/Typed";

const H = T.hook;
/** One message row: name, bubble, gap. */
const ROW = 158;
/** Frames the typing takes: fast, so the line gets its full read before the dive. */
const TYPING = 12;

function Message({ who, text, frame, at }: { readonly who: string; readonly text: string; readonly frame: number; readonly at: number }) {
  const person = PEOPLE.find((p) => p.key === who)!;
  // One frame early, so the frame it lands on already shows it.
  const t = land(frame, at - 1, 7);
  return (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-end", height: ROW - 18, opacity: Math.min(1, t * 3), transform: `translateY(${(1 - t) * 70}px) scale(${1.25 - 0.25 * t})`, transformOrigin: "0% 100%", filter: `blur(${(1 - t) * 10}px)` }}>
      <Avatar who={person} size={76} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 28, fontWeight: 600, color: BRAND.muted, paddingLeft: 8 }}>{person.display}</div>
        <div style={{ fontSize: 52, fontWeight: 500, color: BRAND.ink, letterSpacing: "-0.02em", padding: "18px 34px", borderRadius: 40, borderBottomLeftRadius: 12, background: BRAND.surface, boxShadow: "0 18px 40px -18px rgb(40 30 90 / 0.35)", whiteSpace: "nowrap" }}>
          {text}
        </div>
      </div>
    </div>
  );
}

export function Scene() {
  const frame = useFilmFrame("hook");
  const lands = H.msgs.map(bf);
  // The camera follows the newest message, close, then pulls back to the whole chat.
  const follow = lands.reduce((y, at, i) => y + (i * ROW - y) * ramp(frame, at, 10), 0);
  const pull = ramp(frame, bf(H.pull), bf(H.quiet) - bf(H.pull));
  const zoom = 1.75 - 0.65 * pull + 0.03 * ramp(frame, 0, bf(H.pull), 0, 1, Easing.linear);
  const focus = follow + (2 * ROW - follow) * pull + ROW / 2;
  // The quiet bar: the chat falls back and out of focus, leaving the frame to the question.
  const fall = ramp(frame, bf(H.quiet), 10);
  // The dive: push into the question, accelerating, blur rising, cut at peak speed.
  const dive = ramp(frame, bf(H.dive), bf(H.end) - bf(H.dive), 0, 1, accelerate);
  const typed = bf(H.typed);
  return (
    <Backdrop frame={frame}>
      <AbsoluteFill style={{ opacity: 1 - 0.85 * fall, filter: `blur(${fall * 16}px)` }}>
        <div style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0", transform: `translate(960px, 540px) scale(${zoom * (1 - 0.08 * fall)}) translate(-430px, ${-focus}px)` }}>
          {COPY.hook.chat.map((m, i) => (frame < lands[i]! ? null : (
            <div key={i} style={{ position: "absolute", left: 0, top: i * ROW }}>
              <Message who={m.who} text={m.text} frame={frame} at={lands[i]!} />
            </div>
          )))}
        </div>
      </AbsoluteFill>
      {frame >= typed ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transformOrigin: "55% 57%", transform: `scale(${(1 + 0.04 * ramp(frame, typed, 30, 0, 1, Easing.linear)) * (1 + 7 * dive)})`, filter: `blur(${dive * 24}px)` }}>
          <div style={{ ...HEADLINE, fontSize: 132, textAlign: "center" }}>
            <Typed text={COPY.hook.question} frame={frame} start={typed} end={typed + TYPING} colour={BRAND.ink} accent={{ word: COPY.hook.accentWord, colour: BRAND.accent }} />
          </div>
        </AbsoluteFill>
      ) : null}
    </Backdrop>
  );
}

export function sounds(add: Add) {
  // Each message slams in: a whoosh leads it (not the first, on frame 0), a pop as it lands, the first with a chat ping.
  // Later ones come faster and sit a little quieter, so the first reads as the moment.
  H.msgs.forEach((at, i) => {
    if (i) add(v("whoosh", i), beat(at) - 0.03, -23, { pan: -0.3 });
    add(v("pop", i), s(bf(at) + 2), -14 - i * 0.5, { pan: -0.2 });
  });
  add(v("notify"), beat(H.msgs[0]!) + 0.12, -17);
  // The camera pulls back on the chat.
  add(v("air"), beat(H.pull) + 0.25, -17);
  // The quiet bar: the chat falls away with a soft low whoosh.
  add(v("whoosh_heavy"), beat(H.quiet) + 0.05, -21);
  // The question types itself; the typing stops when the text does.
  add(v("typing"), beat(H.typed) + 0.05, -15, { keep: s(TYPING) });
  add(v("click"), s(bf(H.typed) + TYPING), -20);
  // The dive: a rush that peaks right on the cut into the drop.
  add(v("whoosh", 2), beat(H.dive) + 0.05, -16);
  add(v("riser"), beat(H.end) - 0.02, -15);
}
