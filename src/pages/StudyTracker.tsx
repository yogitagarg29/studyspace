import { useState, useEffect } from 'react';
import { BookOpen, Clock, GraduationCap, Plus, Trash2, X, Calendar, Sparkles } from 'lucide-react';
import { subjectColor } from '@/types';
import { SubjectPicker } from '@/components/SubjectPicker';
import { Toast } from '@/components/Toast';
import type { StudySpace } from '@/hooks/useStudySpace';
import { useDerived } from '@/utils/stats';
import { formatShortDate, todayISO } from '@/utils/date';

interface StudyTrackerProps {
  data: StudySpace;
}

export function StudyTracker({ data }: StudyTrackerProps) {
  const d = useDerived(data.tasks, data.sessions);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('Mathematics');
  const [hours, setHours] = useState('');
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showForm) {
        setShowForm(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showForm]);

  const recent = [...data.sessions]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
    .slice(0, 10);

  const maxHours = Math.max(...d.bySubject.map((s) => s.hours), 1);
  const totalHoursSum = Math.max(d.hoursTotal, 0.1);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const hoursNum = parseFloat(hours);
    if (!hours.trim() || Number.isNaN(hoursNum) || hoursNum <= 0 || hoursNum > 24) {
      setError('Enter study hours between 0.5 and 24.');
      return;
    }
    data.addSession({ subject, hours: Math.round(hoursNum * 100) / 100, date });
    setToast(`Logged ${Math.round(hoursNum * 100) / 100}h of ${subject}`);
    setHours('');
    setError('');
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Study Tracker</h1>
          <p className="page-subtitle">
            Log your daily academic study hours and visualize your subject distribution.
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={16} strokeWidth={2.5} />
          Log Study Session
        </button>
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="stat-card animate-fade-up">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider muted">Total Hours</p>
              <p className="font-display mt-1 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {Math.round(d.hoursTotal * 10) / 10}h
              </p>
              <p className="mt-0.5 text-xs text-slate-400">All-time logged study</p>
            </div>
            <div
              className="tooltip flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 transition-transform duration-200 hover:scale-110 dark:bg-indigo-500/20 dark:text-indigo-300"
              data-tip="All-time total"
            >
              <Clock size={22} />
            </div>
          </div>
        </div>

        <div className="stat-card animate-fade-up stagger-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider muted">Hours Today</p>
              <p className="font-display mt-1 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {Math.round(d.hoursToday * 10) / 10}h
              </p>
              <p className="mt-0.5 text-xs text-slate-400">Target: 4.0h daily</p>
            </div>
            <div
              className="tooltip flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 transition-transform duration-200 hover:scale-110 dark:bg-sky-500/20 dark:text-sky-300"
              data-tip="Logged for today"
            >
              <Calendar size={22} />
            </div>
          </div>
        </div>

        <div className="stat-card animate-fade-up stagger-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider muted">Active Subjects</p>
              <p className="font-display mt-1 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {d.bySubject.length}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">Distinct courses tracked</p>
            </div>
            <div
              className="tooltip flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 transition-transform duration-200 hover:scale-110 dark:bg-violet-500/20 dark:text-violet-300"
              data-tip="Unique subjects"
            >
              <GraduationCap size={22} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Subject-wise Progress */}
        <div className="card card-lift animate-fade-up stagger-1 p-6">
          <div className="flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2">
              <Sparkles size={18} className="text-violet-500" />
              Subject-wise Distribution
            </h2>
            <span className="text-xs font-semibold muted">{d.bySubject.length} subjects</span>
          </div>

          {d.bySubject.length === 0 ? (
            <div className="empty-state mt-4">
              <div className="empty-icon">
                <BookOpen size={24} />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                No study sessions logged yet
              </p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
                Log your first study session to see your subject progress breakdown.
              </p>
              <button onClick={() => setShowForm(true)} className="btn-primary mt-4 text-xs">
                Log First Session
              </button>
            </div>
          ) : (
            <ul className="mt-5 space-y-4">
              {d.bySubject.map(({ subject: s, hours: h }) => {
                const percentage = Math.round((h / totalHoursSum) * 100);
                return (
                  <li key={s} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                        <span
                          className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${subjectColor(s)}`}
                        />
                        {s}
                      </span>
                      <span className="font-bold text-slate-600 dark:text-slate-300">
                        {Math.round(h * 10) / 10}h ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-900/10 dark:bg-white/10">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${subjectColor(s)}`}
                        style={{
                          width: `${(h / maxHours) * 100}%`,
                          transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Recent Study Sessions */}
        <div className="card card-lift animate-fade-up stagger-2 p-6">
          <div className="flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2">
              <Clock size={18} className="text-violet-500" />
              Recent Study Sessions
            </h2>
            <span className="text-xs font-semibold muted">Last {recent.length} sessions</span>
          </div>

          {recent.length === 0 ? (
            <div className="empty-state mt-4">
              <div className="empty-icon">
                <Clock size={24} />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                No sessions logged yet
              </p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
                Tracking your hours helps you maintain consistency and master your subjects.
              </p>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-slate-900/5 dark:divide-white/5">
              {recent.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-violet-500/5"
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/15 to-sky-500/15 text-violet-600 ring-1 ring-violet-500/20 dark:text-violet-300`}
                  >
                    <Clock size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {s.subject}
                    </p>
                    <p className="text-xs font-medium text-slate-400">
                      {formatShortDate(s.date)}
                      {s.date === todayISO() && (
                        <span className="ml-1.5 font-bold text-violet-500">· Today</span>
                      )}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {Math.round(s.hours * 100) / 100}h
                  </span>
                  <button
                    onClick={() => {
                      data.deleteSession(s.id);
                      setToast('Session removed');
                    }}
                    aria-label="Delete session"
                    className="rounded-lg p-2 text-slate-300 transition-all duration-200 hover:bg-rose-500/10 hover:text-rose-600 active:scale-90 dark:text-slate-600 dark:hover:bg-rose-400/10 dark:hover:text-rose-400"
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Log Session Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowForm(false)}
          />
          <div className="card relative w-full max-w-md animate-fade-up p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="section-title">Log Study Session</h2>
              <button
                onClick={() => setShowForm(false)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-slate-400 transition-all duration-200 hover:bg-slate-900/5 hover:text-slate-700 active:scale-90 dark:hover:bg-white/10 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
              <div>
                <label className="label">Subject</label>
                <SubjectPicker value={subject} onChange={setSubject} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="session-hours" className="label">
                    Hours Studied
                  </label>
                  <input
                    id="session-hours"
                    type="number"
                    step="0.25"
                    min="0.25"
                    max="24"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="e.g. 1.5"
                    className="input"
                    autoFocus
                  />
                </div>
                <div>
                  <label htmlFor="session-date" className="label">
                    Date
                  </label>
                  <input
                    id="session-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-600 ring-1 ring-rose-500/20 dark:text-rose-400">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </div>
  );
}
