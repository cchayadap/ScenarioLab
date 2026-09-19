"use client";

import { useState } from "react";
import { Profile } from "@/lib/types";
import { MENTOR_INFO } from "@/lib/mentor";
import { MasteryStats } from "@/lib/mastery";
import MentorAvatar from "./MentorAvatar";

export default function SettingsMenu({
  profile,
  onChange,
  onNewLesson,
  onForgetMe,
  mastery,
  isFront,
  onFront,
}: {
  profile: Profile;
  onChange: (profile: Profile) => void;
  onNewLesson: () => void;
  onForgetMe: () => void;
  mastery: MasteryStats;
  isFront: boolean;
  onFront: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`fixed top-5 right-5 ${isFront ? "z-50" : "z-40"}`}>
      <button
        onClick={() => {
          onFront();
          setOpen((o) => !o);
        }}
        className="w-9 h-9 border border-paperLine bg-panel flex items-center justify-center text-inkFaint hover:text-ink"
        aria-label="Settings"
      >
        ⚙
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 w-72 border border-paperLine bg-panel shadow-lg p-4 space-y-4">
          {mastery.tasksCompleted > 0 && (
            <div>
              <label className="block font-mono text-xs text-inkFaint mb-1">your progress</label>
              <p className="text-sm">
                {mastery.tasksCompleted} task{mastery.tasksCompleted === 1 ? "" : "s"} done ·{" "}
                {mastery.tasksPassed} passed
              </p>
              {mastery.weakSpots.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="font-mono text-[11px] text-inkFaint">worth keeping an eye on:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {mastery.weakSpots.map((s) => (
                      <span
                        key={s.keyword}
                        className="font-mono text-[11px] border border-bad text-bad px-1.5 py-0.5"
                        title={s.sampleComment}
                      >
                        {s.keyword} ×{s.timesMissed}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <div>
            <label className="block font-mono text-xs text-inkFaint mb-1">mentor style</label>
            <div className="flex gap-2">
              {(["easy", "serious"] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => onChange({ ...profile, mentorStyle: style })}
                  className={`flex-1 border px-2 py-2 text-sm flex flex-col items-center gap-1 ${
                    profile.mentorStyle === style
                      ? "border-stamp bg-stamp text-paper"
                      : "border-paperLine text-inkFaint"
                  }`}
                >
                  <MentorAvatar
                    src={MENTOR_INFO[style].images.neutral}
                    alt={MENTOR_INFO[style].name}
                    className="w-12 h-12"
                  />
                  {style}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block font-mono text-xs text-inkFaint mb-1">
              aspiring company
            </label>
            <input
              className="w-full bg-transparent border-b border-paperLine focus:border-stamp outline-none px-1 py-1.5 text-sm"
              value={profile.aspiringCompany}
              onChange={(e) => onChange({ ...profile, aspiringCompany: e.target.value })}
            />
          </div>
          <button
            onClick={onNewLesson}
            className="w-full border border-paperLine px-3 py-1.5 text-sm text-left hover:border-stamp"
          >
            start a new lesson
          </button>
          <button
            onClick={onForgetMe}
            className="w-full border border-paperLine px-3 py-1.5 text-sm text-left text-bad hover:border-bad"
          >
            forget me (reset)
          </button>
        </div>
      )}
    </div>
  );
}
