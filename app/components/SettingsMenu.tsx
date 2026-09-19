"use client";

import { useState } from "react";
import { Profile } from "@/lib/types";

export default function SettingsMenu({
  profile,
  onChange,
  onNewLesson,
  onForgetMe,
}: {
  profile: Profile;
  onChange: (profile: Profile) => void;
  onNewLesson: () => void;
  onForgetMe: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed top-5 right-5 z-40">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-9 h-9 border border-paperLine bg-panel flex items-center justify-center text-inkFaint hover:text-ink"
        aria-label="Settings"
      >
        ⚙
      </button>
      {open && (
        <div className="mt-2 w-64 border border-paperLine bg-panel shadow-lg p-4 space-y-4">
          <div>
            <label className="block font-mono text-xs text-inkFaint mb-1">mentor style</label>
            <div className="flex gap-2">
              {(["easy", "serious"] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => onChange({ ...profile, mentorStyle: style })}
                  className={`flex-1 border px-2 py-1.5 text-sm ${
                    profile.mentorStyle === style
                      ? "border-stamp bg-stamp text-paper"
                      : "border-paperLine text-inkFaint"
                  }`}
                >
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
