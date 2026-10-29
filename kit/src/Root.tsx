import { AbsoluteFill, Audio, Composition, Freeze, getStaticFiles, Sequence, staticFile, useCurrentFrame } from "remotion";

import { BRAND } from "./brand";
import { DURATION, span } from "./engine/motion";
import { FILM, SCENES } from "./film";
import { AssetSheet } from "./parts/AssetSheet";
import { scenes } from "./scenes";

/**
 * The film: every scene in order, each in its own Sequence from its first frame to its last.
 *
 * `shift` is the shutter. scripts/final.sh renders the film 16 times at shifts 0, 1/32 ... 15/32
 * of a frame and averages the passes in ffmpeg at 10 bits: real motion blur with no banding
 * (Remotion's CameraMotionBlur stacks see-through copies in 8 bits and bands every gradient).
 * The shutter LEADS (frame + shift): at a cut's frame every pass already shows the new shot, so
 * cuts land on the same frame as in the draft and on the beat-locked sound.
 */
function Film({ shift }: { readonly shift: number }) {
  const frame = useCurrentFrame();
  // A fresh clone has no mix yet (it is generated), and Remotion would fetch it even when muted.
  const hasMix = getStaticFiles().some((f) => f.name === "mix.wav");
  return (
    <AbsoluteFill style={{ fontFamily: BRAND.font, background: "white" }}>
      <Freeze frame={frame + shift}>
        {SCENES.map(({ key }) => {
          const { Scene } = scenes[key];
          return (
            <Sequence key={key} name={key} from={span(key).from} durationInFrames={span(key).frames}>
              <Scene />
            </Sequence>
          );
        })}
      </Freeze>
      {hasMix ? <Audio src={staticFile("mix.wav")} /> : null}
    </AbsoluteFill>
  );
}

export function Root() {
  return (
    <>
      <Composition id="Film" component={Film} defaultProps={{ shift: 0 }} durationInFrames={DURATION} fps={FILM.fps} width={FILM.width} height={FILM.height} />
      <Composition id="Assets" component={AssetSheet} durationInFrames={1} fps={FILM.fps} width={FILM.width} height={FILM.height} />
    </>
  );
}
