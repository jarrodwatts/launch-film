import type { CSSProperties } from "react";

import { ramp } from "../engine/motion";

/**
 * How a count climbs from 0 to `total` as `t` goes 0 to 1: it multiplies (crawls, then races),
 * which sells "flooding in". reaches() is its inverse, so tick sounds can land exactly as each
 * number turns over: add(v("tick", n), s(start + reaches(total, n) * length), ...).
 */
export const climb = (total: number, t: number) => (total + 1) ** Math.min(1, Math.max(0, t)) - 1;
/** The `t` (0 to 1) at which climb(total, t) reaches `n`. */
export const reaches = (total: number, n: number) => Math.log(n + 1) / Math.log(total + 1);

/** A count the way social apps write it: "689", "1K" (never "1.0K"), "12.4K", "1.2M". */
export function short(n: number) {
  const [unit, div] = n >= 1e6 ? ["M", 1e6] : n >= 1e3 ? ["K", 1e3] : ["", 1];
  const v = Math.floor((n / div) * 10) / 10;
  return `${unit ? String(v).replace(/\.0$/, "") : Math.floor(n)}${unit}`;
}

/**
 * Rolling digits, odometer style: each digit is a wheel in a fixed-width column, and a wheel turns
 * over while the one to its right goes 9 to 0. Nothing ghosts under shutter blur (no crossfaded
 * glyphs, so no "5.7KK") and nothing shifts sideways. `places` fixes the column count (default:
 * the digits of `total`); leading zeros are blank but keep their width.
 */
export function Count({ value, total, places, style }: { readonly value: number; readonly total: number; readonly places?: number; readonly style?: CSSProperties }) {
  const n = places ?? String(Math.floor(total)).length;
  const wheel = (place: number) => {
    const size = 10 ** place;
    const pos = (Math.floor(value / size) % 10) + ramp(value % size, size - 0.1 * size, 0.1 * size);
    const lead = place > 0 && value < size - 0.1 * size;
    return (
      <span key={place} style={{ display: "inline-block", width: "1ch", height: "1.2em", overflow: "hidden", visibility: lead ? "hidden" : "visible" }}>
        <span style={{ display: "flex", flexDirection: "column", transform: `translateY(${-pos * 1.2}em)` }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, i) => (
            <span key={i} style={{ height: "1.2em", lineHeight: "1.2em", textAlign: "center" }}>{d}</span>
          ))}
        </span>
      </span>
    );
  };
  return <span style={{ display: "inline-flex", fontVariantNumeric: "tabular-nums", ...style }}>{Array.from({ length: n }, (_, i) => wheel(n - 1 - i))}</span>;
}
