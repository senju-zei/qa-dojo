export const DAY = 86_400_000;
export const STORAGE_KEY = 'qa-dojo.progress.v1';

export interface Review {
  due: number;
  intervalDays: number;
}

export interface TaskProgress {
  solved: boolean;
  attempts: number;
  hints: number;
  clean: boolean;
  xpEarned: number;
  solvedAt?: number;
  review?: Review;
}

export interface Progress {
  v: 1;
  xp: number;
  streak: { count: number; lastDay: string | null };
  tasks: Record<string, TaskProgress>;
}

export const emptyProgress = (): Progress => ({
  v: 1,
  xp: 0,
  streak: { count: 0, lastDay: null },
  tasks: {},
});

export const emptyTask = (): TaskProgress => ({
  solved: false,
  attempts: 0,
  hints: 0,
  clean: false,
  xpEarned: 0,
});

/* ---------- levels ---------- */

export const xpForLevel = (level: number) => 50 * level * (level - 1);

export function levelInfo(xp: number) {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  return { level, into: xp - floor, span: ceil - floor, pct: (xp - floor) / (ceil - floor) };
}

/* ---------- xp ---------- */

const HINT_FACTOR = [1, 0.8, 0.6, 0.4];

export function awardFor(baseXp: number, hints: number, attemptsBefore: number): number {
  const factor = HINT_FACTOR[Math.min(hints, 3)];
  const clean = hints === 0 && attemptsBefore === 0;
  return Math.round(baseXp * factor * (clean ? 1.1 : 1));
}

/* ---------- streak (local calendar days) ---------- */

export function dayKey(now: number): string {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function bumpStreak(streak: Progress['streak'], now: number): Progress['streak'] {
  const today = dayKey(now);
  if (streak.lastDay === today) return streak;
  const yesterday = dayKey(now - DAY);
  return { count: streak.lastDay === yesterday ? streak.count + 1 : 1, lastDay: today };
}

/** Streak to display: it lapses if the last solve was before yesterday. */
export function liveStreak(streak: Progress['streak'], now: number): number {
  if (!streak.lastDay) return 0;
  return streak.lastDay === dayKey(now) || streak.lastDay === dayKey(now - DAY) ? streak.count : 0;
}

/* ---------- attempts ---------- */

export type Mode = 'learn' | 'review' | 'practice';

export function modeFor(tp: TaskProgress | undefined, now: number): Mode {
  if (!tp?.solved) return 'learn';
  return tp.review && tp.review.due <= now ? 'review' : 'practice';
}

export interface AttemptOutcome {
  progress: Progress;
  gained: number;
}

export function recordAttempt(
  p: Progress,
  taskId: string,
  baseXp: number,
  correct: boolean,
  now: number,
): AttemptOutcome {
  const prev = p.tasks[taskId] ?? emptyTask();
  const mode = modeFor(prev, now);

  if (mode === 'practice') return { progress: p, gained: 0 };

  if (mode === 'review') {
    const interval = prev.review!.intervalDays;
    const review: Review = correct
      ? { intervalDays: interval * 2, due: now + interval * 2 * DAY }
      : { intervalDays: 1, due: now + DAY };
    const gained = correct ? 10 : 0;
    return {
      gained,
      progress: {
        ...p,
        xp: p.xp + gained,
        streak: correct ? bumpStreak(p.streak, now) : p.streak,
        tasks: { ...p.tasks, [taskId]: { ...prev, review } },
      },
    };
  }

  if (!correct) {
    return { gained: 0, progress: { ...p, tasks: { ...p.tasks, [taskId]: { ...prev, attempts: prev.attempts + 1 } } } };
  }

  const gained = awardFor(baseXp, prev.hints, prev.attempts);
  const clean = prev.hints === 0 && prev.attempts === 0;
  const intervalDays = clean ? 3 : prev.hints > 0 || prev.attempts > 2 ? 1 : 2;
  const next: TaskProgress = {
    ...prev,
    attempts: prev.attempts + 1,
    solved: true,
    clean,
    xpEarned: gained,
    solvedAt: now,
    review: { intervalDays, due: now + intervalDays * DAY },
  };
  return {
    gained,
    progress: { ...p, xp: p.xp + gained, streak: bumpStreak(p.streak, now), tasks: { ...p.tasks, [taskId]: next } },
  };
}

export function recordHint(p: Progress, taskId: string): Progress {
  const prev = p.tasks[taskId] ?? emptyTask();
  if (prev.solved || prev.hints >= 3) return p;
  return { ...p, tasks: { ...p.tasks, [taskId]: { ...prev, hints: prev.hints + 1 } } };
}

export function dueTaskIds(p: Progress, now: number): string[] {
  return Object.entries(p.tasks)
    .filter(([, t]) => t.solved && t.review && t.review.due <= now)
    .sort((a, b) => a[1].review!.due - b[1].review!.due)
    .map(([id]) => id);
}

/* ---------- persistence ---------- */

export function loadProgress(storage: Pick<Storage, 'getItem'> | undefined): Progress {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as Partial<Progress>;
    if (parsed.v !== 1 || typeof parsed.xp !== 'number' || typeof parsed.tasks !== 'object' || !parsed.tasks) {
      return emptyProgress();
    }
    return { ...emptyProgress(), ...parsed } as Progress;
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(storage: Pick<Storage, 'setItem'> | undefined, p: Progress): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* storage full or blocked — progress stays in memory */
  }
}
