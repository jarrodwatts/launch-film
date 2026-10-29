import { useId } from "react";
import { AbsoluteFill } from "remotion";

import { accelerate, ramp } from "../engine/motion";
import { FILM } from "../film";

/**
 * The brand iris: the frame is one flat colour with a shape cut out of its middle (the logo or
 * mascot outline), and the shape grows until the colour is gone, revealing what's underneath.
 * It shows the shape at about 0.3 scale for `hold` frames first, so the eye reads the mark,
 * then opens on `accelerate` over `length` frames. It draws nothing before `at`: cover the frame
 * with the colour yourself (a dive into an object of that colour is the best way in).
 * `path` is an SVG path drawn in a `box` x `box` square (its viewBox). Give it the mark's OUTER
 * outline only (BRAND.markOutline): any hole or inner piece in the path stays coloured and flies
 * over the picture as bars and shards for the first frames of the opening.
 */
export function Iris({ frame, at, path, box, colour, hold = 3, length = 8 }: { readonly frame: number; readonly at: number; readonly path: string; readonly box: number; readonly colour: string; readonly hold?: number; readonly length?: number }) {
  const id = `iris${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const open = ramp(frame, at + 1 + hold, length, 0, 1, accelerate);
  if (frame < at || open >= 1) return null;
  // 0.02 -> 0.3 in one frame, a slight creep through the hold, then out to 22x the frame.
  const scale = ramp(frame, at, 1, 0.02, 0.3) + ramp(frame, at + 1, hold, 0, 0.03) + open * 22;
  const unit = FILM.height / box;
  return (
    <AbsoluteFill>
      <svg width={FILM.width} height={FILM.height} viewBox={`0 0 ${FILM.width} ${FILM.height}`}>
        <defs>
          <mask id={id}>
            <rect width={FILM.width} height={FILM.height} fill="white" />
            <path d={path} fill="black" transform={`translate(${FILM.width / 2} ${FILM.height / 2}) scale(${scale * unit}) translate(${-box / 2} ${-box / 2})`} />
          </mask>
        </defs>
        <rect width={FILM.width} height={FILM.height} fill={colour} mask={`url(#${id})`} />
      </svg>
    </AbsoluteFill>
  );
}
