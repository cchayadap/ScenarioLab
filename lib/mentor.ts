import { MentorStyle } from "./types";

// Real mascot art is being designed separately (see design doc, "Global UI & mentor system") —
// this is just enough of a stand-in identity to make the mentor feel consistent across screens.
export const MENTOR_INFO: Record<MentorStyle, { name: string; emoji: string; blurb: string }> = {
  easy: { name: "Casey", emoji: "🙂", blurb: "chill — walks you through it" },
  serious: { name: "Morgan", emoji: "🧐", blurb: "brisk — points you at what to read" },
};
