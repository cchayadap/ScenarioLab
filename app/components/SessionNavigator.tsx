"use client";

import { useState } from "react";
import { LessonSession } from "@/lib/types";

// Same explorer look as TaskNavigator, one level up: browsing past lessons instead of
// the tasks inside one. Keeping the folder-browsing panel in this same screen position
// for both makes "open a folder" read the same everywhere, like a real file explorer.
export default function SessionNavigator({
  pastSessions,
  onResume,
}: {
  pastSessions: LessonSession[];
  onResume: (session: LessonSession) => void;
}) {
  const [minimized, setMinimized] = useState(false);

  return (
    <div className="w-full border border-paperLine bg-panel shadow-sm">
      <div className="win-titlebar justify-between">
        <div className="flex items-center gap-1.5">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
          <span className="font-mono text-[11px] text-inkFaint ml-1">explorer</span>
        </div>
        <button
          onClick={() => setMinimized((m) => !m)}
          aria-label={minimized ? "Restore panel" : "Minimize panel"}
          className="w-5 h-5 shrink-0 flex items-center justify-center leading-none border border-paperLine bg-white text-inkFaint hover:text-ink hover:border-stamp"
        >
          {minimized ? "+" : "−"}
        </button>
      </div>

      {!minimized && (
        <>
          <div className="flex items-center gap-1.5 border-b border-paperLine px-2.5 py-2 text-[12px] text-inkFaint">
            <span>📁</span>
            <span>your lessons</span>
          </div>

          <div className="grid grid-cols-2 gap-1 p-3">
            {pastSessions.map((s) => {
              const done = s.tasks.filter((t) => t.status === "done").length;
              return (
                <button
                  key={s.id}
                  onClick={() => onResume(s)}
                  className="flex flex-col items-center text-center gap-1 rounded-sm px-2 py-3 border border-transparent hover:bg-white hover:border-paperLine"
                >
                  <span className="text-4xl leading-none">📁</span>
                  <span className="text-[12px] leading-snug">
                    {s.subjectHint || "course material"}
                  </span>
                  <span className="font-mono text-[10px] text-inkFaint">
                    {done}/{s.tasks.length} done
                  </span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-paperLine px-3 py-1.5 font-mono text-[10px] text-inkFaint">
            {pastSessions.length} lesson{pastSessions.length === 1 ? "" : "s"}
          </div>
        </>
      )}
    </div>
  );
}
