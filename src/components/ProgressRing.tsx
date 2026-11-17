import { useEffect, useState } from 'react';

interface ProgressRingProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
}

export function ProgressRing({
  value,
  size = 170,
  strokeWidth = 13,
  label,
  sublabel,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const [shown, setShown] = useState(0);

  // Animate the number and sweep up when the score changes
  useEffect(() => {
    const start = performance.now();
    const from = shown;
    const duration = 800;
    let frame: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(from + (clamped - from) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clamped]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - shown / 100);
  const center = size / 2;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-slate-900/10 dark:stroke-white/10"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 0.15s linear',
            filter: 'drop-shadow(0 0 6px rgba(139, 92, 246, 0.45))',
          }}
        />
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {label ?? `${shown}%`}
        </span>
        {sublabel && (
          <span className="mt-0.5 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
