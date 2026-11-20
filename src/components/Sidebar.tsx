import {
  BarChart3,
  BookOpenCheck,
  LayoutDashboard,
  ListTodo,
  Timer,
  GraduationCap,
  BrainCircuit,
  X,
  Moon,
  Sun,
} from 'lucide-react';
import type { Theme } from '@/hooks/useTheme';

export type PageId = 'dashboard' | 'tasks' | 'study' | 'timer' | 'analytics' | 'buddy';

const NAV_ITEMS: { id: PageId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tasks', label: 'My Tasks', icon: ListTodo },
  { id: 'study', label: 'Study Tracker', icon: BookOpenCheck },
  { id: 'timer', label: 'Focus Timer', icon: Timer },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'buddy', label: 'MindSpark AI', icon: BrainCircuit },
];

interface SidebarProps {
  page: PageId;
  onNavigate: (page: PageId) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

export function Sidebar({
  page,
  onNavigate,
  mobileOpen,
  onCloseMobile,
  theme,
  onToggleTheme,
}: SidebarProps) {
  const nav = (
    <nav className="flex flex-1 flex-col gap-1.5 px-4">
      <p className="px-3.5 pb-2 pt-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500">
        Menu
      </p>
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const active = page === id;
        return (
          <button
            key={id}
            onClick={() => {
              onNavigate(id);
              onCloseMobile();
            }}
            className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
              active
                ? 'bg-gradient-to-r from-violet-600/90 to-indigo-600/90 text-white shadow-lg shadow-violet-950/50'
                : 'text-slate-400 hover:bg-white/5 hover:text-white active:scale-[0.98]'
            }`}
          >
            {active && (
              <span className="absolute -left-4 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-violet-400 to-sky-400" />
            )}
            <Icon
              size={18}
              strokeWidth={2.2}
              className={`shrink-0 transition-transform duration-200 ${
                active ? 'scale-110' : 'group-hover:scale-110'
              }`}
            />
            {label}
          </button>
        );
      })}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-3 px-6 py-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-indigo-500 to-sky-500 shadow-lg shadow-violet-950/50">
        <GraduationCap size={20} className="text-white" strokeWidth={2.2} />
      </div>
      <div>
        <p className="font-display text-base font-extrabold tracking-tight text-white">
          STUDY<span className="text-violet-300">SPACE</span>
        </p>
        <p className="text-[11px] font-medium text-slate-400">Productivity Dashboard</p>
      </div>
    </div>
  );

  const footer = (
    <div className="px-4 pb-6 pt-2">
      <button
        onClick={onToggleTheme}
        className="group flex w-full items-center justify-between rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10 transition-all duration-200 hover:bg-white/10 active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          {theme === 'dark' ? (
            <Moon size={16} className="text-violet-300" />
          ) : (
            <Sun size={16} className="text-amber-300" />
          )}
          <span className="text-xs font-semibold text-slate-300">
            {theme === 'dark' ? 'Dark mode' : 'Light mode'}
          </span>
        </div>
        <span
          className={`relative h-5 w-9 rounded-full transition-colors duration-300 ${
            theme === 'dark' ? 'bg-violet-500' : 'bg-slate-600'
          }`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-300 ${
              theme === 'dark' ? 'left-[18px]' : 'left-0.5'
            }`}
          />
        </span>
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col lg:flex"
        style={{
          background: 'linear-gradient(180deg, #0d1226 0%, #141433 55%, #1c1440 100%)',
        }}
      >
        {brand}
        <div className="mx-4 border-t border-white/10" />
        {nav}
        {footer}
      </aside>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${mobileOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!mobileOpen}
      >
        <div
          className={`absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-200 ${
            mobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={onCloseMobile}
        />
        <aside
          className={`absolute inset-y-0 left-0 flex w-72 flex-col shadow-2xl transition-transform duration-300 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{
            background: 'linear-gradient(180deg, #0d1226 0%, #141433 55%, #1c1440 100%)',
          }}
        >
          <button
            onClick={onCloseMobile}
            className="absolute right-3 top-4 rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
          {brand}
          <div className="mx-4 border-t border-white/10" />
          {nav}
          {footer}
        </aside>
      </div>
    </>
  );
}
