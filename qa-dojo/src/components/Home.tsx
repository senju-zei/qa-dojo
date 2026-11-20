import { PATH, findTask } from '../content/path';
import type { Progress } from '../engine/progress';
import type { Room } from '../engine/types';
import { Arrow } from './Icons';

interface Props {
  progress: Progress;
  due: string[];
  streak: number;
  onOpen: (roomId: string, taskIndex: number) => void;
}

export function roomStats(room: Room, p: Progress) {
  const tps = room.tasks.map((t) => p.tasks[t.id]);
  const solved = tps.filter((t) => t?.solved).length;
  const clean = tps.filter((t) => t?.solved && t.clean).length;
  const xp = tps.reduce((s, t) => s + (t?.xpEarned ?? 0), 0);
  const firstOpen = room.tasks.findIndex((t) => !p.tasks[t.id]?.solved);
  const maxXp = room.tasks.reduce((s, t) => s + Math.round(t.xp * 1.1), 0);
  return { solved, clean, hinted: solved - clean, xp, maxXp, firstOpen, total: room.tasks.length, done: solved === room.tasks.length };
}

function Ring({ pct }: { pct: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <div className="ring" aria-hidden>
      <svg width={54} height={54}>
        <circle cx={27} cy={27} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={5} />
        <circle cx={27} cy={27} r={r} fill="none" stroke={pct >= 1 ? 'var(--ok)' : 'var(--accent)'} strokeWidth={5} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: 'stroke-dashoffset 800ms cubic-bezier(.2,.8,.2,1)' }} />
      </svg>
      <span>{Math.round(pct * 100)}%</span>
    </div>
  );
}

export function Home({ progress, due, streak, onOpen }: Props) {
  const totalTasks = PATH.rooms.reduce((s, r) => s + r.tasks.length, 0);
  const solved = Object.values(progress.tasks).filter((t) => t.solved).length;
  const next = PATH.rooms.map((r) => ({ r, s: roomStats(r, progress) })).find(({ s }) => !s.done);

  return (
    <main className="home">
      <section className="hero">
        <div>
          <span className="eyebrow">{PATH.title} · built from your QA Study Guide</span>
          <h1 className="display">
            Bugs hide at the <em>edges</em>.<br />Go find them.
          </h1>
          <p>
            Hands-on rooms for your QA trainee interview. Every task is something you do: order it, sort it, break it. Hints are there when you need them, but they cost XP.
          </p>
          <div className="check-row" style={{ marginTop: 22 }}>
            {next ? (
              <button className="btn primary" onClick={() => onOpen(next.r.id, Math.max(0, next.s.firstOpen))}>
                {next.s.solved ? 'Continue' : 'Start'} {next.r.title} <Arrow size={15} />
              </button>
            ) : (
              <span className="pill" style={{ color: 'var(--ok)' }}>All rooms cleared</span>
            )}
            {due.length > 0 && (
              <button className="btn" onClick={() => { const f = findTask(due[0]); if (f) onOpen(f.room.id, f.index); }}>
                Review {due.length} due
              </button>
            )}
          </div>
        </div>
        <div className="stat-grid">
          <div className="stat"><span className="eyebrow">XP</span><b>{progress.xp}</b></div>
          <div className="stat"><span className="eyebrow">Cleared</span><b>{solved}<span className="muted" style={{ fontSize: 15 }}>/{totalTasks}</span></b></div>
          <div className="stat"><span className="eyebrow">Streak</span><b style={{ color: streak ? 'var(--gold)' : undefined }}>{streak}d</b></div>
        </div>
      </section>

      <div className="home-grid">
        <section className="path" aria-label="Learning path">
          {PATH.rooms.map((room, i) => {
            const s = roomStats(room, progress);
            return (
              <button key={room.id} className={`room-card ${s.done ? 'done' : ''}`} onClick={() => onOpen(room.id, s.done ? 0 : Math.max(0, s.firstOpen))}>
                <span className="room-node">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <span className="eyebrow">{room.source}</span>
                  <h3>{room.title}</h3>
                  <p>{room.tagline}</p>
                  <div className="task-ticks" aria-label={`${s.solved} of ${s.total} tasks cleared`}>
                    {room.tasks.map((t) => {
                      const tp = progress.tasks[t.id];
                      return <i key={t.id} className={tp?.solved ? (tp.clean ? 'clean' : 'hinted') : ''} />;
                    })}
                  </div>
                  <div className="room-meta">
                    <span>{s.solved}/{s.total} tasks</span>
                    <span>{s.xp}/{s.maxXp} XP</span>
                    {s.solved > 0 && <span>{s.clean} clean</span>}
                  </div>
                </div>
                <Ring pct={s.solved / s.total} />
              </button>
            );
          })}
          {PATH.planned.map((room, i) => (
            <div key={room.id} className="room-card planned" aria-disabled>
              <span className="room-node">{String(PATH.rooms.length + i + 1).padStart(2, '0')}</span>
              <div>
                <span className="eyebrow">{room.source}</span>
                <h3>{room.title} <span className="tag">planned</span></h3>
                <p>{room.tagline}</p>
              </div>
            </div>
          ))}
        </section>

        <aside>
          <div className="side-card">
            <h4>Due for review</h4>
            {due.length === 0 ? (
              <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                Nothing due. Solved tasks come back after 1–3 days, sooner if you needed hints.
              </p>
            ) : (
              <ul className="due-list">
                {due.slice(0, 6).map((id) => {
                  const f = findTask(id)!;
                  return (
                    <li key={id}>
                      <button onClick={() => onOpen(f.room.id, f.index)}>
                        <span>{f.task.title}</span>
                        <span className="muted mono">{f.room.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="side-card">
            <h4>Shortcuts</h4>
            <dl className="keys">
              <dt><kbd>⌘</kbd><kbd>K</kbd></dt><dd>Jump to any room or task</dd>
              <dt><kbd>H</kbd></dt><dd>Reveal next hint</dd>
              <dt><kbd>F</kbd></dt><dd>Focus mode</dd>
              <dt><kbd>J</kbd><kbd>K</kbd></dt><dd>Next / previous task</dd>
              <dt><kbd>↵</kbd></dt><dd>Check answer</dd>
              <dt><kbd>Esc</kbd></dt><dd>Close / leave focus</dd>
            </dl>
          </div>
        </aside>
      </div>
    </main>
  );
}
