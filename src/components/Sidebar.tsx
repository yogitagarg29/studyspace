import {
  BarChart3,
  BookOpenCheck,
  LayoutDashboard,
  ListTodo,
  Timer,
  GraduationCap,
  X,
} from 'lucide-react';

export type PageId = 'dashboard' | 'tasks' | 'study' | 'timer' | 'analytics';

const NAV_ITEMS: { id: PageId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tasks', label: 'My Tasks', icon: ListTodo },
  { id: 'study', label: 'Study Tracker', icon: BookOpenCheck },
  { id: 'timer', label: 'Focus Timer', icon: Timer },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

interface SidebarProps {
  page: PageId;
  onNavigate: (page: PageId) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ page, onNavigate, mobileOpen, onCloseMobile }: SidebarProps) {
  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const active = page === id;
        return (
          <button
            key={id}
            onClick={() => {
              onNavigate(id);
              onCloseMobile();
            }}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors duration-200 ${
              active
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Icon size={18} strokeWidth={2.2} />
            {label}
          </button>
        );
      })}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-3 px-6 py-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 shadow-lg shadow-indigo-950/40">
        <GraduationCap size={20} className="text-white" strokeWidth={2.2} />
      </div>
      <div>
        <p className="text-base font-extrabold tracking-tight text-white">STUDYSPACE</p>
        <p className="text-[11px] font-medium text-slate-400">Productivity Dashboard</p>
      </div>
    </div>
  );

  const footer = (
    <div className="px-6 pb-6 pt-2">
      <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
        <p className="text-xs font-semibold text-white">Stay consistent</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">
          Small daily sessions beat last-minute cramming.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-[#0f172a] lg:flex">
        {brand}
        {nav}
        {footer}
      </aside>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${mobileOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!mobileOpen}
      >
        <div
          className={`absolute inset-0 bg-slate-900/60 transition-opacity duration-200 ${
            mobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={onCloseMobile}
        />
        <aside
          className={`absolute inset-y-0 left-0 flex w-72 flex-col bg-[#0f172a] shadow-2xl transition-transform duration-300 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <button
            onClick={onCloseMobile}
            className="absolute right-3 top-4 rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
          {brand}
          {nav}
          {footer}
        </aside>
      </div>
    </>
  );
}
