import type { ReactNode } from "react";
import { AbsoluteFill } from "remotion";

import { LOGOS, PEOPLE } from "../content";
import { Avatar } from "./Avatar";
import { Mark } from "./Mark";
import { Shot, SHOTS } from "./Shot";

const Tile = ({ label, children }: { readonly label: string; readonly children: ReactNode }) => (
  <div style={{ width: 200, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, fontSize: 16, color: "#333", textAlign: "center" }}>
    {children}
    {label}
  </div>
);

/**
 * The Assets composition (npm run assets -> out/assets.png): every logo drawn the way the film
 * draws it, every person's picture, and the first and last frame of every 3D shot, labelled.
 * Look at it after any asset change: it is where off-centre marks, white slivers and wrong faces show.
 */
export function AssetSheet() {
  return (
    <AbsoluteFill style={{ background: "#eef0f6", flexDirection: "row", flexWrap: "wrap", alignContent: "flex-start", gap: 22, padding: 36, fontFamily: "sans-serif" }}>
      {Object.keys(LOGOS).map((name) => (
        <Tile key={name} label={name}>
          <Mark name={name} size={110} ring />
        </Tile>
      ))}
      {PEOPLE.map((p) => (
        <Tile key={p.key} label={`${p.display} (${p.kind}${p.kind === "real" ? `, consent ${p.consent ?? "pending"}` : ""})`}>
          <Avatar who={p} size={110} />
        </Tile>
      ))}
      {Object.entries(SHOTS).flatMap(([shot, info]) =>
        [0, info.frames - 1].map((f) => (
          <Tile key={`${shot}${f}`} label={`3d ${shot} frame ${f + 1}/${info.frames} (${info.quality})`}>
            <Shot shot={shot} frame={f} size={150} style={{ background: "repeating-conic-gradient(#ddd 0 25%, #fff 0 50%) 0 0 / 20px 20px" }} />
          </Tile>
        )),
      )}
    </AbsoluteFill>
  );
}
