# QA Dojo

A personal, TryHackMe-style study platform built from the **QA Study Guide and Interview Reviewer**.
Every task is something you *do*: order it, sort it, break it.

```bash
cd qa-dojo
npm install
npm run dev        # http://localhost:5173
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run typecheck` | TypeScript, zero errors expected |
| `npm test` | Vitest: engine, progression, sandboxes, content integrity |
| `npm run build` | Production build into `dist/` (static, works from any folder) |

## Rooms

**Edge Lab** (Part 1 §1–2): QA vs QC vs Testing · STLC order · testing types · the four test-case groups ·
boundary value analysis (interactive limit sliders + zoom) · equivalence partitioning ·
**Mutant hunt** sandbox (kill 5 buggy Age checks with ≤ 6 tests).

**Triage Bay** (Part 1 §3–4): bug report anatomy (live-assembled report) · good titles · severity vs priority ·
triage matrix · security quick-match · "that's not a bug" · **Bug life cycle** state-machine sandbox.

Planned (from the same guide): JS Readout · Playwright Pilot · Interview Drill.

## How progression works

- XP per task, once: −20/−40/−60 % for 1/2/3 hints, +10 % for a first-try clean solve.
- Levels at 100, 300, 600, 1000 … XP (`50·L·(L−1)`).
- Streak = consecutive days with at least one solve.
- Solved tasks come back for review: 1 day if hinted, 2–3 days otherwise; each successful review doubles the gap.
- Progress lives in `localStorage` (key `qa-dojo.progress.v1`). Reset from the ⌘K palette.

## Shortcuts

`⌘K`/`Ctrl+K` jump anywhere · `H` next hint · `F` focus mode · `J`/`K` next/previous task · `Enter` check · `Esc` close.

## Layout

```
src/
  engine/     pure TS: types, evaluate(), progression, sandbox logic, tests
  content/    the learning path (rooms, tasks, hints) built from the guide
  components/ header, home, room, task panel, runners, hint drawer, palette, completion card
  visuals/    interactive SVG stages (rings, pipeline, boundary lab, partitions, report, matrix)
  sandboxes/  Mutant lab, Bug life cycle
  styles/     design tokens (light + dark) and app styles
```

Subagent specs for extending it live in `../.claude/agents/`.
