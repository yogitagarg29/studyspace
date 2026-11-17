import {
  CheckCircle2,
  Circle,
  Clock,
  ListTodo,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { ProgressRing } from '@/components/ProgressRing';
import type { StudySpace } from '@/hooks/useStudySpace';
import { useDerived } from '@/utils/stats';
import { formatDueLabel, formatLongDate, isOverdue, todayISO } from '@/utils/date';
import { subjectColor } from '@/types';

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
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const stats = [
    {
      label: 'Total Tasks',
      value: d.totalTasks,
      sub: `${d.pendingTasks} pending`,
      icon: ListTodo,
      gradient: 'from-violet-500 to-purple-600',
      shadow: 'shadow-violet-500/30',
      tip: 'All tasks in your list',
    },
    {
      label: 'Completed',
      value: d.completedTasks,
      sub: `${d.totalTasks > 0 ? Math.round((d.completedTasks / d.totalTasks) * 100) : 0}% done`,
      icon: CheckCircle2,
      gradient: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/30',
      tip: 'Tasks you have finished',
    },
    {
      label: 'Study Hours',
      value: Math.round(d.hoursTotal * 10) / 10,
      sub: `${Math.round(d.hoursToday * 10) / 10}h today`,
      icon: Clock,
      gradient: 'from-sky-500 to-blue-600',
      shadow: 'shadow-sky-500/30',
      tip: 'Total across all subjects',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome hero */}
      <section className="hero animate-fade-up">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-300">
              {formatLongDate(todayISO())}
            </p>
            <h1 className="font-display mt-2 text-2xl font-extrabold tracking-tight sm:text-4xl">
              {greeting},{' '}
              <span className="bg-gradient-to-r from-violet-300 to-sky-300 bg-clip-text text-transparent">
                {data.settings.name}
              </span>
              !
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-300">
              {d.todaysTasks.length > 0
                ? `You have ${d.todaysTasks.length} task${d.todaysTasks.length > 1 ? 's' : ''} due today and ${Math.round(d.hoursToday * 10) / 10}h of study logged.`
                : 'No tasks due today — a perfect moment to get ahead or log a study session.'}
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <button onClick={() => onNavigate('timer')} className="btn-primary">
                <Flame size={16} />
                Start Focus Session
              </button>
              <button
                onClick={() => onNavigate('tasks')}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur transition-all duration-200 hover:bg-white/15 hover:shadow-lg active:scale-[0.97]"
              >
                View Tasks
                <ArrowRight size={15} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ProgressRing value={d.score} sublabel="today" />
          </div>
        </div>
      </section>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s, i) => (
          <div key={s.label} className={`stat-card animate-fade-up stagger-${i + 1}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold muted">{s.label}</p>
                <p className="font-display mt-1 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {s.value}
                </p>
                <p className="mt-0.5 text-xs font-medium text-slate-400 dark:text-slate-500">
                  {s.sub}
                </p>
              </div>
              <div
                className={`tooltip grad-icon bg-gradient-to-br ${s.gradient} shadow-lg transition-transform duration-200 hover:scale-110 ${s.shadow}`}
                data-tip={s.tip}
              >
                <s.icon size={21} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Daily progress */}
        <div className="card card-lift animate-fade-up stagger-1 flex flex-col p-6">
          <h2 className="section-title flex items-center gap-2">
            <TrendingUp size={18} className="text-violet-500" />
            Daily Progress
          </h2>

          <div className="mt-5 space-y-5">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Tasks today
                </span>
                <span className="font-bold text-slate-500 dark:text-slate-400">
                  {d.todaysCompleted}/{d.todaysTasks.length}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-900/10 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                  style={{
                    width: `${
                      d.todaysTasks.length > 0
                        ? (d.todaysCompleted / d.todaysTasks.length) * 100
                        : 0
                    }%`,
                    transition: 'width 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Study goal (4h)
                </span>
                <span className="font-bold text-slate-500 dark:text-slate-400">
                  {Math.round(d.hoursToday * 10) / 10}h
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-900/10 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400"
                  style={{
                    width: `${Math.min((d.hoursToday / 4) * 100, 100)}%`,
                    transition: 'width 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-gradient-to-r from-violet-500/10 to-sky-500/10 p-4 ring-1 ring-violet-500/15">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {d.score >= 70
                ? 'Excellent pace today — keep it up!'
                : d.score >= 40
                  ? 'Solid progress. A short focus session would boost your score.'
                  : 'Ease into the day with one small task or a 25-minute timer.'}
            </p>
          </div>
        </div>

        {/* Today's Focus */}
        <div className="card card-lift animate-fade-up stagger-2 p-6 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2">
              <Sparkles size={18} className="text-violet-500" />
              Today's Focus
            </h2>
            <button
              onClick={() => onNavigate('tasks')}
              className="group flex items-center gap-1 text-sm font-semibold text-violet-600 transition-colors hover:text-violet-500 dark:text-violet-400"
            >
              View all tasks
              <ArrowRight
                size={14}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </button>
          </div>

          {todaysFocus.length === 0 ? (
            <div className="empty-state mt-4">
              <div className="empty-icon">
                <CheckCircle2 size={24} />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Nothing due today — you're all caught up!
              </p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed muted">
                Plan ahead or log a study session to keep the momentum going.
              </p>
            </div>
          ) : (
            <ul className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {todaysFocus.map((t) => (
                <li
                  key={t.id}
                  className="group flex items-center gap-3 rounded-xl bg-white/60 p-3.5 ring-1 ring-slate-900/5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-lg hover:shadow-violet-900/10 hover:ring-violet-300 dark:bg-white/[0.04] dark:ring-white/10 dark:hover:bg-white/[0.08] dark:hover:ring-violet-400/30"
                >
                  <span
                    className={`h-9 w-1.5 shrink-0 rounded-full bg-gradient-to-b ${subjectColor(t.subject)}`}
                  />
                  <button
                    onClick={() => data.updateTask(t.id, { completed: true })}
                    aria-label="Mark as completed"
                    className="shrink-0 text-slate-300 transition-all duration-200 hover:scale-110 hover:text-emerald-500 active:scale-90 dark:text-slate-600"
                  >
                    <Circle size={20} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {t.title}
                    </p>
                    <p className="text-xs font-medium muted">{t.subject}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      t.priority === 'High'
                        ? 'bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20 dark:text-rose-400'
                        : t.priority === 'Medium'
                          ? 'bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400'
                          : 'bg-slate-500/10 text-slate-600 ring-1 ring-slate-500/20 dark:text-slate-400'
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
            <TrendingUp size={18} className="text-violet-500" />
            Upcoming Tasks
          </h2>
        </div>

        {upcoming.length === 0 ? (
          <div className="empty-state mt-4">
            <div className="empty-icon">
              <TrendingUp size={24} />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
              No pending tasks
            </p>
            <p className="mt-1 text-xs muted">
              Add one from the My Tasks page to see it here.
            </p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-slate-900/5 dark:divide-white/5">
            {upcoming.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-violet-500/5"
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    t.priority === 'High'
                      ? 'bg-rose-500'
                      : t.priority === 'Medium'
                        ? 'bg-amber-500'
                        : 'bg-slate-400'
                  }`}
                />
                <span className="flex-1 truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                  {t.title}
                </span>
                <span className="hidden text-xs font-medium muted sm:inline">{t.subject}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    isOverdue(t.dueDate)
                      ? 'bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20 dark:text-rose-400'
                      : 'bg-violet-500/10 text-violet-600 ring-1 ring-violet-500/20 dark:text-violet-300'
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
