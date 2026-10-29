import { Img, staticFile } from "remotion";

import type { Person } from "../content";

const TINTS = ["#5b4bdb", "#e2683c", "#1f8a70", "#c2417a", "#2f6fd6", "#8a6d1f"];

/** A profile picture: the person's face if they have one, else their initial on a deep colour. */
export function Avatar({ who, size }: { readonly who: Person; readonly size: number }) {
  if (who.face) return <Img src={staticFile(who.face)} style={{ width: size, height: size, borderRadius: 999, flex: "none", objectFit: "cover", background: "#e8e6f2" }} />;
  const tint = TINTS[[...who.key].reduce((sum, c) => sum + c.charCodeAt(0), 0) % TINTS.length];
  return (
    <div style={{ width: size, height: size, borderRadius: 999, flex: "none", background: tint, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.44, fontWeight: 700 }}>
      {who.display.slice(0, 1).toUpperCase()}
    </div>
  );
}
