import { useState } from 'react';
import { Clock, GraduationCap, Plus, Trash2, X } from 'lucide-react';
import { SUBJECTS } from '@/types';
import type { StudySpace } from '@/hooks/useStudySpace';
import { useDerived } from '@/utils/stats';
import { formatShortDate, todayISO } from '@/utils/date';

interface StudyTrackerProps {
  data: StudySpace;
}

export function StudyTracker({ data }: StudyTrackerProps) {
  const d = useDerived(data.tasks, data.sessions);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [hours, setHours] = useState('');
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState('');

  const recent = [...data.sessions]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
    .slice(0, 8);

  const maxHours = Math.max(...d.bySubject.map((s) => s.hours), 1);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const hoursNum = parseFloat(hours);
    if (!hours.trim() || Number.isNaN(hoursNum) || hoursNum <= 0 || hoursNum > 24) {
      setError('Enter study hours between 0.5 and 24.');
      return;
    }
    data.addSession({ subject, hours: Math.round(hoursNum * 100) / 100, date });
    setHours('');
    setError('');
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Study Tracker</h1>
          <p className="page-subtitle">Log what you studied and watch the hours add up.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={16} strokeWidth={2.5} />
          Log Study Session
        </button>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Total Hours</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
                {Math.round(d.hoursTotal * 10) / 10}
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
              <p className="text-sm font-semibold text-slate-500">Hours Today</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
                {Math.round(d.hoursToday * 10) / 10}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <Clock size={22} />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Subjects Studied</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
                {d.bySubject.length}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <GraduationCap size={22} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Subject progress */}
        <div className="card p-6">
          <h2 className="text-base font-bold text-slate-900">Subject-wise Progress</h2>
          {d.bySubject.length === 0 ? (
            <p className="mt-4 rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              Log your first session to see progress by subject.
            </p>
          ) : (
            <ul className="mt-5 space-y-4">
              {d.bySubject.map(({ subject: s, hours: h }) => (
                <li key={s}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-700">{s}</span>
                    <span className="font-bold text-slate-500">{Math.round(h * 10) / 10}h</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-500"
                      style={{
                        width: `${(h / maxHours) * 100}%`,
                        transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent sessions */}
        <div className="card p-6">
          <h2 className="text-base font-bold text-slate-900">Recent Sessions</h2>
          {recent.length === 0 ? (
            <p className="mt-4 rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No sessions logged yet.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {recent.map((s) => (
                <li key={s.id} className="flex items-center gap-3 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Clock size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{s.subject}</p>
                    <p className="text-xs font-medium text-slate-500">{formatShortDate(s.date)}</p>
                  </div>
                  <span className="text-sm font-bold text-slate-700">
                    {Math.round(s.hours * 100) / 100}h
                  </span>
                  <button
                    onClick={() => data.deleteSession(s.id)}
                    aria-label="Delete session"
                    className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Log session modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          />
          <div className="card relative w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Log Study Session</h2>
              <button
                onClick={() => setShowForm(false)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
              <div>
                <label htmlFor="session-subject" className="label">Subject</label>
                <select
                  id="session-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="input"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="session-hours" className="label">Hours</label>
                  <input
                    id="session-hours"
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="e.g. 1.5"
                    className="input"
                    autoFocus
                  />
                </div>
                <div>
                  <label htmlFor="session-date" className="label">Date</label>
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
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
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
    </div>
  );
}
