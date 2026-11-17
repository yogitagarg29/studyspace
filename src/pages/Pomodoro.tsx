import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Pause,
  Play,
  RotateCcw,
  Timer as TimerIcon,
  Coffee,
  Volume2,
  VolumeX,
  Flame,
  Sparkles,
} from 'lucide-react';

type Mode = 'focus' | 'break';
type RunState = 'idle' | 'running' | 'paused';

interface Preset {
  id: string;
  label: string;
  focusMinutes: number;
  breakMinutes: number;
}

const PRESETS: Preset[] = [
  { id: 'classic', label: 'Classic (25/5)', focusMinutes: 25, breakMinutes: 5 },
  { id: 'deep', label: 'Deep Work (50/10)', focusMinutes: 50, breakMinutes: 10 },
  { id: 'sprint', label: 'Quick Sprint (15/3)', focusMinutes: 15, breakMinutes: 3 },
];

function format(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function Pomodoro() {
  const [selectedPreset, setSelectedPreset] = useState<Preset>(PRESETS[0]);
  const [mode, setMode] = useState<Mode>('focus');
  const [runState, setRunState] = useState<RunState>('idle');
  const [secondsLeft, setSecondsLeft] = useState(PRESETS[0].focusMinutes * 60);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [completedCount, setCompletedCount] = useState(
    () => Number(localStorage.getItem('studyspace:pomodoro-count')) || 0,
  );
  const [sessionMessage, setSessionMessage] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds =
    mode === 'focus' ? selectedPreset.focusMinutes * 60 : selectedPreset.breakMinutes * 60;

  const playCompletionChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Soft harmonic chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now + 0.15);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35); // D6

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.5);
      osc2.start(now + 0.15);
      osc2.stop(now + 1.2);
    } catch {
      // AudioContext blocked or unsupported
    }
  }, [soundEnabled]);

  // Clear interval on unmount
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
    if (runState === 'running') return;
    clearCurrentInterval();
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;
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
    setSecondsLeft(
      mode === 'focus' ? selectedPreset.focusMinutes * 60 : selectedPreset.breakMinutes * 60,
    );
    setSessionMessage('');
  };

  // Detect completion when countdown reaches 0
  useEffect(() => {
    if (secondsLeft !== 0 || runState !== 'running') return;
    clearCurrentInterval();
    setRunState('idle');
    playCompletionChime();

    if (mode === 'focus') {
      const next = completedCount + 1;
      setCompletedCount(next);
      localStorage.setItem('studyspace:pomodoro-count', String(next));
      setSessionMessage(
        `Great focus session complete! Take a well-deserved ${selectedPreset.breakMinutes}-minute rest.`,
      );
      setMode('break');
      setSecondsLeft(selectedPreset.breakMinutes * 60);
    } else {
      setSessionMessage(
        `Break over! Ready for another ${selectedPreset.focusMinutes}-minute focus block?`,
      );
      setMode('focus');
      setSecondsLeft(selectedPreset.focusMinutes * 60);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, runState]);

  const switchMode = (next: Mode) => {
    clearCurrentInterval();
    setMode(next);
    setRunState('idle');
    setSecondsLeft(
      next === 'focus' ? selectedPreset.focusMinutes * 60 : selectedPreset.breakMinutes * 60,
    );
    setSessionMessage('');
  };

  const changePreset = (preset: Preset) => {
    clearCurrentInterval();
    setSelectedPreset(preset);
    setRunState('idle');
    setSecondsLeft(mode === 'focus' ? preset.focusMinutes * 60 : preset.breakMinutes * 60);
    setSessionMessage('');
  };

  const progress = Math.max(0, Math.min(1, 1 - secondsLeft / totalSeconds));
  const radius = 132;
  const circumference = 2 * Math.PI * radius;
  const isFocus = mode === 'focus';

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Pomodoro Focus Timer</h1>
          <p className="page-subtitle">
            Structure your study sessions with focused work intervals and refreshing breaks.
          </p>
        </div>

        {/* Sound toggle button */}
        <button
          onClick={() => setSoundEnabled((prev) => !prev)}
          className="btn-secondary !py-2 text-xs"
          title={soundEnabled ? 'Mute completion chime' : 'Enable completion chime'}
        >
          {soundEnabled ? (
            <>
              <Volume2 size={15} className="text-violet-500" />
              <span>Chime On</span>
            </>
          ) : (
            <>
              <VolumeX size={15} className="text-slate-400" />
              <span>Chime Muted</span>
            </>
          )}
        </button>
      </header>

      {/* Main Timer Card */}
      <div className="card card-lift animate-fade-up mx-auto max-w-xl p-6 sm:p-8">
        {/* Preset selector pills */}
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {PRESETS.map((p) => {
            const active = selectedPreset.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => changePreset(p)}
                disabled={runState === 'running'}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  active
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 disabled:opacity-50'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Focus / Break Switcher */}
        <div className="mx-auto flex w-fit rounded-xl bg-slate-100 p-1 ring-1 ring-slate-900/5 dark:bg-white/5 dark:ring-white/10">
          <button
            onClick={() => switchMode('focus')}
            className={`flex items-center gap-2 rounded-lg px-5 py-2 text-xs font-bold transition-all duration-200 ${
              isFocus
                ? 'bg-white text-violet-700 shadow-sm dark:bg-white/15 dark:text-violet-200'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <TimerIcon size={15} />
            Focus ({selectedPreset.focusMinutes}m)
          </button>
          <button
            onClick={() => switchMode('break')}
            className={`flex items-center gap-2 rounded-lg px-5 py-2 text-xs font-bold transition-all duration-200 ${
              !isFocus
                ? 'bg-white text-sky-700 shadow-sm dark:bg-white/15 dark:text-sky-200'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Coffee size={15} />
            Break ({selectedPreset.breakMinutes}m)
          </button>
        </div>

        {/* Timer Ring */}
        <div className="relative mx-auto mt-8 flex h-72 w-72 items-center justify-center">
          <svg width="292" height="292" className="-rotate-90">
            {/* Background track */}
            <circle
              cx="146"
              cy="146"
              r={radius}
              fill="none"
              strokeWidth="14"
              className="stroke-slate-900/10 dark:stroke-white/10"
            />
            {/* Animated progress stroke */}
            <circle
              cx="146"
              cy="146"
              r={radius}
              fill="none"
              stroke={isFocus ? 'url(#focusGradient)' : 'url(#breakGradient)'}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              style={{
                transition: 'stroke-dashoffset 0.5s linear',
                filter: isFocus
                  ? 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.45))'
                  : 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.45))',
              }}
            />
            <defs>
              <linearGradient id="focusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
              <linearGradient id="breakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>

          {/* Central timer readout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`font-display text-6xl font-extrabold tabular-nums tracking-tight ${
                isFocus ? 'text-slate-900 dark:text-white' : 'text-sky-600 dark:text-sky-400'
              }`}
            >
              {format(secondsLeft)}
            </span>
            <span className="mt-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {runState === 'running' && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500"></span>
                </span>
              )}
              {isFocus ? 'Focus Mode' : 'Rest & Recharge'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-8 flex items-center justify-center gap-3">
          {runState !== 'running' ? (
            <button onClick={start} className="btn-primary px-8" disabled={secondsLeft === 0}>
              <Play size={18} fill="currentColor" />
              {runState === 'paused' ? 'Resume' : 'Start Focus'}
            </button>
          ) : (
            <button onClick={pause} className="btn-secondary px-8">
              <Pause size={18} />
              Pause
            </button>
          )}
          <button onClick={reset} className="btn-secondary" title="Reset timer">
            <RotateCcw size={16} />
            Reset
          </button>
        </div>

        {/* Completion Message */}
        {sessionMessage && (
          <div className="mt-6 rounded-xl bg-emerald-500/10 p-3.5 text-center text-sm font-semibold text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-400">
            {sessionMessage}
          </div>
        )}
      </div>

      {/* Lifetime Stats & Streak */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mx-auto max-w-xl">
        <div className="card card-lift animate-fade-up stagger-1 p-5 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <Flame size={15} className="text-amber-500" />
            Sessions Completed
          </div>
          <p className="font-display mt-2 text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
            {completedCount}
          </p>
          <p className="mt-1 text-xs muted">
            {completedCount * 25 >= 60
              ? `${Math.round((completedCount * 25) / 60 * 10) / 10} hours of focused time`
              : `${completedCount * 25} minutes total focus`}
          </p>
        </div>

        <div className="card card-lift animate-fade-up stagger-2 p-5 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <Sparkles size={15} className="text-violet-500" />
            Study Tip
          </div>
          <p className="mt-2 text-xs leading-relaxed font-medium text-slate-700 dark:text-slate-300">
            {isFocus
              ? 'Put your phone in Do Not Disturb and conquer one single concept at a time.'
              : 'Stand up, stretch, hydrate, and look at something 20 feet away.'}
          </p>
        </div>
      </div>
    </div>
  );
}
