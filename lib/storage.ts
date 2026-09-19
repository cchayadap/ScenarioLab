// Demo-scope persistence: real accounts/DB are out of scope for the hackathon build
// (see the "Demo scope" section of the design doc) — profile + lesson history just
// live in localStorage, keyed per browser.

import { LessonSession, Profile, TaskState } from "./types";

const PROFILE_KEY = "scenariolab.profile";
const SESSIONS_KEY = "scenariolab.sessions";

export function loadProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Profile;
  } catch {
    return null;
  }
}

export function saveProfile(profile: Profile) {
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function clearProfile() {
  window.localStorage.removeItem(PROFILE_KEY);
}

export function loadSessions(): LessonSession[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(SESSIONS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as LessonSession[];
  } catch {
    return [];
  }
}

function saveSessions(sessions: LessonSession[]) {
  window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function upsertSession(session: LessonSession) {
  const sessions = loadSessions();
  const idx = sessions.findIndex((s) => s.id === session.id);
  if (idx >= 0) sessions[idx] = session;
  else sessions.unshift(session);
  saveSessions(sessions);
}

export function updateTaskInSession(sessionId: string, task: TaskState) {
  const sessions = loadSessions();
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) return;
  const idx = session.tasks.findIndex((t) => t.id === task.id);
  if (idx >= 0) session.tasks[idx] = task;
  saveSessions(sessions);
}
