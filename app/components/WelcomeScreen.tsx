"use client";

import { useState } from "react";

export default function WelcomeScreen({ onSignIn }: { onSignIn: (name: string) => void }) {
  const [name, setName] = useState("");

  function submit() {
    if (name.trim()) onSignIn(name.trim());
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-14 lg:py-20">
      <div className="flex justify-center mb-10 lg:mb-14">
        <button onClick={() => setName("")} aria-label="Go to home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="ScenarioLab" className="h-20 lg:h-28 w-auto" />
        </button>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-14">
        {/* pitch */}
        <div className="flex-1 space-y-6 w-full">
          <h1 className="font-display text-4xl lg:text-[44px] font-bold leading-tight text-ink">
            Every lecture is
            <br />
            secretly a job.
          </h1>
          <p className="text-inkFaint text-lg leading-relaxed max-w-md">
            Paste your syllabus. Get dropped into a role, a deadline, and a
            senior who actually pushes back on your design — before the real
            internship does.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 max-w-md pt-2">
            <input
              className="flex-1 min-w-0 border border-paperLine bg-panel px-3 py-3 text-[15px] outline-none focus:border-stamp"
              placeholder="what should we call you?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
            <button
              onClick={submit}
              disabled={!name.trim()}
              className="bg-stamp text-paper font-semibold px-6 py-3 text-sm disabled:opacity-30 whitespace-nowrap"
            >
              Sign in →
            </button>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 pt-4 font-mono text-xs text-inkFaint">
            <span>✓ AI-generated scenarios</span>
            <span>✓ Real feedback loop</span>
            <span>✓ No code required</span>
          </div>
        </div>

        {/* product preview */}
        <div className="flex-1 w-full">
          <div className="border border-paperLine bg-panel shadow-lg">
            <div className="win-titlebar">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
              <span className="font-mono text-[11px] text-inkFaint ml-1">
                scenariolab — ~/demo/session
              </span>
            </div>

            <div className="flex gap-4 p-5">
              {/* mini explorer */}
              <div className="w-40 shrink-0 border border-paperLine bg-paper">
                <div className="win-titlebar">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                  <span className="font-mono text-[10px] text-inkFaint ml-1">explorer</span>
                </div>
                <div className="grid grid-cols-2 gap-1 p-2">
                  <div className="flex flex-col items-center text-center gap-0.5 px-1 py-2 border border-stamp bg-stamp/10">
                    <span className="text-2xl leading-none">📁</span>
                    <span className="text-[9px] leading-tight">Normalization</span>
                  </div>
                  <div className="flex flex-col items-center text-center gap-0.5 px-1 py-2">
                    <span className="text-2xl leading-none">📁</span>
                    <span className="text-[9px] leading-tight">Indexing</span>
                  </div>
                  <div className="flex flex-col items-center text-center gap-0.5 px-1 py-2">
                    <span className="text-2xl leading-none">📁</span>
                    <span className="text-[9px] leading-tight">Concurrency</span>
                  </div>
                </div>
                <div className="border-t border-paperLine px-2 py-1 font-mono text-[9px] text-inkFaint">
                  3 items · 1 done
                </div>
              </div>

              {/* mini scenario card */}
              <div className="flex-1 min-w-0 border border-paperLine bg-paper p-4 space-y-2">
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-stamp">Database Engineering Intern</span>
                  <span className="text-inkFaint">round 2/3</span>
                </div>
                <div className="text-[15px] font-semibold text-ink">Fixing Latency Spikes</div>
                <div className="text-[11px] text-inkFaint leading-relaxed">
                  Hey — our search index is degenerating into a linked list
                  under load. Design a fix using AVL rotations, no code needed.
                </div>
                <div className="flex gap-2 pt-2">
                  <span className="border border-paperLine px-2.5 py-1 text-[10px] text-inkFaint">
                    Simplify question
                  </span>
                  <span className="border border-paperLine px-2.5 py-1 text-[10px] text-inkFaint">
                    Get a hint
                  </span>
                  <span className="bg-stamp text-paper px-2.5 py-1 text-[10px]">Submit</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
