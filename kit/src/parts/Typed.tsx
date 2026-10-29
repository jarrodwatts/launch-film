import { mod, ramp } from "../engine/motion";

/**
 * Text typing itself out between frames `start` and `end`, one character at a time at an even
 * pace, with a caret: solid while typing, blinking (8 frames on, 8 off) after. The untyped rest
 * is laid out but hidden, so centred text never shifts as it types. Clamped at both ends, so it is
 * safe at any frame, negative and fractional ones included. `accent` colours one word.
 */
export function Typed({ text, frame, start, end, colour, accent, caret = true }: { readonly text: string; readonly frame: number; readonly start: number; readonly end: number; readonly colour: string; readonly accent?: { readonly word: string; readonly colour: string }; readonly caret?: boolean }) {
  const chars = Array.from(text);
  const shown = Math.floor(ramp(frame, start, end - start, 0, chars.length, (t) => t));
  const blinkOn = frame < end || mod(Math.floor(frame - end), 16) < 8;
  const hit = accent ? text.indexOf(accent.word) : -1;
  const tint = (i: number) => (accent && hit >= 0 && i >= hit && i < hit + accent.word.length ? accent.colour : undefined);
  // A thin bar on the text's baseline that takes no width, so nothing shifts as it moves.
  const bar = <span key="caret" style={{ display: "inline-block", width: "0.06em", height: "0.92em", marginRight: "-0.06em", verticalAlign: "-0.12em", background: colour, opacity: blinkOn ? 1 : 0 }} />;
  const parts = chars.map((c, i) => (
    <span key={i} style={{ visibility: i < shown ? "visible" : "hidden", color: tint(i) }}>{c}</span>
  ));
  if (caret && frame >= start) parts.splice(shown, 0, bar);
  return <span style={{ whiteSpace: "pre", color: colour }}>{parts}</span>;
}
