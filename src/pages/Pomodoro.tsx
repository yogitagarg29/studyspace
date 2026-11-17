import { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Timer as TimerIcon, Coffee } from 'lucide-react';

type Mode = 'focus' | 'break';
type RunState = 'idle' | 'running' | 'paused';

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

function format(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function Pomodoro() {
  const [mode, setMode] = useState<Mode>('focus');
  const [runState, setRunState] = useState<RunState>('idle');
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_SECONDS);
  const [completedCount, setCompletedCount] = useState(
    () => Number(localStorage.getItem('studyspace:pomodoro-count')) || 0,
  );
  const [sessionMessage, setSessionMessage] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = mode === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS;

  // Clear interval on unmount so nothing keeps ticking after leaving the page
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const clearCurrentInterval = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const start = () => {
    if (runState === 'running') return; // never two intervals at once
    clearCurrentInterval();
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;
        // timer finished
        return 0;
      });
    }, 1000);
    setRunState('running');
  };

  const pause = () => {
    if (runState !== 'running') return;
    clearCurrentInterval();
    setRunState('paused');
  };

  const reset = () => {
    clearCurrentInterval();
    setRunState('idle');
    setSecondsLeft(mode === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS);
    setSessionMessage('');
  };

  // Detect completion when the countdown hits zero
  useEffect(() => {
    if (secondsLeft !== 0 || runState !== 'running') return;
    clearCurrentInterval();
    setRunState('idle');
    if (mode === 'focus') {
      const next = completedCount + 1;
      setCompletedCount(next);
      localStorage.setItem('studyspace:pomodoro-count', String(next));
      setSessionMessage('Great job! Focus session complete — time for a 5-minute break.');
      setMode('break');
      setSecondsLeft(BREAK_SECONDS);
    } else {
      setSessionMessage('Break over! Ready for another 25-minute focus session?');
      setMode('focus');
      setSecondsLeft(FOCUS_SECONDS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, runState]);

  const switchMode = (next: Mode) => {
    clearCurrentInterval();
    setMode(next);
    setRunState('idle');
    setSecondsLeft(next === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS);
    setSessionMessage('');
  };

  const progress = 1 - secondsLeft / totalSeconds;
  const circumference = 2 * Math.PI * 130;
  const isFocus = mode === 'focus';

  return (
    <div className="space-y-6">
      <header>
        <h1 className="page-title">Focus Timer</h1>
        <p className="page-subtitle">
          25 minutes of focused work, 5 minutes of rest — the classic Pomodoro rhythm.
        </p>
      </header>

      <div className="card mx-auto max-w-xl p-8">
        {/* Mode switch */}
        <div className="mx-auto flex w-fit rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => switchMode('focus')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
              isFocus ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <TimerIcon size={15} />
            Focus
          </button>
          <button
            onClick={() => switchMode('break')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
              !isFocus ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Coffee size={15} />
            Break
          </button>
        </div>

        {/* Timer display */}
        <div className="relative mx-auto mt-8 flex h-72 w-72 items-center justify-center">
          <svg width="288" height="288" className="-rotate-90">
            <circle cx="144" cy="144" r="130" fill="none" stroke="rgb(241 245 249)" strokeWidth="14" />
            <circle
              cx="144"
              cy="144"
              r="130"
              fill="none"
              stroke={isFocus ? '#6366f1' : '#0ea5e9'}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              style={{ transition: 'stroke-dashoffset 0.5s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`font-mono text-6xl font-extrabold tabular-nums tracking-tight ${
                isFocus ? 'text-slate-900' : 'text-sky-600'
              }`}
            >
              {format(secondsLeft)}
            </span>
            <span className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">
              {isFocus ? 'Focus Session' : 'Break Time'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-8 flex items-center justify-center gap-3">
          {runState !== 'running' ? (
            <button onClick={start} className="btn-primary px-8" disabled={secondsLeft === 0}>
              <Play size={17} />
              {runState === 'paused' ? 'Resume' : 'Start'}
            </button>
          ) : (
            <button onClick={pause} className="btn-secondary px-8">
              <Pause size={17} />
              Pause
            </button>
          )}
          <button onClick={reset} className="btn-secondary">
            <RotateCcw size={16} />
            Reset
          </button>
        </div>

        {/* Completion message */}
        {sessionMessage && (
          <div className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100">
            {sessionMessage}
          </div>
        )}
      </div>

      <div className="card mx-auto max-w-xl p-6 text-center">
        <p className="text-sm text-slate-500">
          Focus sessions completed all-time
        </p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight text-indigo-600">
          {completedCount}
        </p>
      </div>
    </div>
  );
}
