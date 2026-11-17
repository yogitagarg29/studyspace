import { CalendarCheck, Clock, Flame, TrendingUp } from 'lucide-react';
import type { StudySpace } from '@/hooks/useStudySpace';
import { useDerived } from '@/utils/stats';
import { SUBJECTS } from '@/types';

interface AnalyticsProps {
  data: StudySpace;
}

const BAR_COLORS = [
  'from-indigo-500 to-indigo-400',
  'from-indigo-500 to-sky-400',
  'from-sky-500 to-sky-400',
  'from-indigo-500 to-indigo-400',
  'from-sky-500 to-indigo-400',
  'from-indigo-500 to-sky-400',
  'from-sky-500 to-sky-400',
];

export function Analytics({ data }: AnalyticsProps) {
  const d = useDerived(data.tasks, data.sessions);

  const maxHours = Math.max(...d.weekHours.map((day) => day.hours), 1);
  const totalWeekHours = d.weekHours.reduce((sum, day) => sum + day.hours, 0);
  const avgHours = totalWeekHours / 7;
  const bestDay = d.weekHours.reduce(
    (best, day) => (day.hours > best.hours ? day : best),
    d.weekHours[0] ?? { label: '—', hours: 0 },
  );

  const subjectShare = (() => {
    const totals = new Map<string, number>();
    for (const s of data.sessions) totals.set(s.subject, (totals.get(s.subject) ?? 0) + s.hours);
    const weekIsos = new Set(d.weekHours.map((_, i) => i)); // index unused; use subjects overall
    void weekIsos;
    return SUBJECTS.map((subject) => ({ subject, hours: totals.get(subject) ?? 0 })).filter(
      (s) => s.hours > 0,
    );
  })();
  const maxSubject = Math.max(...subjectShare.map((s) => s.hours), 1);

  const summary = (() => {
    const parts: string[] = [];
    if (totalWeekHours > 0) {
      parts.push(
        `You studied ${Math.round(totalWeekHours * 10) / 10} hours this week — an average of ${Math.round(avgHours * 10) / 10}h per day.`,
      );
      if (bestDay.hours > 0) parts.push(`Your strongest day was ${bestDay.label}.`);
    }
    parts.push(`${d.weekCompleted} tasks were completed during the week.`);
    if (d.pendingTasks > 0) parts.push(`${d.pendingTasks} still pending — schedule time for them.`);
    return parts.join(' ');
  })();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Your study activity over the last seven days.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Hours This Week</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
                {Math.round(totalWeekHours * 10) / 10}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Clock size={22} />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Tasks Completed</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
                {d.weekCompleted}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CalendarCheck size={22} />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Best Day</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
                {bestDay.label}
                <span className="ml-1 text-base font-bold text-slate-400">
                  {Math.round(bestDay.hours * 10) / 10}h
                </span>
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Flame size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Weekly bar chart */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <TrendingUp size={18} className="text-indigo-600" />
            Study Hours — Last 7 Days
          </h2>
          <span className="text-xs font-semibold text-slate-400">
            avg {Math.round(avgHours * 10) / 10}h/day
          </span>
        </div>

        <div className="mt-6 flex h-48 justify-between gap-3 sm:gap-5">
          {d.weekHours.map((day, i) => (
            <div key={day.label + i} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-xs font-bold text-slate-500">
                {day.hours > 0 ? Math.round(day.hours * 10) / 10 : ''}
              </span>
              <div className="flex min-h-0 w-full max-w-14 flex-1 items-end">
                <div
                  className={`w-full rounded-t-lg bg-gradient-to-t ${BAR_COLORS[i % BAR_COLORS.length]}`}
                  style={{
                    height: `${Math.max((day.hours / maxHours) * 100, day.hours > 0 ? 6 : 2)}%`,
                    transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: day.hours > 0 ? 1 : 0.25,
                  }}
                />
              </div>
              <span className="text-xs font-semibold text-slate-500">{day.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Weekly summary */}
        <div className="card p-6">
          <h2 className="text-base font-bold text-slate-900">Weekly Performance Summary</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{summary}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">Completion rate</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">
                {d.totalTasks > 0
                  ? Math.round((d.completedTasks / d.totalTasks) * 100)
                  : 0}
                %
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">Productivity score</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">{d.score}%</p>
            </div>
          </div>
        </div>

        {/* Subject breakdown */}
        <div className="card p-6">
          <h2 className="text-base font-bold text-slate-900">Hours by Subject</h2>
          {subjectShare.length === 0 ? (
            <p className="mt-4 rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No study data yet.
            </p>
          ) : (
            <ul className="mt-5 space-y-4">
              {subjectShare
                .sort((a, b) => b.hours - a.hours)
                .map(({ subject, hours }) => (
                  <li key={subject}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-700">{subject}</span>
                      <span className="font-bold text-slate-500">{Math.round(hours * 10) / 10}h</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-500"
                        style={{ width: `${(hours / maxSubject) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
