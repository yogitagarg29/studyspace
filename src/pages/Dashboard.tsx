import { useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  ListTodo,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Flame,
  Bot,
  Calendar,
  Plus,
  BookOpen,
} from 'lucide-react';
import { ProgressRing } from '@/components/ProgressRing';
import type { StudySpace } from '@/hooks/useStudySpace';
import { useDerived } from '@/utils/stats';
import { formatDueLabel, formatLongDate, isOverdue, todayISO, toISODate, addDays } from '@/utils/date';
import { subjectColor } from '@/types';

interface DashboardProps {
  data: StudySpace;
  onNavigate: (page: 'tasks' | 'study' | 'timer' | 'analytics' | 'buddy') => void;
}

export function Dashboard({ data, onNavigate }: DashboardProps) {
  const d = useDerived(data.tasks, data.sessions);

  const upcoming = useMemo(() => {
    return data.tasks
      .filter((t) => !t.completed)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || b.priority.localeCompare(a.priority))
      .slice(0, 5);
  }, [data.tasks]);

  const todaysFocus = useMemo(() => {
    return data.tasks.filter((t) => t.dueDate === todayISO() && !t.completed);
  }, [data.tasks]);

  // Compute consecutive study streak
  const streak = useMemo(() => {
    let count = 0;
    let checkDate = new Date();
    const sessionDates = new Set(data.sessions.map((s) => s.date));
    const todayStr = toISODate(checkDate);
    if (!sessionDates.has(todayStr)) {
      checkDate = addDays(checkDate, -1);
    }
    while (sessionDates.has(toISODate(checkDate))) {
      count++;
      checkDate = addDays(checkDate, -1);
    }
    return count;
  }, [data.sessions]);

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
      tip: 'All academic tasks',
    },
    {
      label: 'Completed',
      value: d.completedTasks,
      sub: `${d.totalTasks > 0 ? Math.round((d.completedTasks / d.totalTasks) * 100) : 0}% completion`,
      icon: CheckCircle2,
      gradient: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/30',
      tip: 'Finished tasks',
    },
    {
      label: 'Study Hours',
      value: Math.round(d.hoursTotal * 10) / 10,
      sub: `${Math.round(d.hoursToday * 10) / 10}h logged today`,
      icon: Clock,
      gradient: 'from-sky-500 to-blue-600',
      shadow: 'shadow-sky-500/30',
      tip: 'Total logged hours',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <section className="hero animate-fade-up">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-300 ring-1 ring-white/15 backdrop-blur-sm">
                <Calendar size={13} />
                {formatLongDate(todayISO())}
              </span>
              {streak > 0 && (
                <span className="flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300 ring-1 ring-amber-400/30">
                  <Flame size={13} className="text-amber-400" />
                  {streak} day streak
                </span>
              )}
            </div>

            <h1 className="font-display mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
              {greeting},{' '}
              <span className="bg-gradient-to-r from-violet-300 via-sky-200 to-sky-300 bg-clip-text text-transparent">
                {data.settings.name}
              </span>
              !
            </h1>

            <p className="mt-2.5 text-sm leading-relaxed text-slate-200/90 sm:text-base">
              {d.todaysTasks.length > 0
                ? `You have ${d.todaysTasks.length} task${
                    d.todaysTasks.length > 1 ? 's' : ''
                  } due today and ${Math.round(d.hoursToday * 10) / 10}h of study logged. Let's make today productive!`
                : 'All caught up on today’s deadlines. Ready to start a focus timer or ask StudyBuddy AI?'}
            </p>

            {/* Quick Actions */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => onNavigate('timer')} className="btn-primary">
                <Flame size={16} />
                Start Focus Session
              </button>

              <button
                onClick={() => onNavigate('tasks')}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur transition-all duration-200 hover:bg-white/15 hover:shadow-lg active:scale-[0.97]"
              >
                <Plus size={15} />
                Manage Tasks
              </button>

              <button
                onClick={() => onNavigate('buddy')}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-500/20 px-4 py-2.5 text-sm font-semibold text-violet-200 ring-1 ring-violet-400/30 backdrop-blur transition-all duration-200 hover:bg-violet-500/30 active:scale-[0.97]"
              >
                <Bot size={15} />
                StudyBuddy AI
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ProgressRing value={d.score} sublabel="daily score" />
          </div>
        </div>
      </section>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s, i) => (
          <div key={s.label} className={`stat-card animate-fade-up stagger-${i + 1}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider muted">{s.label}</p>
                <p className="font-display mt-1 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {s.value}
                </p>
                <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
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
        {/* Daily Progress */}
        <div className="card card-lift animate-fade-up stagger-1 flex flex-col p-6">
          <h2 className="section-title flex items-center gap-2">
            <TrendingUp size={18} className="text-violet-500" />
            Today's Target Pace
          </h2>

          <div className="mt-5 space-y-5">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">Tasks Completed</span>
                <span className="font-bold text-slate-500 dark:text-slate-400">
                  {d.todaysCompleted} / {d.todaysTasks.length} ({d.todaysTasks.length > 0 ? Math.round((d.todaysCompleted / d.todaysTasks.length) * 100) : 100}%)
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
              <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">Study Goal (4.0 hours)</span>
                <span className="font-bold text-slate-500 dark:text-slate-400">
                  {Math.round(d.hoursToday * 10) / 10}h / 4h ({Math.min(Math.round((d.hoursToday / 4) * 100), 100)}%)
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
            <p className="text-xs leading-relaxed font-semibold text-slate-700 dark:text-slate-300">
              {d.score >= 70
                ? '⭐ Excellent pace today — you are crushing your academic goals!'
                : d.score >= 40
                  ? '⚡ Good progress! A 25-minute Pomodoro session will boost your score.'
                  : '💡 Start with one small task or a quick 15-minute study session to build momentum.'}
            </p>
          </div>
        </div>

        {/* Today's Focus List */}
        <div className="card card-lift animate-fade-up stagger-2 p-6 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2">
              <Sparkles size={18} className="text-violet-500" />
              Today's Focus Tasks
            </h2>
            <button
              onClick={() => onNavigate('tasks')}
              className="group flex items-center gap-1 text-xs font-bold text-violet-600 transition-colors hover:text-violet-500 dark:text-violet-400"
            >
              All tasks
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
              <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                Nothing due today — you're completely caught up!
              </p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed muted">
                Plan ahead for upcoming exams or log a study session to keep your streak alive.
              </p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => onNavigate('tasks')} className="btn-secondary !py-1.5 text-xs">
                  Plan Next Tasks
                </button>
                <button onClick={() => onNavigate('study')} className="btn-primary !py-1.5 text-xs">
                  <BookOpen size={13} />
                  Log Study Hours
                </button>
              </div>
            </div>
          ) : (
            <ul className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {todaysFocus.map((t) => (
                <li
                  key={t.id}
                  className="group flex items-center gap-3 rounded-xl bg-white/70 p-3.5 ring-1 ring-slate-900/5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-lg hover:shadow-violet-900/10 hover:ring-violet-300 dark:bg-white/[0.04] dark:ring-white/10 dark:hover:bg-white/[0.08] dark:hover:ring-violet-400/30"
                >
                  <span
                    className={`h-9 w-1.5 shrink-0 rounded-full bg-gradient-to-b ${subjectColor(
                      t.subject,
                    )}`}
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

      {/* Upcoming Tasks Section */}
      <div className="card card-lift animate-fade-up stagger-3 p-6">
        <div className="flex items-center justify-between">
          <h2 className="section-title flex items-center gap-2">
            <Clock size={18} className="text-violet-500" />
            Upcoming Academic Deadlines
          </h2>
          <button
            onClick={() => onNavigate('tasks')}
            className="text-xs font-semibold text-violet-600 hover:underline dark:text-violet-400"
          >
            View all ({d.pendingTasks} pending)
          </button>
        </div>

        {upcoming.length === 0 ? (
          <div className="empty-state mt-4">
            <div className="empty-icon">
              <TrendingUp size={24} />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
              No pending tasks on your calendar
            </p>
            <p className="mt-1 text-xs muted">
              Add upcoming assignments or exam milestones from My Tasks.
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
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    t.priority === 'High'
                      ? 'bg-rose-500'
                      : t.priority === 'Medium'
                        ? 'bg-amber-500'
                        : 'bg-slate-400'
                  }`}
                />
                <span className="flex-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
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
