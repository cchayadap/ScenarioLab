"use client";

import { useState } from "react";
import { MentorStyle } from "@/lib/types";
import { MENTOR_INFO } from "@/lib/mentor";

export default function OnboardingScreen({
  name,
  onComplete,
}: {
  name: string;
  onComplete: (mentorStyle: MentorStyle, aspiringCompany: string) => void;
}) {
  const [mentorStyle, setMentorStyle] = useState<MentorStyle>("easy");
  const [aspiringCompany, setAspiringCompany] = useState("");

  return (
    <section className="space-y-8">
      <p className="text-[15px] text-inkFaint">
        Good to have you, {name}. Two quick things before your first assignment.
      </p>

      <div className="space-y-2">
        <label className="block font-mono text-xs text-inkFaint">choose your mentor</label>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          {(Object.keys(MENTOR_INFO) as MentorStyle[]).map((style) => {
            const m = MENTOR_INFO[style];
            const selected = mentorStyle === style;
            return (
              <button
                key={style}
                onClick={() => setMentorStyle(style)}
                className={`border px-4 py-4 text-left space-y-1 ${
                  selected ? "border-stamp bg-panel" : "border-paperLine"
                }`}
              >
                <div className="text-2xl">{m.emoji}</div>
                <p className="text-[14px] font-medium">{m.name}</p>
                <p className="font-mono text-[11px] text-inkFaint">{m.blurb}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2 max-w-sm">
        <label className="block font-mono text-xs text-inkFaint">
          what kind of company are you aiming for?
        </label>
        <input
          className="w-full bg-transparent border-b border-paperLine focus:border-stamp outline-none px-1 py-2 text-[15px]"
          placeholder="e.g. big tech, a startup, a research lab"
          value={aspiringCompany}
          onChange={(e) => setAspiringCompany(e.target.value)}
        />
      </div>

      <button
        onClick={() => onComplete(mentorStyle, aspiringCompany)}
        className="bg-stamp text-paper font-medium px-5 py-2.5 text-sm"
      >
        assign my first lesson
      </button>
    </section>
  );
}
