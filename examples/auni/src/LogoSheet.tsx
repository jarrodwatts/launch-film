import { AbsoluteFill } from "remotion";

import { MARKETS, VENUES } from "./data";
import { Mark } from "./ui";

/** Every logo the film uses, drawn as the film draws it, labelled: for checking they all read. */
export function LogoSheet() {
  const all = [...VENUES.map((v) => v.logo), ...MARKETS, "xstocks:NVDAx", "xstocks:TSMx"];
  return (
    <AbsoluteFill style={{ background: "#eef2ff", flexDirection: "row", flexWrap: "wrap", gap: 18, padding: 30, fontFamily: "sans-serif" }}>
      {all.map((name) => (
        <div key={name} style={{ width: 170, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, fontSize: 15 }}>
          <Mark name={name} size={96} ring />
          {name}
        </div>
      ))}
    </AbsoluteFill>
  );
}
