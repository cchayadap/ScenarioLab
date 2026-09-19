"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LessonSession,
  Profile,
  ReviewResult,
  Scenario,
  TaskState,
} from "@/lib/types";
import { loadProfile, saveProfile, clearProfile, loadSessions, upsertSession } from "@/lib/storage";
import { computeMastery, summarizeMasteryForPrompt } from "@/lib/mastery";
import WelcomeScreen from "./components/WelcomeScreen";
import OnboardingScreen from "./components/OnboardingScreen";
import LessonScreen from "./components/LessonScreen";
import TaskNavigator from "./components/TaskNavigator";
import SessionNavigator from "./components/SessionNavigator";
import TaskDetailScreen from "./components/TaskDetailScreen";
import WorkspaceScreen from "./components/WorkspaceScreen";
import ResultsScreen from "./components/ResultsScreen";
import MentorWidget from "./components/MentorWidget";
import SettingsMenu from "./components/SettingsMenu";
import MentorAvatar from "./components/MentorAvatar";
import { MENTOR_INFO } from "@/lib/mentor";

type Step =
  | "loading"
  | "welcome"
  | "onboarding"
  | "lesson"
  | "breaking-down"
  | "tasks"
  | "opening-task"
  | "task-detail"
  | "workspace"
  | "results";

export default function Home() {
  const [step, setStep] = useState<Step>("loading");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pendingName, setPendingName] = useState("");
  const [pastSessions, setPastSessions] = useState<LessonSession[]>([]);
  const [session, setSession] = useState<LessonSession | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeTwist, setActiveTwist] = useState<string | null>(null);
  const [latestResult, setLatestResult] = useState<ReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const p = loadProfile();
    setProfile(p);
    setPastSessions(loadSessions());
    setStep(p ? "lesson" : "welcome");
  }, []);

  const activeTask = session?.tasks.find((t) => t.id === activeTaskId) || null;
  const mastery = useMemo(() => computeMastery(pastSessions), [pastSessions]);
  const studentHistory = useMemo(() => summarizeMasteryForPrompt(mastery), [mastery]);
  const hasNavigator =
    !!session &&
    (["tasks", "opening-task", "task-detail", "workspace", "results"] as Step[]).includes(step);

  // Same explorer panel position whether you're picking a lesson or a task inside one —
  // browsing "up" a level should never move to a different part of the screen.
  const sidePanel =
    hasNavigator && session ? (
      <TaskNavigator
        subjectLabel={session.subjectHint || "course material"}
        tasks={session.tasks}
        activeTaskId={activeTaskId}
        onSelectTask={handleOpenTask}
        onBack={handleNewLesson}
        pastSessions={pastSessions}
        currentSessionId={session.id}
        onSwitchSession={handleResumeSession}
      />
    ) : step === "lesson" && pastSessions.length > 0 ? (
      <SessionNavigator pastSessions={pastSessions} onResume={handleResumeSession} />
    ) : null;

  function persistSession(next: LessonSession) {
    setSession(next);
    upsertSession(next);
    setPastSessions(loadSessions());
  }

  function updateActiveTask(patch: Partial<TaskState>) {
    if (!session || !activeTask) return;
    const nextTasks = session.tasks.map((t) => (t.id === activeTask.id ? { ...t, ...patch } : t));
    persistSession({ ...session, tasks: nextTasks });
  }

  function handleSignIn(name: string) {
    setPendingName(name);
    setStep("onboarding");
  }

  function handleOnboardingComplete(mentorStyle: Profile["mentorStyle"], aspiringCompany: string) {
    const newProfile: Profile = { name: pendingName, mentorStyle, aspiringCompany };
    saveProfile(newProfile);
    setProfile(newProfile);
    setStep("lesson");
  }

  async function handleStartLesson(lectureText: string, subjectHint: string) {
    setError(null);
    setStep("breaking-down");
    try {
      const res = await fetch("/api/breakdown-lecture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lectureText, subjectHint }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to break down lecture");

      const newSession: LessonSession = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        subjectHint,
        lectureText,
        tasks: data.tasks.map((t: { id: string; topic: string; description: string; sourceRef?: string }) => ({
          ...t,
          round: 1,
          history: [],
          hintsUsed: 0,
          hints: [],
          simplifiedNotes: [],
          status: "not-started" as const,
        })),
      };
      persistSession(newSession);
      setStep("tasks");
    } catch (err) {
      setError((err as Error).message);
      setStep("lesson");
    }
  }

  function handleResumeSession(s: LessonSession) {
    setSession(s);
    setStep("tasks");
  }

  async function handleOpenTask(taskId: string) {
    if (!session) return;
    const task = session.tasks.find((t) => t.id === taskId);
    if (!task) return;
    setActiveTaskId(taskId);
    setActiveTwist(null);
    setSubmissionText("");

    if (task.scenario) {
      setStep("task-detail");
      return;
    }

    setError(null);
    setStep("opening-task");
    try {
      const res = await fetch("/api/generate-scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          syllabusText: session.lectureText,
          subjectHint: session.subjectHint,
          focusTopic: task.topic,
          focusDescription: task.description,
          aspiringCompany: profile?.aspiringCompany,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to set up task");

      const scenario: Scenario = data.scenario;
      const nextTasks = session.tasks.map((t) =>
        t.id === taskId ? { ...t, scenario, status: "in-progress" as const } : t
      );
      persistSession({ ...session, tasks: nextTasks });
      setStep("task-detail");
    } catch (err) {
      setError((err as Error).message);
      setStep("tasks");
    }
  }

  async function handleRequestHint(): Promise<
    { ok: true; hint: string } | { ok: false; error: string }
  > {
    if (!activeTask?.scenario || !profile) {
      return { ok: false, error: "Couldn't get a hint right now" };
    }
    try {
      const res = await fetch("/api/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: activeTask.scenario,
          submissionText,
          hintsUsed: activeTask.hintsUsed,
          mentorStyle: profile.mentorStyle,
          studentHistory,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get a hint");
      updateActiveTask({
        hintsUsed: activeTask.hintsUsed + 1,
        hints: [...(activeTask.hints ?? []), data.hint as string],
      });
      return { ok: true, hint: data.hint as string };
    } catch (err) {
      return { ok: false, error: (err as Error).message || "Couldn't reach the mentor" };
    }
  }

  async function handleSimplify(): Promise<
    { ok: true; text: string } | { ok: false; error: string }
  > {
    if (!activeTask?.scenario || !profile) {
      return { ok: false, error: "Couldn't reach the mentor" };
    }
    try {
      const res = await fetch("/api/ask-mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: activeTask.scenario,
          question: "Can you explain what this task is actually asking me to do, in simpler, plainer terms?",
          mentorStyle: profile.mentorStyle,
          studentHistory,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to simplify");
      updateActiveTask({
        simplifiedNotes: [...(activeTask.simplifiedNotes ?? []), data.answer as string],
      });
      return { ok: true, text: data.answer as string };
    } catch (err) {
      return { ok: false, error: (err as Error).message || "Couldn't reach the mentor" };
    }
  }

  async function handleSubmitDesign() {
    if (!session || !activeTask?.scenario || submissionText.trim().length < 10) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: activeTask.scenario,
          submissionText,
          round: activeTask.round,
          history: activeTask.history,
          lectureText: session.lectureText,
          studentHistory,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to review submission");

      const result: ReviewResult = data.result;
      const nextTasks = session.tasks.map((t) =>
        t.id === activeTask.id
          ? {
              ...t,
              history: [...t.history, { round: t.round, submissionText, result }],
              round: result.gameOver ? t.round : t.round + 1,
              status: result.gameOver ? ("done" as const) : ("in-progress" as const),
            }
          : t
      );
      persistSession({ ...session, tasks: nextTasks });
      setLatestResult(result);
      setStep("results");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleContinueFromResults() {
    if (!latestResult) return;
    if (latestResult.gameOver) {
      setActiveTaskId(null);
      setStep("tasks");
    } else {
      setActiveTwist(latestResult.twist || null);
      setSubmissionText("");
      setStep("workspace");
    }
    setLatestResult(null);
  }

  function handleNewLesson() {
    setSession(null);
    setActiveTaskId(null);
    setError(null);
    setStep("lesson");
  }

  function handleForgetMe() {
    clearProfile();
    setProfile(null);
    setSession(null);
    setActiveTaskId(null);
    setStep("welcome");
  }

  function goHome() {
    setError(null);
    setStep(profile ? "lesson" : "welcome");
  }

  // Settings and the mentor chat are both fixed-position overlays that can visually collide
  // in a corner — whichever the student opened most recently should render above the other.
  const [frontOverlay, setFrontOverlay] = useState<"settings" | "mentor">("mentor");

  if (step === "welcome") {
    return <WelcomeScreen onSignIn={handleSignIn} />;
  }

  return (
    <main className="relative max-w-2xl mx-auto px-5 py-14">
      {profile && (
        <SettingsMenu
          profile={profile}
          onChange={(p) => {
            saveProfile(p);
            setProfile(p);
          }}
          onNewLesson={handleNewLesson}
          onForgetMe={handleForgetMe}
          mastery={mastery}
          isFront={frontOverlay === "settings"}
          onFront={() => setFrontOverlay("settings")}
        />
      )}

      {sidePanel && (
        <>
          {/* narrow viewports: stacked above the window, in normal flow */}
          <div className="xl:hidden mb-6">{sidePanel}</div>
          {/* wide viewports: floats in the left margin so the window never moves or resizes */}
          <div className="hidden xl:block absolute top-14 right-full mr-6 w-72">{sidePanel}</div>
        </>
      )}

      <div className="border border-paperLine bg-panel shadow-sm">
        <div className="win-titlebar">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
          <span className="font-mono text-[11px] text-inkFaint ml-1">
            scenariolab — ~/{profile ? profile.name.toLowerCase() : "guest"}/session
          </span>
        </div>

        <div className="px-6 py-8">
          <header className="mb-8 border-b border-paperLine pb-5">
            <button onClick={goHome} aria-label="Go to home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="ScenarioLab" className="h-20 w-auto" />
            </button>
          </header>

          {error && (
            <div className="mb-6 border-l-2 border-bad pl-3 py-1 text-sm text-bad">{error}</div>
          )}

          {step === "loading" && <p className="font-mono text-sm text-inkFaint">loading...</p>}

      {step === "onboarding" && (
        <OnboardingScreen name={pendingName} onComplete={handleOnboardingComplete} />
      )}

      {step === "lesson" && (
        <LessonScreen onStartNew={handleStartLesson} error={error} />
      )}

      {step === "breaking-down" && (
        <p className="font-mono text-sm text-inkFaint">breaking your lecture into tasks...</p>
      )}

      {step === "tasks" && session && profile && (
        <div className="flex items-start gap-3 border-l-2 border-stamp pl-3 py-1">
          <MentorAvatar
            src={MENTOR_INFO[profile.mentorStyle].images.neutral}
            alt={MENTOR_INFO[profile.mentorStyle].name}
            className="w-14 h-14"
          />
          <p className="text-[15px]">
            <span className="font-medium">{MENTOR_INFO[profile.mentorStyle].name}:</span> here&apos;s
            the material broken into jobs — pick a folder on the left and I&apos;ll get you set up.
          </p>
        </div>
      )}

      {step === "opening-task" && (
        <p className="font-mono text-sm text-inkFaint">setting up your first day...</p>
      )}

      {step === "task-detail" && activeTask?.scenario && (
        <TaskDetailScreen
          scenario={activeTask.scenario}
          onNext={() => setStep("workspace")}
          onBack={() => setStep("tasks")}
        />
      )}

      {step === "workspace" && activeTask?.scenario && (
        <WorkspaceScreen
          scenario={activeTask.scenario}
          round={activeTask.round}
          history={activeTask.history}
          hints={activeTask.hints ?? []}
          simplifiedNotes={activeTask.simplifiedNotes ?? []}
          submissionText={submissionText}
          onSubmissionChange={setSubmissionText}
          onSubmit={handleSubmitDesign}
          onRequestHint={handleRequestHint}
          onSimplify={handleSimplify}
          submitting={submitting}
          activeTwist={activeTwist}
        />
      )}

      {step === "results" && activeTask?.scenario && latestResult && (
        <ResultsScreen
          scenario={activeTask.scenario}
          submissionText={submissionText}
          result={latestResult}
          gameOver={latestResult.gameOver}
          onContinue={handleContinueFromResults}
        />
      )}

        </div>
      </div>

      {profile && step !== "loading" && step !== "onboarding" && (
        <MentorWidget
          scenario={activeTask?.scenario}
          mentorStyle={profile.mentorStyle}
          studentHistory={studentHistory}
          isFront={frontOverlay === "mentor"}
          onFront={() => setFrontOverlay("mentor")}
        />
      )}
    </main>
  );
}
