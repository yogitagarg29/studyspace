import { useState } from 'react';
import { BookOpen, Clock, GraduationCap, Plus, Trash2, X } from 'lucide-react';
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
          <p className="page-subtitle">Log what you studied and watch the hours add up.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={16} strokeWidth={2.5} />
          Log Study Session
        </button>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="stat-card animate-fade-up">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Total Hours</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
                {Math.round(d.hoursTotal * 10) / 10}
              </p>
            </div>
            <div className="tooltip flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-transform duration-200 hover:scale-110" data-tip="All-time total">
              <Clock size={22} />
            </div>
          </div>
        </div>
        <div className="stat-card animate-fade-up stagger-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Hours Today</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
                {Math.round(d.hoursToday * 10) / 10}
              </p>
            </div>
            <div className="tooltip flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600 transition-transform duration-200 hover:scale-110" data-tip="Logged for today">
              <Clock size={22} />
            </div>
          </div>
        </div>
        <div className="stat-card animate-fade-up stagger-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Subjects Studied</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
                {d.bySubject.length}
              </p>
            </div>
            <div className="tooltip flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600 transition-transform duration-200 hover:scale-110" data-tip="Unique subjects">
              <GraduationCap size={22} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Subject progress */}
        <div className="card card-lift animate-fade-up stagger-1 p-6">
          <h2 className="section-title">Subject-wise Progress</h2>
          {d.bySubject.length === 0 ? (
            <div className="empty-state mt-4">
              <div className="empty-icon">
                <BookOpen size={24} />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-700">No study data yet</p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
                Log your first session to see progress by subject.
              </p>
            </div>
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
                      className={`h-full rounded-full bg-gradient-to-r ${subjectColor(s)}`}
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
        <div className="card card-lift animate-fade-up stagger-2 p-6">
          <h2 className="section-title">Recent Sessions</h2>
          {recent.length === 0 ? (
            <div className="empty-state mt-4">
              <div className="empty-icon">
                <Clock size={24} />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-700">No sessions logged yet</p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
                Track your hours to build a study habit that sticks.
              </p>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {recent.map((s) => (
                <li key={s.id} className="flex items-center gap-3 py-3 transition-colors hover:bg-slate-50/80">
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
                    onClick={() => {
                      data.deleteSession(s.id);
                      setToast('Session removed');
                    }}
                    aria-label="Delete session"
                    className="rounded-lg p-2 text-slate-300 transition-all duration-200 hover:bg-rose-50 hover:text-rose-600 active:scale-90"
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
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowForm(false)}
          />
          <div className="card relative w-full max-w-md animate-fade-up p-6 shadow-xl">
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
                <label className="label">Subject</label>
                <SubjectPicker value={subject} onChange={setSubject} />
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

      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </div>
  );
}
