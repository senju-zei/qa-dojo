import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CommandPalette, type PaletteAction } from './components/CommandPalette';
import { CompletionCard } from './components/CompletionCard';
import { Header } from './components/Header';
import { Home } from './components/Home';
import { RoomView } from './components/RoomView';
import { PATH, findTask } from './content/path';
import {
  dueTaskIds,
  emptyProgress,
  liveStreak,
  loadProgress,
  recordAttempt,
  recordHint,
  saveProgress,
  type Progress,
} from './engine/progress';
import { isTypingTarget, safeStorage, useHashRoute } from './hooks';

type Theme = 'system' | 'light' | 'dark';
const THEME_KEY = 'qa-dojo.theme';

export default function App() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress(safeStorage()));
  const progressRef = useRef(progress);
  const [route, navigate] = useHashRoute();
  const [focus, setFocus] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [completion, setCompletion] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(() => (safeStorage()?.getItem(THEME_KEY) as Theme) || 'system');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    progressRef.current = progress;
    saveProgress(safeStorage(), progress);
  }, [progress]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = theme;
    try {
      safeStorage()?.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const room = route.name === 'room' ? PATH.rooms.find((r) => r.id === route.roomId) : undefined;
  const taskIndex = room && route.name === 'room' ? Math.min(route.taskIndex, room.tasks.length - 1) : 0;
  const task = room?.tasks[taskIndex];

  useEffect(() => {
    if (route.name === 'room' && !room) navigate({ name: 'home' });
  }, [route, room, navigate]);

  useEffect(() => {
    document.title = task ? `${task.title} · ${room!.title} · QA Dojo` : 'QA Dojo';
    window.scrollTo({ top: 0 });
  }, [task, room]);

  const due = useMemo(() => dueTaskIds(progress, now), [progress, now]);
  const streak = liveStreak(progress.streak, now);

  const openTask = useCallback((roomId: string, index: number) => navigate({ name: 'room', roomId, taskIndex: index }), [navigate]);
  const goHome = useCallback(() => navigate({ name: 'home' }), [navigate]);

  const startReview = useCallback(() => {
    const f = due[0] ? findTask(due[0]) : undefined;
    if (f) openTask(f.room.id, f.index);
  }, [due, openTask]);

  const onAttempt = (taskId: string, correct: boolean) => {
    const before = progressRef.current;
    const f = findTask(taskId)!;
    const out = recordAttempt(before, taskId, f.task.xp, correct, Date.now());
    progressRef.current = out.progress;
    setProgress(out.progress);
    const wasDone = f.room.tasks.every((t) => before.tasks[t.id]?.solved);
    const nowDone = f.room.tasks.every((t) => out.progress.tasks[t.id]?.solved);
    if (correct && nowDone && !wasDone) window.setTimeout(() => setCompletion(f.room.id), 1100);
    return out.gained;
  };

  const onHint = (taskId: string) => {
    const next = recordHint(progressRef.current, taskId);    progressRef.current = next;
    setProgress(next);
  };

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const sysDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
      const current = t === 'system' ? (sysDark ? 'dark' : 'light') : t;
      return current === 'dark' ? 'light' : 'dark';
    });
  }, []);

  /* global shortcuts */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      if (paletteOpen || completion) return;
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      const key = e.key.toLowerCase();
      if (key === 'f') {
        e.preventDefault();
        setFocus((f) => !f);
      } else if (key === 'escape' && focus) {
        setFocus(false);
      } else if (room && key === 'h') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('dojo:hint'));
      } else if (room && key === 'j' && taskIndex < room.tasks.length - 1) {
        openTask(room.id, taskIndex + 1);
      } else if (room && key === 'k' && taskIndex > 0) {
        openTask(room.id, taskIndex - 1);
      } else if (room && key === 'enter' && (e.target === document.body || e.target === null)) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('dojo:check'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paletteOpen, completion, focus, room, taskIndex, openTask]);

  const actions = useMemo<PaletteAction[]>(() => {
    const list: PaletteAction[] = [
      { id: 'home', group: 'Actions', label: 'Go to learning path', icon: '⌂', run: goHome },
      { id: 'focus', group: 'Actions', label: focus ? 'Exit focus mode' : 'Enter focus mode', sub: 'F', icon: '◱', run: () => setFocus((f) => !f) },
      { id: 'theme', group: 'Actions', label: 'Toggle light / dark', icon: '◐', run: toggleTheme },
    ];
    if (due.length) list.splice(1, 0, { id: 'review', group: 'Actions', label: `Start review (${due.length} due)`, icon: '↻', run: startReview });
    list.push({
      id: 'reset',
      group: 'Actions',
      label: 'Reset all progress',
      sub: 'Clears XP, streak and review queue',
      icon: '⌫',
      run: () => {
        if (window.confirm('Reset all QA Dojo progress? This cannot be undone.')) {
          progressRef.current = emptyProgress();
          setProgress(emptyProgress());
          goHome();
        }
      },
    });
    return list;
  }, [focus, due.length, goHome, startReview, toggleTheme]);

  const completedRoom = completion ? PATH.rooms.find((r) => r.id === completion) : undefined;
  const nextRoom = completedRoom ? PATH.rooms[PATH.rooms.indexOf(completedRoom) + 1] : undefined;

  return (
    <div className={focus ? 'focus' : ''}>
      <Header
        xp={progress.xp}
        streak={streak}
        dueCount={due.length}
        crumb={room && task ? { room: room.title, task: task.title } : undefined}
        focus={focus}
        onHome={goHome}
        onPalette={() => setPaletteOpen(true)}
        onFocus={() => setFocus((f) => !f)}
        onReview={startReview}
      />
      {room ? (
        <RoomView
          room={room}
          taskIndex={taskIndex}
          progress={progress}
          onSelect={(i) => openTask(room.id, i)}
          onAttempt={onAttempt}
          onHint={onHint}
          onSummary={() => setCompletion(room.id)}
        />
      ) : (
        <Home progress={progress} due={due} streak={streak} onOpen={openTask} />
      )}
      {paletteOpen && <CommandPalette progress={progress} actions={actions} onOpenTask={openTask} onClose={() => setPaletteOpen(false)} />}
      {completedRoom && (
        <CompletionCard
          room={completedRoom}
          nextRoom={nextRoom}
          progress={progress}
          onClose={() => setCompletion(null)}
          onNext={() => {
            setCompletion(null);
            if (nextRoom) openTask(nextRoom.id, 0);
            else goHome();
          }}
          onReview={(i) => {
            setCompletion(null);
            openTask(completedRoom.id, i);
          }}
        />
      )}
    </div>
  );
}
