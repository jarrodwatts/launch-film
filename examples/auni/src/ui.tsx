import { BarChart2, Heart, MessageCircle, Repeat2 } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { Img, interpolate, staticFile } from "remotion";

import { logoFile, logoFit, type Person, type Tweet as TweetData } from "./data";
import { land, ramp } from "./motion";
import { HEADLINE, INK, MUTED } from "./parts";

export const GREEN = "#1f9d55";
const X_BLUE = "#1d9bf0";

/** Any logo by key ("venue:monad", "xstocks:NVDAx", "landing:nike"), in a circle, fitted per logo. */
export function Mark({ name, size, ring = false, style }: { readonly name: string; readonly size: number; readonly ring?: boolean; readonly style?: CSSProperties }) {
  const fit = logoFit(name);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        overflow: "hidden",
        flex: "none",
        background: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: ring ? `0 0 0 ${Math.max(2, size * 0.07)}px #fff, 0 2px 6px rgb(20 40 90 / 0.14)` : "0 0 0 1px rgb(15 23 42 / 0.06)",
        ...style,
      }}
    >
      <Img
        src={staticFile(logoFile(name))}
        style={{ width: size * (1 - 2 * fit.inset), height: size * (1 - 2 * fit.inset), objectFit: fit.inset ? "contain" : "cover", transform: `scale(${fit.scale})` }}
      />
    </div>
  );
}

/** The landing's overlapping logo stack. */
export function Marks({ names, size }: { readonly names: readonly string[]; readonly size: number }) {
  return (
    <div style={{ display: "flex" }}>
      {names.map((name, i) => (
        <div key={`${name}${i}`} style={{ marginLeft: i ? -size * 0.22 : 0 }}>
          <Mark name={name} size={size} ring />
        </div>
      ))}
    </div>
  );
}

/** A profile picture: a face, or initials on a deep colour. */
export function Avatar({ who, size }: { readonly who: Person; readonly size: number }) {
  const src = who.photo ?? (who.face ? `faces/${who.face}.webp` : null);
  if (src) return <Img src={staticFile(src)} style={{ width: size, height: size, borderRadius: 999, flex: "none", objectFit: "cover", background: "#e4e9ff" }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: 999, flex: "none", background: who.colour, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.44, fontWeight: 700 }}>
      {who.initials}
    </div>
  );
}

export function XLogo({ size }: { readonly size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={INK}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function Verified({ size }: { readonly size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path fill={X_BLUE} d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z" />
      <path fill="white" d="M10.54 16.4 7 12.86l1.42-1.41 2.12 2.12 4.95-4.95 1.41 1.42z" />
    </svg>
  );
}

/** A fresh post's counts land at 0 and hold this many frames, then take `VIRAL` frames to go viral. */
const HOLD = 12;
export const VIRAL = 45;

/**
 * A fresh post's count, `age` frames after it went live, heading for `total`: it holds at 0, then
 * multiplies every frame (1, 2, 6, 17, 110, 735...), so it crawls, then races, then brakes onto
 * `total` a fifth of `VIRAL` late.
 */
export function engaged(total: number, age: number) {
  const run = (age - HOLD) / VIRAL;
  const lift = run < 0.8 ? run : run < 1.2 ? 0.8 + 0.2 * (1 - ((1.2 - run) / 0.4) ** 2) : 1;
  return run <= 0 ? 0 : (total + 1) ** lift - 1;
}

/** When a fresh post's count heading for `total` reaches `n`, in frames after it went live. */
export function reaches(total: number, n: number) {
  const lift = Math.log(n + 1) / Math.log(total + 1);
  return HOLD + VIRAL * (lift <= 0.8 ? lift : 1.2 - 0.4 * Math.sqrt(1 - (lift - 0.8) / 0.2));
}

/**
 * A count the way X writes it ("689", "12.4K", "1K", "1.2M"), on odometer wheels: each digit rolls
 * over with the ones after it. While it's `rolling` the tenths wheel stays, so the width holds still.
 */
function Roll({ value, rolling }: { readonly value: number; readonly rolling: boolean }) {
  const suffix = value >= 1e6 ? "M" : value >= 1e3 ? "K" : "";
  const units = value / (suffix === "M" ? 1e5 : suffix === "K" ? 100 : 1);
  // Every wheel turns over during the last tenth before its carry, so a new leading wheel rolls in with them.
  const places = String(Math.floor(units + 0.1)).length;
  const tenths = rolling || Math.floor(units) % 10 !== 0;
  const wheel = (place: number) => {
    const size = 10 ** place;
    const at = (Math.floor(units / size) % 10) + ramp(units % size, size - 0.1, 0.1);
    return (
      <span key={place} style={{ display: "inline-block", height: "1.2em", overflow: "hidden" }}>
        <span style={{ display: "flex", flexDirection: "column", transform: `translateY(${-at * 1.2}em)` }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, i) => (
            <span key={i} style={{ height: "1.2em", lineHeight: "1.2em" }}>{d}</span>
          ))}
        </span>
      </span>
    );
  };
  return (
    <span style={{ display: "inline-flex" }}>
      {Array.from({ length: places }, (_, i) => places - 1 - i).flatMap((place) => (!suffix || place > 0 ? [wheel(place)] : tenths ? [<span key="dot">.</span>, wheel(0)] : []))}
      {suffix}
    </span>
  );
}

/** X's like: the heart fills and pops, a ring flashes out and a few sparks fly. `t` is frames since the first like. */
function Like({ t }: { readonly t: number }) {
  const lit = t >= 0;
  const pop = interpolate(t, [0, 3, 8], [0.5, 1.3, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const burst = ramp(t, 0, 12);
  return (
    <span style={{ position: "relative", display: "flex" }}>
      {lit && burst < 1 ? (
        <>
          <span style={{ position: "absolute", left: "50%", top: "50%", width: 70, height: 70, margin: -35, borderRadius: 999, border: `${6 * (1 - burst)}px solid #f91880`, transform: `scale(${0.3 + burst})`, opacity: 1 - burst }} />
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
            return <span key={i} style={{ position: "absolute", left: "50%", top: "50%", width: 8, height: 8, margin: -4, borderRadius: 999, background: "#f91880", transform: `translate(${Math.cos(a) * 46 * burst}px, ${Math.sin(a) * 46 * burst}px) scale(${1 - burst})` }} />;
          })}
        </>
      ) : null}
      <Heart size={34} strokeWidth={1.8} fill={lit ? "#f91880" : "none"} color={lit ? "#f91880" : MUTED} style={{ transform: `scale(${lit ? pop : 1})` }} />
    </span>
  );
}

/**
 * A post on X, the way the timeline draws it, with the text set big enough to read at a glance.
 * Given `since` (the frame it went live), its counts row slides in at 0 and the engagement floods
 * in: the counts roll up and the first like pops. Without it, it's an older post with settled counts. `reply` pins a reply chip to its corner.
 */
export function Tweet({
  tweet,
  frame = 0,
  since,
  reply,
  attachment,
  width = 1040,
  style,
  typed,
}: {
  readonly tweet: TweetData;
  readonly frame?: number;
  readonly since?: number | undefined;
  readonly reply?: string | undefined;
  readonly attachment?: ReactNode;
  readonly width?: number;
  readonly style?: CSSProperties;
  /** How much of the text is typed so far (0 to 1). */
  readonly typed?: number;
}) {
  const age = since === undefined ? Infinity : frame - since;
  const count = (total: number) => (since === undefined ? Math.round(total) : engaged(Math.round(total), age));
  const rolling = age < HOLD + 1.2 * VIRAL;
  const replies = tweet.likes / 9;
  const live = since === undefined ? 1 : land(frame, since, 9);
  // Each stat keeps its own column, so nothing shifts sideways as the counts gain digits.
  const stat = (i: number, icon: ReactNode, total: number, colour = MUTED) => {
    const t = since === undefined ? 1 : land(frame, since + 1.5 * i, 9);
    return (
      <span style={{ display: "flex", alignItems: "center", gap: 12, color: colour, opacity: Math.min(1, t * 2), transform: `translateY(${(1 - t) * 26}px)` }}>
        {icon}
        <Roll value={count(total)} rolling={rolling} />
      </span>
    );
  };
  const liked = age - reaches(tweet.likes, 1);
  return (
    <div style={{ position: "relative", width, ...style }}>
      <div
        style={{
          position: "relative",
          padding: "34px 40px 30px",
          borderRadius: 34,
          background: "#fff",
          boxShadow: "inset 0 0 0 1.5px rgb(15 20 25 / 0.08), 0 2px 4px rgb(20 40 90 / 0.04), 0 30px 70px -18px rgb(40 70 140 / 0.24)",
          color: "#0f1419",
        }}
      >
        <div style={{ position: "absolute", right: 38, top: 34 }}>
          <XLogo size={38} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Avatar who={tweet} size={70} />
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 30, fontWeight: 700 }}>
              {tweet.name}
              {tweet.verified ? <Verified size={30} /> : null}
            </div>
            <div style={{ fontSize: 27, color: "#536471" }}>
              @{tweet.handle}
              <span style={{ marginLeft: 14 }}>{tweet.ago}</span>
            </div>
          </div>
        </div>
        <div style={{ ...HEADLINE, color: "#0f1419", fontSize: 72, letterSpacing: "-0.035em", margin: "24px 0 24px", minHeight: 74 }}>
          {typed === undefined ? tweet.text : tweet.text.slice(0, Math.round(tweet.text.length * typed))}
          {typed !== undefined && typed < 1 ? <span style={{ color: "#1d9bf0", opacity: Math.floor(frame / 6) % 2 ? 1 : 0.2 }}>|</span> : null}
        </div>
        {attachment}
        {tweet.likes && live > 0 ? (
          <div style={{ height: 44 * live, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", alignItems: "center", fontSize: 30, fontVariantNumeric: "tabular-nums", paddingRight: 40, marginTop: attachment ? 24 * live : 0 }}>
            {stat(0, <MessageCircle size={34} strokeWidth={1.8} />, replies)}
            {stat(1, <Repeat2 size={34} strokeWidth={1.8} />, tweet.likes / 4)}
            {stat(2, <Like t={liked} />, tweet.likes, liked >= 0 ? "#f91880" : MUTED)}
            {stat(3, <BarChart2 size={34} strokeWidth={1.8} />, tweet.likes * 37)}
          </div>
        ) : null}
        {reply ? (
          <div style={{ position: "absolute", right: -26, bottom: -30, padding: "14px 24px", borderRadius: 24, background: "#0f1419", color: "white", fontSize: 30, fontWeight: 600, boxShadow: "0 12px 30px rgb(16 22 35 / 0.25)" }}>
            {reply}
          </div>
        ) : null}
      </div>
    </div>
  );
}

type Shot = "spin" | "idle" | "hop" | "fly";
export const SHOT_FRAMES: Record<Shot, number> = { spin: 30, idle: 60, hop: 36, fly: 28 };

/**
 * Auni's 3D mascot (3d/mascot.py, rendered on the GPU), one frame of a rendered shot. The hop
 * is framed wider so the jump fits; it's scaled up here to match the other shots.
 */
export function Mascot3D({ shot, frame, size, style }: { readonly shot: Shot; readonly frame: number; readonly size: number; readonly style?: CSSProperties }) {
  const frames = SHOT_FRAMES[shot];
  // Motion blur asks for sub-frames (12.375...); the renders exist only for whole frames.
  const whole = Math.floor(frame);
  const n = shot === "idle" ? (((whole % frames) + frames) % frames) + 1 : Math.min(frames, Math.max(1, whole + 1));
  const zoom = shot === "hop" ? 8.8 / 6.2 : 1;
  return (
    <div style={{ width: size, height: size, position: "relative", ...style }}>
      <Img src={staticFile(`mascot3d/${shot}_${String(n).padStart(4, "0")}.png`)} style={{ position: "absolute", width: size * zoom, height: size * zoom, left: (size - size * zoom) / 2, top: (size - size * zoom) / 2 - (shot === "hop" ? size * 0.12 : 0) }} />
    </div>
  );
}

/** The landing's question box, with words arriving in it. */
export function Composer({ text, typed, pressed }: { readonly text: string; readonly typed: number; readonly pressed: number }) {
  const shown = text.slice(0, Math.round(text.length * typed));
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        width: 1240,
        minHeight: 128,
        borderRadius: 64,
        padding: "16px 18px 16px 52px",
        background: "#fff",
        boxShadow: "inset 0 0 0 2px rgb(20 40 90 / 0.08), 0 2px 4px rgb(20 40 90 / 0.05), 0 30px 80px -20px rgb(40 70 140 / 0.3)",
      }}
    >
      <div style={{ ...HEADLINE, flex: 1, fontSize: 56, fontWeight: 600, color: shown ? INK : "#9aa3b2" }}>{shown || "What do you believe?"}</div>
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: 999,
          background: typed > 0.99 ? INK : "#e9ecf2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${1 - 0.1 * pressed})`,
        }}
      >
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </div>
    </div>
  );
}

/** A spinner that closes into a tick at `done` (0 to 1). */
export function Status({ size, done, colour = GREEN }: { readonly size: number; readonly done: number; readonly colour?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" stroke={done > 0 ? colour : "#c9d0dc"} strokeWidth={2} pathLength={1} strokeDasharray={`${0.25 + 0.75 * done} 1`} opacity={done > 0 ? 0.25 + 0.75 * done : 1} />
      <path d="M7 12.5l3.2 3.2L17 9" stroke={colour} strokeWidth={2.6} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - done} />
    </svg>
  );
}

/**
 * One of Auni's working steps: the label morphs from present to past tense, a band of light
 * sweeps it while it runs, and when it lands it shows what it found.
 */
export function Step({
  frame,
  start,
  doneAt,
  doing,
  did,
  found,
  logos,
}: {
  readonly frame: number;
  readonly start: number;
  readonly doneAt: number;
  readonly doing: string;
  readonly did: string;
  readonly found?: string;
  readonly logos?: readonly string[];
}) {
  if (frame < start) return null;
  const enter = land(frame, start, 7);
  const done = ramp(frame, doneAt, 6);
  const sweep = ((frame - start) % 24) / 24;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 26, height: 92, opacity: enter, transform: `translateY(${(1 - enter) * 24}px)`, filter: `blur(${(1 - enter) * 8}px)` }}>
      <Status size={50} done={done} />
      <div style={{ position: "relative", fontSize: 44, fontWeight: 500, letterSpacing: "-0.02em", height: 56, minWidth: 560 }}>
        {/* The tense changes as one movement: the old words lift and blur out, the new ones rise in. */}
        <span style={{ position: "absolute", whiteSpace: "nowrap", opacity: 1 - done, transform: `translateY(${-14 * done}px)`, filter: `blur(${4 * done}px)`, color: "transparent", backgroundImage: `linear-gradient(90deg, #8b94a6 ${sweep * 140 - 40}%, #d6dbe5 ${sweep * 140 - 20}%, #8b94a6 ${sweep * 140}%)`, backgroundClip: "text", WebkitBackgroundClip: "text" }}>
          {doing}
        </span>
        <span style={{ position: "absolute", whiteSpace: "nowrap", opacity: done, transform: `translateY(${14 * (1 - done)}px)`, filter: `blur(${4 * (1 - done)}px)`, color: INK }}>{did}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, opacity: done, transform: `translateX(${(1 - done) * -20}px)` }}>
        {logos ? <Marks names={logos} size={48} /> : null}
        {found ? <span style={{ fontSize: 40, fontWeight: 600, color: MUTED, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{found}</span> : null}
      </div>
    </div>
  );
}
