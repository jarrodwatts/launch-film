import type { CSSProperties } from "react";
import { Img, staticFile } from "remotion";

import { LOGOS } from "../content";

/**
 * Any logo by its key ("partner:a") in a white disc, fitted the way LOGOS says: cover, inset or
 * scale. Check every logo on the Assets sheet (npm run assets) after any change, then in context
 * at full size: slivers of a border at the rim, and marks too small to read, are the usual faults.
 */
export function Mark({ name, size, ring = false, style }: { readonly name: string; readonly size: number; readonly ring?: boolean; readonly style?: CSSProperties }) {
  const logo = LOGOS[name];
  if (!logo) throw new Error(`No logo "${name}" in src/content.ts LOGOS.`);
  const fit = logo.fit ?? "cover";
  const inset = typeof fit === "object" && "inset" in fit ? fit.inset : 0;
  const scale = typeof fit === "object" && "scale" in fit ? fit.scale : 1;
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
      <Img src={staticFile(logo.file)} style={{ width: size * (1 - 2 * inset), height: size * (1 - 2 * inset), objectFit: inset ? "contain" : "cover", transform: `scale(${scale})` }} />
    </div>
  );
}

/** Logos overlapping in a row, each ringed in white, like a "works with" stack. */
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
