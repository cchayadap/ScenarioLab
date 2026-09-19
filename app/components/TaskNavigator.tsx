"use client";

import { useState } from "react";
import { LessonSession, TaskState } from "@/lib/types";

export default function TaskNavigator({
  subjectLabel,
  tasks,
  activeTaskId,
  onSelectTask,
  onBack,
  pastSessions,
  currentSessionId,
  onSwitchSession,
}: {
  subjectLabel: string;
  tasks: TaskState[];
  activeTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  onBack: () => void;
  pastSessions: LessonSession[];
  currentSessionId: string;
  onSwitchSession: (session: LessonSession) => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const doneCount = tasks.filter((t) => t.status === "done").length;
  const otherSessions = pastSessions.filter((s) => s.id !== currentSessionId);

  return (
    <div className="w-full border border-paperLine bg-panel shadow-sm">
      {/* window titlebar, like the rest of the app's window-chrome, with a real minimize control */}
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
          {/* toolbar: back button + a clickable address bar, like a real explorer's path dropdown */}
          <div className="relative flex items-center gap-2 border-b border-paperLine px-2 py-2">
            <button
              onClick={onBack}
              aria-label="Back to lesson picker"
              className="w-7 h-7 shrink-0 flex items-center justify-center border border-paperLine bg-white text-inkFaint hover:text-ink hover:border-stamp"
            >
              ←
            </button>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex-1 min-w-0 flex items-center gap-1.5 border border-paperLine bg-white px-2.5 py-1.5 text-[12px] text-inkFaint hover:border-stamp"
            >
              <span className="shrink-0">📁</span>
              <span className="flex-1 min-w-0 truncate text-left">{subjectLabel}</span>
              <span className="shrink-0 text-[9px]">{dropdownOpen ? "▴" : "▾"}</span>
            </button>

            {dropdownOpen && (
              <div className="absolute left-9 right-0 top-full mt-1 z-10 border border-paperLine bg-white shadow-lg max-h-56 overflow-y-auto">
                <p className="px-3 py-1.5 font-mono text-[10px] text-inkFaint border-b border-paperLine">
                  switch lesson
                </p>
                {otherSessions.length === 0 ? (
                  <p className="px-3 py-2 text-[12px] text-inkFaint">no other sessions yet</p>
                ) : (
                  otherSessions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        onSwitchSession(s);
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-[12px] hover:bg-panel"
                    >
                      <span>📁</span>
                      <span className="truncate">{s.subjectHint || "course material"}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* icon grid: roomy, like a folder view, not a squeezed card list */}
          <div className="grid grid-cols-2 gap-1 p-3">
            {tasks.map((t) => {
              const active = t.id === activeTaskId;
              return (
                <button
                  key={t.id}
                  onClick={() => onSelectTask(t.id)}
                  className={`flex flex-col items-center text-center gap-1 rounded-sm px-2 py-3 border ${
                    active
                      ? "bg-stamp/10 border-stamp"
                      : "border-transparent hover:bg-white hover:border-paperLine"
                  }`}
                >
                  <span className="text-4xl leading-none">📁</span>
                  <span className="text-[12px] leading-snug">{t.topic}</span>
                  {t.status === "done" && (
                    <span className="font-mono text-[10px] text-good">done</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* status bar, like explorer's item-count footer */}
          <div className="border-t border-paperLine px-3 py-1.5 font-mono text-[10px] text-inkFaint">
            {tasks.length} item{tasks.length === 1 ? "" : "s"} · {doneCount} done
          </div>
        </>
      )}
    </div>
  );
}
