import { Config } from "@remotion/cli/config";

// Previews and drafts capture each frame as JPEG at 92: fast, and fine for review.
// The final's shutter passes pick their own format (scripts/final.sh --image-format).
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
