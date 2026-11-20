import { useEffect, useRef } from 'react';
import type { Progress } from '../engine/progress';
import type { Room } from '../engine/types';
import { useCountUp } from '../hooks';
import { roomStats } from './Home';
import { Arrow } from './Icons';

interface Props {
  room: Room;
  nextRoom?: Room;
  progress: Progress;
  onNext: () => void;
  onReview: (index: number) => void;
  onClose: () => void;
}

export function CompletionCard({ room, nextRoom, progress, onNext, onReview, onClose }: Props) {
  const s = roomStats(room, progress);
  const xp = useCountUp(s.xp, 1200);
  const missed = room.tasks.findIndex((t) => !progress.tasks[t.id]?.clean);
  const primary = useRef<HTMLButtonElement>(null);
  useEffect(() => primary.current?.focus(), []);

  return (
    <div className="overlay" style={{ placeItems: 'center', paddingTop: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="complete" role="dialog" aria-modal="true" aria-labelledby="complete-title" onKeyDown={(e) => e.key === 'Escape' && onClose()}>
        <span className="eyebrow">{s.done ? 'Room complete' : 'Room summary'} · {room.source}</span>
        <h2 id="complete-title">{room.title} {s.done ? 'cleared.' : 'so far.'}</h2>
        <p className="muted" style={{ margin: 0 }}>
          {!s.done ? `${s.total - s.solved} task${s.total - s.solved === 1 ? '' : 's'} still open. Finish them to clear the room.` : s.clean === s.total ? 'Every task solved clean, no hints. Interview-ready.' : `${s.clean} clean solves. The hinted ones come back for review tomorrow.`}
        </p>
        <div className="complete-stats">
          <div className="stat"><span className="eyebrow">Tasks cleared</span><b>{s.solved}/{s.total}</b></div>
          <div className="stat"><span className="eyebrow">Solved clean</span><b>{s.clean}</b></div>
          <div className="stat"><span className="eyebrow">Hint-assisted</span><b>{s.hinted}</b></div>
          <div className="stat"><span className="eyebrow">XP earned</span><b>+{xp}</b></div>
        </div>
        <div className="complete-strip" aria-label="Per-task result: green is clean, gold is hinted">
          {room.tasks.map((t, i) => (
            <i key={t.id} className={progress.tasks[t.id]?.clean ? '' : progress.tasks[t.id]?.solved ? 'hinted' : 'open'} style={{ animationDelay: `${i * 70}ms` }} title={t.title} />
          ))}
        </div>
        <div className="complete-actions">
          <button ref={primary} className="btn primary" onClick={onNext}>
            {nextRoom ? <>Next room: {nextRoom.title}</> : 'Back to path'} <Arrow size={15} />
          </button>
          {missed >= 0 && (
            <button className="btn" onClick={() => onReview(missed)}>
              Review missed: {room.tasks[missed].title}
            </button>
          )}
          <button className="btn ghost" onClick={onClose}>Stay here</button>
        </div>
      </div>
    </div>
  );
}
