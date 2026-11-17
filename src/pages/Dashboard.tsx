import { CheckCircle2, Circle, Clock, ListTodo, Sparkles, TrendingUp } from 'lucide-react';
import { ProgressRing } from '@/components/ProgressRing';
import type { StudySpace } from '@/hooks/useStudySpace';
import { useDerived } from '@/utils/stats';
import { formatDueLabel, formatLongDate, isOverdue, todayISO } from '@/utils/date';
interface DashboardProps {
  data: StudySpace;
  onNavigate: (page: 'tasks' | 'study' | 'timer' | 'analytics') => void;
}

export function Dashboard({ data, onNavigate }: DashboardProps) {
  const d = useDerived(data.tasks, data.sessions);
  const upcoming = data.tasks
    .filter((t) => !t.completed)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || b.priority.localeCompare(a.priority))
    .slice(0, 5);

  const todaysFocus = data.tasks.filter((t) => t.dueDate === todayISO() && !t.completed);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="page-title">
          Welcome back, <span className="bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">{data.settings.name}</span>!
        </h1>
        <p className="page-subtitle">{formatLongDate(todayISO())}</p>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="stat-card animate-fade-up">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Total Tasks</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
                {d.totalTasks}
              </p>
            </div>
            <div
              className="tooltip flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-transform duration-200 hover:scale-110"
              data-tip="All tasks in your list"
            >
              <ListTodo size={22} />
            </div>
          </div>
        </div>

        <div className="stat-card animate-fade-up stagger-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Completed Tasks</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
                {d.completedTasks}
              </p>
            </div>
            <div
              className="tooltip flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform duration-200 hover:scale-110"
              data-tip="Tasks you've finished"
            >
              <CheckCircle2 size={22} />
            </div>
          </div>
        </div>

        <div className="stat-card animate-fade-up stagger-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Study Hours</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
                {Math.round(d.hoursTotal * 10) / 10}
                <span className="ml-1 text-base font-bold text-slate-400">total</span>
              </p>
              <p className="text-xs font-medium text-slate-500">
                {Math.round(d.hoursToday * 10) / 10}h today
              </p>
            </div>
            <div
              className="tooltip flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600 transition-transform duration-200 hover:scale-110"
              data-tip="Total across all subjects"
            >
              <Clock size={22} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Daily progress + productivity */}
        <div className="card card-lift animate-fade-up stagger-1 flex flex-col items-center gap-4 p-6">
          <h2 className="section-title self-start">Daily Productivity Score</h2>
          <ProgressRing value={d.score} sublabel="today" />
          <p className="text-center text-sm leading-relaxed text-slate-500">
            Based on {d.todaysCompleted} of {d.todaysTasks.length} tasks done and{' '}
            {Math.round(d.hoursToday * 10) / 10}h studied today.
          </p>
        </div>

        {/* Today's Focus */}
        <div className="card card-lift animate-fade-up stagger-2 p-6 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-600" />
              Today's Focus
            </h2>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-sm font-semibold text-indigo-600 transition-colors hover:text-indigo-800"
            >
              View all tasks
            </button>
          </div>

          {todaysFocus.length === 0 ? (
            <div className="empty-state mt-6">
              <div className="empty-icon">
                <CheckCircle2 size={24} />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-700">
                Nothing due today — you're all caught up!
              </p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
                Plan ahead or log a study session to keep the momentum going.
              </p>
            </div>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {todaysFocus.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 transition-colors hover:bg-indigo-50/60"
                >
                  <Circle size={16} className="shrink-0 text-indigo-500" />
                  <span className="flex-1 truncate text-sm font-semibold text-slate-800">
                    {t.title}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      t.priority === 'High'
                        ? 'bg-rose-100 text-rose-700'
                        : t.priority === 'Medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {t.priority}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Upcoming */}
      <div className="card card-lift animate-fade-up stagger-3 p-6">
        <div className="flex items-center justify-between">
          <h2 className="section-title flex items-center gap-2">
            <TrendingUp size={18} className="text-indigo-600" />
            Upcoming Tasks
          </h2>
          <button
            onClick={() => onNavigate('timer')}
            className="text-sm font-semibold text-indigo-600 transition-colors hover:text-indigo-800"
          >
            Start a focus session
          </button>
        </div>

        {upcoming.length === 0 ? (
          <div className="empty-state mt-4">
            <div className="empty-icon">
              <TrendingUp size={24} />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-700">No pending tasks</p>
            <p className="mt-1 text-xs text-slate-500">
              Add one from the My Tasks page to see it here.
            </p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {upcoming.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-3">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    t.priority === 'High'
                      ? 'bg-rose-500'
                      : t.priority === 'Medium'
                        ? 'bg-amber-500'
                        : 'bg-slate-400'
                  }`}
                />
                <span className="flex-1 truncate text-sm font-medium text-slate-800">{t.title}</span>
                <span className="text-xs font-medium text-slate-500">{t.subject}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    isOverdue(t.dueDate)
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-indigo-50 text-indigo-700'
                  }`}
                >
                  {formatDueLabel(t.dueDate)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
