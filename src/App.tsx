import { useEffect, useState } from 'react';
import { GraduationCap, Menu, Moon, Sun } from 'lucide-react';
import { Sidebar, type PageId } from '@/components/Sidebar';
import { Dashboard } from '@/pages/Dashboard';
import { Tasks } from '@/pages/Tasks';
import { StudyTracker } from '@/pages/StudyTracker';
import { Pomodoro } from '@/pages/Pomodoro';
import { Analytics } from '@/pages/Analytics';
import { useStudySpace } from '@/hooks/useStudySpace';
import { useTheme } from '@/hooks/useTheme';

const VALID_PAGES: PageId[] = ['dashboard', 'tasks', 'study', 'timer', 'analytics'];

function pageFromHash(): PageId {
  const hash = window.location.hash.replace('#/', '') as PageId;
  return VALID_PAGES.includes(hash) ? hash : 'dashboard';
}

export default function App() {
  const data = useStudySpace();
  const { theme, toggle: toggleTheme } = useTheme();
  const [page, setPage] = useState<PageId>(pageFromHash);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pageKey, setPageKey] = useState(0);

  useEffect(() => {
    const onHashChange = () => setPage(pageFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (next: PageId) => {
    window.location.hash = `#/${next}`;
    setPage(next);
    setPageKey((k) => k + 1);
    window.scrollTo({ top: 0 });
  };

  const currentPage = VALID_PAGES.includes(page) ? page : 'dashboard';

  return (
    <div className="app-bg min-h-screen transition-colors duration-300">
      <Sidebar
        page={currentPage}
        onNavigate={navigate}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <div className="lg:pl-64">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-900/5 bg-white/70 px-4 py-3 backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.03] lg:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/10"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 via-indigo-500 to-sky-500 shadow-md shadow-violet-600/25">
                <GraduationCap size={16} className="text-white" />
              </div>
              <span className="font-display text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
                STUDY<span className="text-violet-500 dark:text-violet-300">SPACE</span>
              </span>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/10"
          >
            {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div key={pageKey} className="animate-fade-in">
            {currentPage === 'dashboard' && <Dashboard data={data} onNavigate={navigate} />}
            {currentPage === 'tasks' && <Tasks data={data} />}
            {currentPage === 'study' && <StudyTracker data={data} />}
            {currentPage === 'timer' && <Pomodoro />}
            {currentPage === 'analytics' && <Analytics data={data} />}
          </div>
        </main>
      </div>
    </div>
  );
}
