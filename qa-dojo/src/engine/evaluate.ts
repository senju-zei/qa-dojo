import type { Answer, Check, EvalResult } from './types';

export function normalizeText(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[‘’`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ');
}

export function parseNumberSet(s: string): number[] | null {
  const parts = s
    .split(/[\s,;]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;
  const nums = parts.map(Number);
  if (nums.some((n) => !Number.isFinite(n))) return null;
  return [...new Set(nums)].sort((a, b) => a - b);
}

const sameSet = (a: number[], b: number[]) =>
  a.length === b.length && [...a].sort((x, y) => x - y).every((v, i) => v === [...b].sort((x, y) => x - y)[i]);

export function evaluate(check: Check, answer: Answer): EvalResult {
  if (check.kind !== answer.kind) return { correct: false, detail: 'Answer type mismatch.' };

  switch (check.kind) {
    case 'choice': {
      const v = (answer as Extract<Answer, { kind: 'choice' }>).value;
      if (v === null) return { correct: false, detail: 'Pick an option first.' };
      return { correct: v === check.answer };
    }
    case 'multi': {
      const v = (answer as Extract<Answer, { kind: 'multi' }>).value;
      if (v.length === 0) return { correct: false, detail: 'Select at least one option.' };
      const right = v.filter((i) => check.answers.includes(i)).length;
      const wrong = v.length - right;
      const correct = wrong === 0 && right === check.answers.length;
      return {
        correct,
        detail: correct ? undefined : `${right} of ${check.answers.length} correct picks, ${wrong} wrong.`,
      };
    }
    case 'value': {
      const raw = (answer as Extract<Answer, { kind: 'value' }>).value;
      if (!raw.trim()) return { correct: false, detail: 'Type an answer first.' };
      if (check.mode === 'numberSet') {
        const got = parseNumberSet(raw);
        if (!got) return { correct: false, detail: 'Use numbers separated by commas.' };
        const ok = check.accept.some((a) => {
          const want = parseNumberSet(a);
          return want !== null && sameSet(want, got);
        });
        return {
          correct: ok,
          detail: ok ? undefined : `You gave ${got.length} value${got.length === 1 ? '' : 's'}.`,
        };
      }
      const n = normalizeText(raw);
      return { correct: check.accept.some((a) => normalizeText(a) === n) };
    }
    case 'order': {
      const v = (answer as Extract<Answer, { kind: 'order' }>).value;
      let lead = 0;
      while (lead < v.length && v[lead] === lead) lead++;
      const correct = lead === check.steps.length && v.length === check.steps.length;
      return {
        correct,
        detail: correct ? undefined : `First ${lead} step${lead === 1 ? ' is' : 's are'} in place.`,
      };
    }
    case 'classify': {
      const v = (answer as Extract<Answer, { kind: 'classify' }>).value;
      if (v.some((b) => b === null)) return { correct: false, detail: 'Sort every card first.' };
      const right = check.items.filter((it, i) => v[i] === it.bucket).length;
      const correct = right === check.items.length;
      return { correct, detail: correct ? undefined : `${right} of ${check.items.length} placed correctly.` };
    }
    case 'sandbox': {
      const a = answer as Extract<Answer, { kind: 'sandbox' }>;
      return { correct: a.value, detail: a.detail };
    }
  }
}

/** Deterministic shuffle so order tasks never start solved and stay stable across renders. */
export function seededShuffle(n: number, seed: string): number[] {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const rand = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let attempt = 0; attempt < 10; attempt++) {
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    if (n < 2 || arr.some((v, i) => v !== i)) break;
  }
  if (n >= 2 && arr.every((v, i) => v === i)) [arr[0], arr[1]] = [arr[1], arr[0]];
  return arr;
}
