import { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string;
  onDone: () => void;
}

export function Toast({ message, onDone }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2400);
    return () => clearTimeout(timer);
  }, [message, onDone]);

  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-[60] w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 animate-fade-up"
    >
      <div className="flex items-center gap-2.5 rounded-full bg-slate-900 py-2.5 pl-4 pr-5 text-sm font-semibold text-white shadow-2xl shadow-slate-900/30 ring-1 ring-white/10">
        <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
        {message}
      </div>
    </div>
  );
}
