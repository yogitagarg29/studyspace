import { useState } from 'react';
import { CheckCircle2, Circle, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { PRIORITIES, SUBJECTS, type Priority, type Task } from '@/types';
import type { StudySpace } from '@/hooks/useStudySpace';
import { formatDueLabel, isOverdue, todayISO } from '@/utils/date';

interface TasksProps {
  data: StudySpace;
}

interface FormState {
  title: string;
  subject: string;
  priority: Priority;
  dueDate: string;
}

type Filter = 'all' | 'pending' | 'completed';

const EMPTY_FORM: FormState = { title: '', subject: SUBJECTS[0], priority: 'Medium', dueDate: todayISO() };

export function Tasks({ data }: TasksProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const startAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  };

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setForm({ title: task.title, subject: task.subject, priority: task.priority, dueDate: task.dueDate });
    setError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setError('');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) {
      setError('Please enter a task title.');
      return;
    }
    if (!form.dueDate) {
      setError('Please choose a due date.');
      return;
    }
    if (editingId) {
      data.updateTask(editingId, { title, subject: form.subject, priority: form.priority, dueDate: form.dueDate });
    } else {
      data.addTask({ title, subject: form.subject, priority: form.priority, dueDate: form.dueDate });
    }
    closeForm();
  };

  const visible = data.tasks
    .filter((t) => (filter === 'all' ? true : filter === 'pending' ? !t.completed : t.completed))
    .filter((t) => t.title.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return a.dueDate.localeCompare(b.dueDate);
    });

  const counts = {
    all: data.tasks.length,
    pending: data.tasks.filter((t) => !t.completed).length,
    completed: data.tasks.filter((t) => t.completed).length,
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-subtitle">Plan, track and complete your academic work.</p>
        </div>
        <button onClick={startAdd} className="btn-primary">
          <Plus size={16} strokeWidth={2.5} />
          Add Task
        </button>
      </header>

      {/* Filters + search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl bg-white p-1 ring-1 ring-slate-200">
          {(['all', 'pending', 'completed'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold capitalize transition-colors ${
                filter === f ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {f} ({counts[f]})
            </button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks…"
            className="input pl-9"
          />
        </div>
      </div>

      {/* Task list */}
      {visible.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-14 text-center">
          <Circle size={30} className="text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">No tasks here</p>
          <p className="mt-1 text-sm text-slate-500">Add a task to get started.</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {visible.map((t) => (
            <li
              key={t.id}
              className={`card flex flex-wrap items-center gap-3 px-5 py-4 transition-shadow hover:shadow-md ${
                t.completed ? 'opacity-70' : ''
              }`}
            >
              <button
                onClick={() => data.updateTask(t.id, { completed: !t.completed })}
                aria-label={t.completed ? 'Mark as pending' : 'Mark as completed'}
                className="shrink-0 text-slate-300 transition-colors hover:text-emerald-500"
              >
                {t.completed ? (
                  <CheckCircle2 size={22} className="text-emerald-500" />
                ) : (
                  <Circle size={22} />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm font-semibold ${
                    t.completed ? 'text-slate-400 line-through' : 'text-slate-800'
                  }`}
                >
                  {t.title}
                </p>
                <p className="mt-0.5 text-xs font-medium text-slate-500">
                  {t.subject} · Due {formatDueLabel(t.dueDate)}
                  {!t.completed && isOverdue(t.dueDate) && (
                    <span className="ml-1 font-bold text-rose-600">· Overdue</span>
                  )}
                </p>
              </div>

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

              <div className="flex items-center gap-1">
                <button
                  onClick={() => startEdit(t)}
                  aria-label="Edit task"
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => data.deleteTask(t.id)}
                  aria-label="Delete task"
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Add / edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={closeForm} />
          <div className="card relative w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? 'Edit Task' : 'New Task'}
              </h2>
              <button
                onClick={closeForm}
                aria-label="Close"
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
              <div>
                <label htmlFor="task-title" className="label">Title</label>
                <input
                  id="task-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Finish lab report"
                  className="input"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="task-subject" className="label">Subject</label>
                  <select
                    id="task-subject"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="input"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="task-priority" className="label">Priority</label>
                  <select
                    id="task-priority"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
                    className="input"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="task-due" className="label">Due date</label>
                <input
                  id="task-due"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="input"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={closeForm} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingId ? 'Save Changes' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
