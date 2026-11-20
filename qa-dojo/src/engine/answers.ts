import { seededShuffle } from './evaluate';
import type { Answer, Task } from './types';

export function initialAnswer(task: Task): Answer {
  const c = task.check;
  switch (c.kind) {
    case 'choice': return { kind: 'choice', value: null };
    case 'multi': return { kind: 'multi', value: [] };
    case 'value': return { kind: 'value', value: '' };
    case 'order': return { kind: 'order', value: seededShuffle(c.steps.length, task.id) };
    case 'classify': return { kind: 'classify', value: c.items.map(() => null) };
    case 'sandbox': return { kind: 'sandbox', value: false };
  }
}

export function solvedAnswer(task: Task): Answer {
  const c = task.check;
  switch (c.kind) {
    case 'choice': return { kind: 'choice', value: c.answer };
    case 'multi': return { kind: 'multi', value: [...c.answers] };
    case 'value': return { kind: 'value', value: c.accept[0] };
    case 'order': return { kind: 'order', value: c.steps.map((_, i) => i) };
    case 'classify': return { kind: 'classify', value: c.items.map((it) => it.bucket) };
    case 'sandbox': return { kind: 'sandbox', value: true };
  }
}

export function isEmpty(a: Answer): boolean {
  switch (a.kind) {
    case 'choice': return a.value === null;
    case 'multi': return a.value.length === 0;
    case 'value': return a.value.trim() === '';
    case 'classify': return a.value.some((v) => v === null);
    default: return false;
  }
}
