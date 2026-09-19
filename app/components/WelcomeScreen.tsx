"use client";

import { useState } from "react";

export default function WelcomeScreen({ onSignIn }: { onSignIn: (name: string) => void }) {
  const [name, setName] = useState("");

  return (
    <section className="space-y-6">
      <p className="text-[15px] text-inkFaint max-w-md">
        Hand over your course material. You&apos;ll be assigned an intern role and real problems
        to plan — no code, just designs your senior will actually push back on.
      </p>
      <div className="space-y-2 max-w-xs">
        <label className="block font-mono text-xs text-inkFaint">what should we call you?</label>
        <input
          className="w-full bg-transparent border-b border-paperLine focus:border-stamp outline-none px-1 py-2 text-[15px]"
          placeholder="your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && name.trim() && onSignIn(name.trim())}
        />
        <button
          onClick={() => name.trim() && onSignIn(name.trim())}
          disabled={!name.trim()}
          className="bg-stamp text-paper font-medium px-5 py-2.5 text-sm disabled:opacity-30"
        >
          sign in
        </button>
      </div>
    </section>
  );
}
