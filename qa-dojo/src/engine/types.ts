export type VisualId =
  | 'qa-rings'
  | 'stlc'
  | 'bva-line'
  | 'partitions'
  | 'report-anatomy'
  | 'sev-matrix';

export type SandboxId = 'mutant-lab' | 'lifecycle';

export type Check =
  | { kind: 'choice'; prompt: string; options: string[]; answer: number }
  | { kind: 'multi'; prompt: string; options: string[]; answers: number[] }
  | {
      kind: 'value';
      prompt: string;
      mode: 'text' | 'numberSet';
      accept: string[];
      placeholder?: string;
    }
  | { kind: 'order'; prompt: string; steps: string[] }
  | {
      kind: 'classify';
      prompt: string;
      buckets: string[];
      items: { label: string; bucket: string }[];
    }
  | { kind: 'sandbox'; prompt: string; sandbox: SandboxId };

/** The learner's answer, shaped per check kind. */
export type Answer =
  | { kind: 'choice'; value: number | null }
  | { kind: 'multi'; value: number[] }
  | { kind: 'value'; value: string }
  | { kind: 'order'; value: number[] }
  | { kind: 'classify'; value: (string | null)[] }
  | { kind: 'sandbox'; value: boolean; detail?: string };

export interface Task {
  id: string;
  title: string;
  brief: string[];
  check: Check;
  hints: [string, string, string];
  xp: number;
  visual?: VisualId;
  explain: string;
}

export interface Room {
  id: string;
  title: string;
  tagline: string;
  source: string;
  glyph: string;
  tasks: Task[];
}

export interface PlannedRoom {
  id: string;
  title: string;
  tagline: string;
  source: string;
}

export interface LearningPath {
  id: string;
  title: string;
  rooms: Room[];
  planned: PlannedRoom[];
}

export interface EvalResult {
  correct: boolean;
  detail?: string;
}
