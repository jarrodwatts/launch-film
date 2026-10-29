import "./brand.css";

import { loadFont } from "@remotion/google-fonts/Inter";
import { AbsoluteFill, Audio, Composition, Freeze, Sequence, staticFile, useCurrentFrame } from "remotion";

import { LogoSheet } from "./LogoSheet";
import { bf, DURATION, FPS, T } from "./motion";
import { Build, Question } from "./scenes/build";
import { Close } from "./scenes/close";
import { Flip } from "./scenes/flip";
import { Offerings } from "./scenes/offerings";
import { Reveal } from "./scenes/reveal";
import { Social } from "./scenes/social";

// The app is set in SF Pro; Inter is the open face it ships for images.
const { fontFamily } = loadFont("normal", { weights: ["400", "500", "600", "700", "800"], subsets: ["latin"] });

/** The launch film's scenes in order, each from its own start to its end (src/beats/). */
const SCENES = [
  ["build", Build],
  ["question", Question],
  ["reveal", Reveal],
  ["flip", Flip],
  ["offerings", Offerings],
  ["social", Social],
  ["close", Close],
] as const;

/**
 * The launch film: build, question, drop, the take flipping into a position, offerings, social, close.
 * `shift` moves it back a fraction of a frame: scripts/final.sh renders it at several shifts and
 * averages them into the shutter blur, in ffmpeg rather than the browser, which would round each
 * pass to 8 bits and band every gradient.
 */
function Film({ shift }: { readonly shift: number }) {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ fontFamily }}>
      <Freeze frame={Math.max(0, frame - shift)}>
        {SCENES.map(([key, Part]) => (
          <Sequence key={key} from={bf(T[key].start)} durationInFrames={bf(T[key].end) - bf(T[key].start)}>
            <Part />
          </Sequence>
        ))}
      </Freeze>
      <Audio src={staticFile("mix.wav")} />
    </AbsoluteFill>
  );
}

export function Root() {
  return (
    <>
      <Composition id="Film" component={Film} defaultProps={{ shift: 0 }} durationInFrames={DURATION} fps={FPS} width={1920} height={1080} />
      <Composition id="Logos" component={LogoSheet} durationInFrames={1} fps={FPS} width={1920} height={1080} />
    </>
  );
}
