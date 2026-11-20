import { modeFor, type Progress } from '../engine/progress';
import type { Room } from '../engine/types';
import { roomStats } from './Home';
import { TaskPanel } from './TaskPanel';

interface Props {
  room: Room;
  taskIndex: number;
  progress: Progress;
  onSelect: (i: number) => void;
  onAttempt: (taskId: string, correct: boolean) => number;
  onHint: (taskId: string) => void;
  onSummary: () => void;
}

export function RoomView({ room, taskIndex, progress, onSelect, onAttempt, onHint, onSummary }: Props) {
  const task = room.tasks[taskIndex];
  const s = roomStats(room, progress);
  const now = Date.now();
  const statusClass = (id: string) => {
    const tp = progress.tasks[id];
    return tp?.solved ? (tp.clean ? 'clean' : 'hinted') : '';
  };
  return (
    <div className="room">
      <nav className="rail" aria-label={`${room.title} tasks`}>
        <span className="eyebrow">Room · {room.glyph}</span>
        <h2>{room.title}</h2>
        <p className="src">{room.source}</p>
        <ol>
          {room.tasks.map((t, i) => (
            <li key={t.id}>
              <button className={`rail-item ${statusClass(t.id)}`} aria-current={i === taskIndex ? 'step' : undefined} onClick={() => onSelect(i)}>
                <span className="rail-num">{progress.tasks[t.id]?.solved ? '✓' : i + 1}</span>
                <span>{t.title}</span>
                <span className="rail-xp">{t.xp}</span>
              </button>
            </li>
          ))}
        </ol>
        <div className="rail-progress">
          <span>{s.solved}/{s.total} cleared · {s.xp} XP</span>
          <div className="bar"><i style={{ width: `${(s.solved / s.total) * 100}%` }} /></div>
        </div>
      </nav>
      <div className="workspace">
        <div className="mobile-tasks" role="tablist" aria-label="Tasks">
          {room.tasks.map((t, i) => (
            <button key={t.id} role="tab" aria-selected={i === taskIndex} aria-current={i === taskIndex ? 'step' : undefined} className={`rail-num rail-item ${statusClass(t.id)}`} style={{ padding: 0 }} onClick={() => onSelect(i)} aria-label={t.title}>
              {progress.tasks[t.id]?.solved ? '✓' : i + 1}
            </button>
          ))}
        </div>
        <TaskPanel
          key={task.id}
          room={room}
          task={task}
          index={taskIndex}
          tp={progress.tasks[task.id]}
          mode={modeFor(progress.tasks[task.id], now)}
          isLast={taskIndex === room.tasks.length - 1}
          onAttempt={(c) => onAttempt(task.id, c)}
          onHint={() => onHint(task.id)}
          onNext={() => (taskIndex === room.tasks.length - 1 ? onSummary() : onSelect(taskIndex + 1))}
        />
      </div>
    </div>
  );
}
