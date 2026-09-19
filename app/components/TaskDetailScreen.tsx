"use client";

import { Scenario } from "@/lib/types";

export default function TaskDetailScreen({
  scenario,
  onNext,
  onBack,
}: {
  scenario: Scenario;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <section className="space-y-6">
      <div>
        <span className="font-mono text-xs text-stamp">{scenario.role}</span>
        <h2 className="font-display text-xl font-semibold mt-1">{scenario.title}</h2>
      </div>

      <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{scenario.stakes}</p>

      <div className="border-l-2 border-paperLine pl-3 py-1">
        <p className="font-mono text-xs text-inkFaint mb-1">what you need to produce</p>
        <p className="text-[15px]">{scenario.task}</p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="border border-paperLine px-4 py-2 text-sm hover:border-stamp"
        >
          ← back
        </button>
        <button
          onClick={onNext}
          className="bg-stamp text-paper font-medium px-5 py-2.5 text-sm"
        >
          start task →
        </button>
      </div>
    </section>
  );
}
