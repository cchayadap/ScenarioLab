"use client";

import { useEffect, useRef, useState } from "react";
import { MentorStyle, Scenario } from "@/lib/types";
import { MENTOR_INFO } from "@/lib/mentor";
import MentorAvatar from "./MentorAvatar";

interface ChatTurn {
  question: string;
  answer: string;
}

type Pose = "neutral" | "talking" | "surprised";

// How long an emote lingers before settling back to neutral — long enough to actually
// register instead of flashing past while the answer text is still being read.
const TALKING_HOLD_MS = 5000;
const SURPRISED_HOLD_MS = 6000;

export default function MentorWidget({
  scenario,
  mentorStyle,
}: {
  scenario?: Scenario | null;
  mentorStyle: MentorStyle;
}) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [asking, setAsking] = useState(false);
  const [pose, setPose] = useState<Pose>("neutral");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mentor = MENTOR_INFO[mentorStyle];

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  function holdPose(next: Exclude<Pose, "neutral">, holdMs: number) {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    setPose(next);
    resetTimer.current = setTimeout(() => setPose("neutral"), holdMs);
  }

  async function handleAsk() {
    const q = question.trim();
    if (!q || asking) return;
    setAsking(true);
    setQuestion("");
    if (resetTimer.current) clearTimeout(resetTimer.current);
    setPose("talking");
    try {
      const res = await fetch("/api/ask-mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: scenario ?? null, question: q, mentorStyle }),
      });
      const data = await res.json();
      const answer = res.ok ? data.answer : "Couldn't reach the mentor — try again in a sec.";
      setTurns((t) => [...t, { question: q, answer }]);
      if (!res.ok || data.offTopic) {
        holdPose("surprised", SURPRISED_HOLD_MS);
      } else {
        holdPose("talking", TALKING_HOLD_MS);
      }
    } catch {
      setTurns((t) => [...t, { question: q, answer: "Couldn't reach the mentor — try again in a sec." }]);
      holdPose("surprised", SURPRISED_HOLD_MS);
    } finally {
      setAsking(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">
      {open && (
        <div className="w-80 max-h-96 flex flex-col border border-paperLine bg-panel shadow-lg">
          <div className="win-titlebar justify-between">
            <div className="flex items-center gap-1.5">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
            <span className="font-mono text-[11px] text-inkFaint">mentor.chat</span>
          </div>
          <div className="px-4 py-2.5 border-b border-paperLine flex items-center gap-2">
            <MentorAvatar src={mentor.images.neutral} alt={mentor.name} className="w-12 h-12" />
            <div className="leading-tight">
              <p className="text-sm font-medium">{mentor.name}</p>
              <p className="font-mono text-[11px] text-inkFaint">{mentor.blurb}</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[80px]">
            {turns.length === 0 && (
              <p className="text-[13px] text-inkFaint">
                {scenario
                  ? `Ask about the task — ${mentor.name} stays on topic.`
                  : `Ask ${mentor.name} anything about the course or how to get started.`}
              </p>
            )}
            {turns.map((t, i) => (
              <div key={i} className="space-y-1">
                <p className="text-[13px] text-inkFaint">you: {t.question}</p>
                <p className="text-[14px]">{t.answer}</p>
              </div>
            ))}
            {asking && <p className="text-[13px] text-inkFaint font-mono">thinking...</p>}
          </div>
          <div className="border-t border-paperLine p-2 flex gap-2">
            <input
              className="flex-1 bg-transparent outline-none text-[14px] px-2 py-1.5"
              placeholder="ask a question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              disabled={asking}
            />
            <button
              onClick={handleAsk}
              disabled={asking || !question.trim()}
              className="bg-stamp text-paper text-xs font-medium px-3 py-1.5 disabled:opacity-30"
            >
              ask
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="transition-transform hover:scale-105"
        aria-label="Ask your mentor"
      >
        <img
          src={mentor.bodyImages[pose]}
          alt={mentor.name}
          className="h-36 w-auto drop-shadow-lg"
        />
      </button>
    </div>
  );
}
