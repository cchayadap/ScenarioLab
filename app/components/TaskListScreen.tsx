"use client";

import { MentorStyle, TaskState } from "@/lib/types";
import { MENTOR_INFO } from "@/lib/mentor";

const STATUS_LABEL: Record<TaskState["status"], string> = {
  "not-started": "unopened",
  "in-progress": "in progress",
  done: "done",
};

export default function TaskListScreen({
  tasks,
  mentorStyle,
  onOpenTask,
  onBackToLesson,
}: {
  tasks: TaskState[];
  mentorStyle: MentorStyle;
  onOpenTask: (taskId: string) => void;
  onBackToLesson: () => void;
}) {
  const mentor = MENTOR_INFO[mentorStyle];

  return (
    <section className="space-y-6">
      <div className="flex items-start gap-3 border-l-2 border-stamp pl-3 py-1">
        <span className="text-xl leading-none">{mentor.emoji}</span>
        <p className="text-[15px]">
          <span className="font-medium">{mentor.name}:</span> here&apos;s the material broken into
          jobs — pick a folder and I&apos;ll get you set up.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {tasks.map((t) => (
          <button
            key={t.id}
            onClick={() => onOpenTask(t.id)}
            className="border border-paperLine bg-white/60 hover:border-stamp px-4 py-5 text-left space-y-2"
          >
            <div className="text-3xl">📁</div>
            <p className="text-[14px] font-medium leading-snug">{t.topic}</p>
            <p className="font-mono text-[11px] text-inkFaint">{STATUS_LABEL[t.status]}</p>
          </button>
        ))}
      </div>

      <button
        onClick={onBackToLesson}
        className="font-mono text-xs text-inkFaint underline underline-offset-2"
      >
        ← back to lesson picker
      </button>
    </section>
  );
}
