import { useState, useMemo } from 'react';
import { CalendarCheck, Clock, Flame, TrendingUp, Sparkles, Target, BarChart2 } from 'lucide-react';
import type { StudySpace } from '@/hooks/useStudySpace';
import { useDerived } from '@/utils/stats';
import { subjectColor } from '@/types';

interface AnalyticsProps {
  data: StudySpace;
}

const BAR_COLORS = [
  'from-violet-500 to-indigo-500',
  'from-indigo-500 to-blue-500',
  'from-sky-500 to-cyan-400',
  'from-violet-500 to-purple-500',
  'from-indigo-500 to-sky-400',
  'from-violet-600 to-indigo-500',
  'from-sky-500 to-blue-600',
];

export function Analytics({ data }: AnalyticsProps) {
  const d = useDerived(data.tasks, data.sessions);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const maxHours = Math.max(...d.weekHours.map((day) => day.hours), 4);
  const totalWeekHours = d.weekHours.reduce((sum, day) => sum + day.hours, 0);
  const avgHours = totalWeekHours / 7;
  const bestDay = d.weekHours.reduce(
    (best, day) => (day.hours > best.hours ? day : best),
    d.weekHours[0] ?? { label: '—', hours: 0 },
  );

  const subjectShare = useMemo(() => {
    const totals = new Map<string, number>();
    for (const s of data.sessions) totals.set(s.subject, (totals.get(s.subject) ?? 0) + s.hours);
    return [...totals.entries()]
      .map(([subject, hours]) => ({ subject, hours }))
      .filter((s) => s.hours > 0)
      .sort((a, b) => b.hours - a.hours);
  }, [data.sessions]);

  const maxSubject = Math.max(...subjectShare.map((s) => s.hours), 1);
  const totalSubjectHours = Math.max(subjectShare.reduce((acc, s) => acc + s.hours, 0), 0.1);

  const summary = useMemo(() => {
    const parts: string[] = [];
    if (totalWeekHours > 0) {
      parts.push(
        `You completed ${Math.round(totalWeekHours * 10) / 10} hours of study this week, averaging ${Math.round(avgHours * 10) / 10}h per day.`,
      );
      if (bestDay.hours > 0) {
        parts.push(`Your peak study day was ${bestDay.label} with ${Math.round(bestDay.hours * 10) / 10}h.`);
      }
    } else {
      parts.push('No study hours logged in the past 7 days yet.');
    }
    parts.push(`${d.weekCompleted} assignments were completed this week.`);
    if (d.pendingTasks > 0) {
      parts.push(`You still have ${d.pendingTasks} pending tasks to finish.`);
    }
    return parts.join(' ');
  }, [totalWeekHours, avgHours, bestDay, d.weekCompleted, d.pendingTasks]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="page-title">Weekly Analytics</h1>
        <p className="page-subtitle">
          Detailed breakdown of your study duration, assignment completions, and subject focus.
        </p>
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="stat-card animate-fade-up">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider muted">This Week</p>
              <p className="font-display mt-1 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {Math.round(totalWeekHours * 10) / 10}h
              </p>
              <p className="mt-0.5 text-xs text-slate-400">Total study volume</p>
            </div>
            <div
              className="tooltip flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 transition-transform duration-200 hover:scale-110 dark:bg-indigo-500/20 dark:text-indigo-300"
              data-tip="Last 7 days"
            >
              <Clock size={22} />
            </div>
          </div>
        </div>

        <div className="stat-card animate-fade-up stagger-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider muted">Daily Average</p>
              <p className="font-display mt-1 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {Math.round(avgHours * 10) / 10}h
              </p>
              <p className="mt-0.5 text-xs text-slate-400">Across 7 days</p>
            </div>
            <div
              className="tooltip flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 transition-transform duration-200 hover:scale-110 dark:bg-sky-500/20 dark:text-sky-300"
              data-tip="Average study pace"
            >
              <BarChart2 size={22} />
            </div>
          </div>
        </div>

        <div className="stat-card animate-fade-up stagger-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider muted">Tasks Done</p>
              <p className="font-display mt-1 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {d.weekCompleted}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">Due within the week</p>
            </div>
            <div
              className="tooltip flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 transition-transform duration-200 hover:scale-110 dark:bg-emerald-500/20 dark:text-emerald-400"
              data-tip="Completed tasks"
            >
              <CalendarCheck size={22} />
            </div>
          </div>
        </div>

        <div className="stat-card animate-fade-up stagger-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider muted">Peak Day</p>
              <p className="font-display mt-1 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {bestDay.label}
                <span className="ml-1 text-sm font-bold text-slate-400">
                  ({Math.round(bestDay.hours * 10) / 10}h)
                </span>
              </p>
              <p className="mt-0.5 text-xs text-slate-400">Most productive session</p>
            </div>
            <div
              className="tooltip flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 transition-transform duration-200 hover:scale-110 dark:bg-amber-500/20 dark:text-amber-400"
              data-tip="Best day"
            >
              <Flame size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Interactive Bar Chart */}
      <div className="card card-lift animate-fade-up stagger-1 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="section-title flex items-center gap-2">
              <TrendingUp size={18} className="text-violet-500" />
              Study Hours — Last 7 Days
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Hover over any day column to see logged duration
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-violet-600 dark:text-violet-300">
            <Target size={14} />
            <span>Target: 4.0h/day</span>
          </div>
        </div>

        <div className="relative mt-8 flex h-52 items-end justify-between gap-3 sm:gap-6 border-b border-slate-900/10 pb-2 dark:border-white/10">
          {d.weekHours.map((day, i) => {
            const isHovered = hoveredDay === i;
            const heightPercent = Math.max((day.hours / maxHours) * 100, day.hours > 0 ? 8 : 3);
            return (
              <div
                key={day.label + i}
                onMouseEnter={() => setHoveredDay(i)}
                onMouseLeave={() => setHoveredDay(null)}
                className="group relative flex flex-1 flex-col items-center justify-end h-full cursor-pointer"
              >
                {/* Floating tooltip */}
                {isHovered && (
                  <div className="absolute -top-10 z-20 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white shadow-xl animate-fade-in dark:bg-white dark:text-slate-900">
                    {day.hours > 0 ? `${day.hours}h logged` : 'No study logged'}
                  </div>
                )}

                <div className="flex w-full max-w-14 flex-1 items-end">
                  <div
                    className={`w-full rounded-t-xl bg-gradient-to-t transition-all duration-300 ${
                      BAR_COLORS[i % BAR_COLORS.length]
                    } ${isHovered ? 'scale-x-105 brightness-110 shadow-lg' : ''}`}
                    style={{
                      height: `${heightPercent}%`,
                      transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                      opacity: day.hours > 0 ? 1 : 0.3,
                    }}
                  />
                </div>
                <span
                  className={`mt-2 text-xs font-bold transition-colors ${
                    isHovered
                      ? 'text-violet-600 dark:text-violet-300'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Weekly Performance Summary */}
        <div className="card card-lift animate-fade-up stagger-2 p-6">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-violet-500" />
            <h2 className="section-title">Weekly Performance Summary</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{summary}</p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gradient-to-br from-violet-500/10 to-sky-500/10 p-4 ring-1 ring-violet-500/15">
              <p className="text-xs font-semibold muted">Task Completion Rate</p>
              <p className="font-display mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
                {d.totalTasks > 0
                  ? Math.round((d.completedTasks / d.totalTasks) * 100)
                  : 100}
                %
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {d.completedTasks} of {d.totalTasks} completed
              </p>
            </div>

            <div className="rounded-xl bg-gradient-to-br from-violet-500/10 to-sky-500/10 p-4 ring-1 ring-violet-500/15">
              <p className="text-xs font-semibold muted">Productivity Score</p>
              <p className="font-display mt-1 text-2xl font-extrabold text-violet-600 dark:text-violet-300">
                {d.score}%
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">Combined tasks & hours</p>
            </div>
          </div>
        </div>

        {/* Hours by Subject */}
        <div className="card card-lift animate-fade-up stagger-3 p-6">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Hours by Subject</h2>
            <span className="text-xs font-semibold muted">{subjectShare.length} subjects</span>
          </div>

          {subjectShare.length === 0 ? (
            <div className="empty-state mt-4">
              <div className="empty-icon">
                <TrendingUp size={24} />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                No study data logged yet
              </p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
                Log study hours to see your subject breakdown chart.
              </p>
            </div>
          ) : (
            <ul className="mt-5 space-y-4">
              {subjectShare.map(({ subject, hours }) => {
                const percentage = Math.round((hours / totalSubjectHours) * 100);
                return (
                  <li key={subject} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                        <span
                          className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${subjectColor(
                            subject,
                          )}`}
                        />
                        {subject}
                      </span>
                      <span className="font-bold text-slate-600 dark:text-slate-300">
                        {Math.round(hours * 10) / 10}h ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-900/10 dark:bg-white/10">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${subjectColor(subject)}`}
                        style={{ width: `${(hours / maxSubject) * 100}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
