import { describe, expect, it } from 'vitest';
import { evaluate, parseNumberSet, seededShuffle } from './evaluate';
import {
  DAY,
  awardFor,
  bumpStreak,
  dueTaskIds,
  emptyProgress,
  levelInfo,
  liveStreak,
  loadProgress,
  recordAttempt,
  recordHint,
  xpForLevel,
} from './progress';
import { MUTANTS, TRANSITIONS, canMove, lifecycleGoal, runSuite, spec } from './sandboxes';
import { PATH } from '../content/path';

const NOW = new Date(2026, 10, 20, 12).getTime();

describe('evaluate', () => {
  it('choice', () => {
    const c = { kind: 'choice' as const, prompt: '', options: ['a', 'b'], answer: 1 };
    expect(evaluate(c, { kind: 'choice', value: 1 }).correct).toBe(true);
    expect(evaluate(c, { kind: 'choice', value: 0 }).correct).toBe(false);
    expect(evaluate(c, { kind: 'choice', value: null }).correct).toBe(false);
  });

  it('multi needs the exact set', () => {
    const c = { kind: 'multi' as const, prompt: '', options: ['a', 'b', 'c'], answers: [0, 2] };
    expect(evaluate(c, { kind: 'multi', value: [2, 0] }).correct).toBe(true);
    expect(evaluate(c, { kind: 'multi', value: [0] }).correct).toBe(false);
    expect(evaluate(c, { kind: 'multi', value: [0, 1, 2] }).detail).toMatch(/1 wrong/);
  });

  it('value numberSet is order and separator insensitive', () => {
    const c = { kind: 'value' as const, prompt: '', mode: 'numberSet' as const, accept: ['7,8,20,21'] };
    expect(evaluate(c, { kind: 'value', value: '21 20; 8,7' }).correct).toBe(true);
    expect(evaluate(c, { kind: 'value', value: '8, 20' }).correct).toBe(false);
    expect(evaluate(c, { kind: 'value', value: 'eight' }).correct).toBe(false);
    expect(parseNumberSet('3, 3, 1')).toEqual([1, 3]);
  });

  it('value text normalises case, spacing and smart quotes', () => {
    const c = { kind: 'value' as const, prompt: '', mode: 'text' as const, accept: ["' OR '1'='1"] };
    expect(evaluate(c, { kind: 'value', value: "  ‘ or  ’1’=’1 " }).correct).toBe(true);
  });

  it('order reports leading steps in place', () => {
    const c = { kind: 'order' as const, prompt: '', steps: ['a', 'b', 'c'] };
    expect(evaluate(c, { kind: 'order', value: [0, 1, 2] }).correct).toBe(true);
    expect(evaluate(c, { kind: 'order', value: [0, 2, 1] }).detail).toBe('First 1 step is in place.');
  });

  it('classify needs every card placed', () => {
    const c = { kind: 'classify' as const, prompt: '', buckets: ['x', 'y'], items: [{ label: '1', bucket: 'x' }, { label: '2', bucket: 'y' }] };
    expect(evaluate(c, { kind: 'classify', value: ['x', null] }).correct).toBe(false);
    expect(evaluate(c, { kind: 'classify', value: ['x', 'y'] }).correct).toBe(true);
    expect(evaluate(c, { kind: 'classify', value: ['y', 'y'] }).detail).toMatch(/1 of 2/);
  });

  it('seededShuffle is a stable permutation that never starts solved', () => {
    for (const n of [2, 3, 5, 6]) {
      const a = seededShuffle(n, 'seed' + n);
      expect([...a].sort()).toEqual(Array.from({ length: n }, (_, i) => i));
      expect(a.every((v, i) => v === i)).toBe(false);
      expect(seededShuffle(n, 'seed' + n)).toEqual(a);
    }
  });
});

describe('progression', () => {
  it('level thresholds', () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(100);
    expect(xpForLevel(3)).toBe(300);
    expect(levelInfo(0).level).toBe(1);
    expect(levelInfo(99).level).toBe(1);
    expect(levelInfo(100).level).toBe(2);
    expect(levelInfo(200)).toMatchObject({ level: 2, into: 100, span: 200, pct: 0.5 });
  });

  it('xp award scales with hints and gives a clean bonus', () => {
    expect(awardFor(100, 0, 0)).toBe(110);
    expect(awardFor(100, 0, 2)).toBe(100);
    expect(awardFor(100, 1, 0)).toBe(80);
    expect(awardFor(100, 3, 5)).toBe(40);
  });

  it('wrong attempts count, solve awards once, practice awards nothing', () => {
    let p = emptyProgress();
    p = recordAttempt(p, 't', 60, false, NOW).progress;
    expect(p.tasks.t.attempts).toBe(1);
    const solved = recordAttempt(p, 't', 60, true, NOW);
    expect(solved.gained).toBe(60);
    expect(solved.progress.tasks.t).toMatchObject({ solved: true, clean: false, xpEarned: 60 });
    const again = recordAttempt(solved.progress, 't', 60, true, NOW + 1000);
    expect(again.gained).toBe(0);
    expect(again.progress).toBe(solved.progress);
  });

  it('hints are capped at 3 and frozen after solve', () => {
    let p = emptyProgress();
    for (let i = 0; i < 5; i++) p = recordHint(p, 't');
    expect(p.tasks.t.hints).toBe(3);
    p = recordAttempt(p, 't', 100, true, NOW).progress;
    expect(p.xp).toBe(40);
    expect(recordHint(p, 't')).toBe(p);
  });

  it('review queue: clean → 3 days, review success doubles, failure resets', () => {
    let p = recordAttempt(emptyProgress(), 't', 60, true, NOW).progress;
    expect(p.tasks.t.review).toEqual({ intervalDays: 3, due: NOW + 3 * DAY });
    expect(dueTaskIds(p, NOW + 2 * DAY)).toEqual([]);
    const later = NOW + 3 * DAY;
    expect(dueTaskIds(p, later)).toEqual(['t']);
    const ok = recordAttempt(p, 't', 60, true, later);
    expect(ok.gained).toBe(10);
    expect(ok.progress.tasks.t.review).toEqual({ intervalDays: 6, due: later + 6 * DAY });
    p = recordAttempt(p, 't', 60, false, later).progress;
    expect(p.tasks.t.review).toEqual({ intervalDays: 1, due: later + DAY });
  });

  it('hinted solves are due tomorrow', () => {
    const p = recordAttempt(recordHint(emptyProgress(), 't'), 't', 60, true, NOW).progress;
    expect(p.tasks.t.review?.intervalDays).toBe(1);
  });

  it('streak counts consecutive days and lapses', () => {
    let s = bumpStreak({ count: 0, lastDay: null }, NOW);
    expect(s.count).toBe(1);
    expect(bumpStreak(s, NOW + 3600_000)).toBe(s);
    s = bumpStreak(s, NOW + DAY);
    expect(s.count).toBe(2);
    expect(liveStreak(s, NOW + 2 * DAY)).toBe(2);
    expect(liveStreak(s, NOW + 3 * DAY)).toBe(0);
    expect(bumpStreak(s, NOW + 5 * DAY).count).toBe(1);
  });

  it('loadProgress tolerates missing and corrupt storage', () => {
    expect(loadProgress(undefined)).toEqual(emptyProgress());
    expect(loadProgress({ getItem: () => '{nope' })).toEqual(emptyProgress());
    expect(loadProgress({ getItem: () => '{"v":2}' })).toEqual(emptyProgress());
    expect(loadProgress({ getItem: () => { throw new Error('blocked'); } })).toEqual(emptyProgress());
  });
});

describe('sandboxes', () => {
  it('only the four boundary values kill every mutant', () => {
    expect(runSuite([25, 30, 45]).killed).toBe(0);
    expect(runSuite([17, 18, 60, 61]).allKilled).toBe(true);
    expect(runSuite([18, 60, 61]).allKilled).toBe(false);
    expect(MUTANTS.every((m) => [25].every((a) => m.accepts(a) === spec(a)))).toBe(true);
  });

  it('lifecycle transitions and goal', () => {
    expect(canMove('New', 'Assigned')).toBe(true);
    expect(canMove('New', 'Closed')).toBe(false);
    const happy = ['New', 'Assigned', 'Open', 'Fixed', 'Retest', 'Closed'] as const;
    expect(lifecycleGoal([...happy]).correct).toBe(false);
    const full = ['New', 'Assigned', 'Open', 'Fixed', 'Retest', 'Reopened', 'Open', 'Fixed', 'Retest', 'Closed'] as const;
    for (let i = 1; i < full.length; i++) expect(canMove(full[i - 1], full[i])).toBe(true);
    expect(lifecycleGoal([...full]).correct).toBe(true);
    expect(Object.keys(TRANSITIONS)).toHaveLength(10);
  });
});

describe('content', () => {
  it('every task is well formed and solvable', () => {
    const ids = new Set<string>();
    for (const room of PATH.rooms) {
      expect(room.tasks.length).toBeGreaterThanOrEqual(5);
      for (const t of room.tasks) {
        expect(ids.has(t.id)).toBe(false);
        ids.add(t.id);
        expect(t.hints).toHaveLength(3);
        const c = t.check;
        if (c.kind === 'choice') expect(c.options[c.answer]).toBeDefined();
        if (c.kind === 'multi') c.answers.forEach((a) => expect(c.options[a]).toBeDefined());
        if (c.kind === 'classify') c.items.forEach((it) => expect(c.buckets).toContain(it.bucket));
        if (c.kind === 'value') expect(evaluate(c, { kind: 'value', value: c.accept[0] }).correct).toBe(true);
      }
    }
  });
});
