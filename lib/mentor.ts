import { MentorStyle } from "./types";

export interface MentorPoses {
  neutral: string;
  talking: string;
  surprised: string;
}

export const MENTOR_INFO: Record<
  MentorStyle,
  { name: string; emoji: string; blurb: string; images: MentorPoses; bodyImages: MentorPoses }
> = {
  easy: {
    name: "Casey",
    emoji: "🙂",
    blurb: "kind — walks you through it",
    images: {
      neutral: "/mentors/casey-neutral.png",
      talking: "/mentors/casey-talking.png",
      surprised: "/mentors/casey-surprised.png",
    },
    // trimmed to the character's own bounding box (no transparent padding) so the
    // half-body chat-widget icon can render the cutout directly, at its natural shape
    bodyImages: {
      neutral: "/mentors/body/casey-neutral.png",
      talking: "/mentors/body/casey-talking.png",
      surprised: "/mentors/body/casey-surprised.png",
    },
  },
  serious: {
    name: "Morgan",
    emoji: "🧐",
    blurb: "busy — points you at what to read",
    images: {
      neutral: "/mentors/morgan-neutral.png",
      talking: "/mentors/morgan-talking.png",
      surprised: "/mentors/morgan-surprised.png",
    },
    bodyImages: {
      neutral: "/mentors/body/morgan-neutral.png",
      talking: "/mentors/body/morgan-talking.png",
      surprised: "/mentors/body/morgan-surprised.png",
    },
  },
};
