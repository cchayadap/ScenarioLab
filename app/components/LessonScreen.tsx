"use client";

import { useRef, useState } from "react";
import { LessonSession } from "@/lib/types";

export default function LessonScreen({
  pastSessions,
  onStartNew,
  onResume,
  error,
}: {
  pastSessions: LessonSession[];
  onStartNew: (lectureText: string, subjectHint: string) => void;
  onResume: (session: LessonSession) => void;
  error: string | null;
}) {
  const [subjectHint, setSubjectHint] = useState("");
  const [lectureText, setLectureText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setParsing(true);
    setParseError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/parse-file", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to read that file");
      setLectureText(data.text);
    } catch (err) {
      setParseError((err as Error).message);
    } finally {
      setParsing(false);
    }
  }

  return (
    <section className="space-y-8">
      <div className="space-y-5">
        <div>
          <label className="block font-mono text-xs text-inkFaint mb-1">subject (optional)</label>
          <input
            className="w-full bg-transparent border-b border-paperLine focus:border-stamp outline-none px-1 py-2 text-[15px]"
            placeholder="Database Systems"
            value={subjectHint}
            onChange={(e) => setSubjectHint(e.target.value)}
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block font-mono text-xs text-inkFaint">course material</label>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={parsing}
              className="font-mono text-xs text-stamp underline underline-offset-2 disabled:opacity-50"
            >
              {parsing ? "reading file..." : "upload slides / PDF"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.pptx,.txt,.md"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFile(e.target.files[0]);
                e.target.value = "";
              }}
            />
          </div>
          <textarea
            className="w-full h-44 bg-panel border border-paperLine focus:border-stamp outline-none px-3 py-2 text-[15px] font-mono text-[13px]"
            placeholder="Paste a chunk of your lecture slides, syllabus topics, or notes... or upload a .pdf / .pptx above"
            value={lectureText}
            onChange={(e) => setLectureText(e.target.value)}
          />
          {parseError && (
            <p className="text-xs text-bad mt-1">{parseError}</p>
          )}
        </div>

        {error && <div className="border-l-2 border-bad pl-3 py-1 text-sm text-bad">{error}</div>}

        <button
          onClick={() => onStartNew(lectureText, subjectHint)}
          disabled={lectureText.trim().length < 20}
          className="bg-stamp text-paper font-medium px-5 py-2.5 text-sm disabled:opacity-30"
        >
          break this lecture into tasks
        </button>
      </div>

      {pastSessions.length > 0 && (
        <div className="border-t border-paperLine pt-5">
          <p className="font-mono text-xs text-inkFaint mb-3">continue a former lesson</p>
          <div className="space-y-2">
            {pastSessions.map((s) => {
              const done = s.tasks.filter((t) => t.status === "done").length;
              return (
                <button
                  key={s.id}
                  onClick={() => onResume(s)}
                  className="w-full text-left border border-paperLine px-4 py-3 hover:border-stamp"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[15px]">{s.subjectHint || "course material"}</span>
                    <span className="font-mono text-xs text-inkFaint whitespace-nowrap">
                      {done}/{s.tasks.length} done
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-inkFaint mt-0.5">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
