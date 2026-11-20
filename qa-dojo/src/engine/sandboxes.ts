/* ---------- Mutant lab: boundary value analysis against buggy implementations ---------- */

export const AGE_MIN = 18;
export const AGE_MAX = 60;
export const MAX_TESTS = 6;

export const spec = (age: number) => Number.isInteger(age) && age >= AGE_MIN && age <= AGE_MAX;

export interface Mutant {
  id: string;
  code: string;
  accepts: (age: number) => boolean;
}

export const MUTANTS: Mutant[] = [
  { id: 'm1', code: 'age > 18 && age <= 60', accepts: (a) => a > 18 && a <= 60 },
  { id: 'm2', code: 'age >= 18 && age < 60', accepts: (a) => a >= 18 && a < 60 },
  { id: 'm3', code: 'age >= 17 && age <= 60', accepts: (a) => a >= 17 && a <= 60 },
  { id: 'm4', code: 'age >= 18 && age <= 61', accepts: (a) => a >= 18 && a <= 61 },
  { id: 'm5', code: 'age >= 18', accepts: (a) => a >= 18 },
];

/** A mutant is killed when some test makes it disagree with the spec. */
export function killedBy(mutant: Mutant, tests: number[]): number | null {
  for (const t of tests) if (mutant.accepts(t) !== spec(t)) return t;
  return null;
}

export function runSuite(tests: number[]) {
  const results = MUTANTS.map((m) => ({ mutant: m, killer: killedBy(m, tests) }));
  const killed = results.filter((r) => r.killer !== null).length;
  return { results, killed, allKilled: killed === MUTANTS.length, withinBudget: tests.length <= MAX_TESTS };
}

/* ---------- Bug life cycle state machine ---------- */

export type BugState =
  | 'New'
  | 'Assigned'
  | 'Open'
  | 'Fixed'
  | 'Retest'
  | 'Reopened'
  | 'Closed'
  | 'Duplicate'
  | 'Rejected'
  | 'Deferred';

export const TRANSITIONS: Record<BugState, { to: BugState; label: string }[]> = {
  New: [
    { to: 'Assigned', label: 'Assign to a developer' },
    { to: 'Duplicate', label: 'Already reported' },
    { to: 'Rejected', label: 'Not a bug' },
    { to: 'Deferred', label: 'Fix later' },
  ],
  Assigned: [{ to: 'Open', label: 'Developer starts work' }],
  Open: [{ to: 'Fixed', label: 'Developer pushes a fix' }],
  Fixed: [{ to: 'Retest', label: 'QA retests the fix' }],
  Retest: [
    { to: 'Closed', label: 'Retest passes' },
    { to: 'Reopened', label: 'Retest fails' },
  ],
  Reopened: [{ to: 'Open', label: 'Back into work' }],
  Closed: [],
  Duplicate: [],
  Rejected: [],
  Deferred: [],
};

export const isTerminal = (s: BugState) => TRANSITIONS[s].length === 0;

export function canMove(from: BugState, to: BugState) {
  return TRANSITIONS[from].some((t) => t.to === to);
}

/** Goal: the fix fails retest once, and the bug still ends Closed. */
export function lifecycleGoal(path: BugState[]): { correct: boolean; detail?: string } {
  const end = path[path.length - 1];
  if (end !== 'Closed') return { correct: false, detail: `The bug ended as ${end}, not Closed.` };
  if (!path.includes('Reopened'))
    return { correct: false, detail: 'Closed, but the scenario says the first retest fails.' };
  return { correct: true };
}
