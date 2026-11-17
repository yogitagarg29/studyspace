import { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  ListTodo,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { PRIORITIES, type Priority, type Task } from '@/types';
import { SubjectPicker } from '@/components/SubjectPicker';
import { Toast } from '@/components/Toast';
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

const EMPTY_FORM: FormState = { title: '', subject: 'Mathematics', priority: 'Medium', dueDate: todayISO() };

export function Tasks({ data }: TasksProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);

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
      setToast('Task updated');
    } else {
      data.addTask({ title, subject: form.subject, priority: form.priority, dueDate: form.dueDate });
      setToast('Task added');
    }
    closeForm();
  };

  const confirmDelete = () => {
    if (pendingDelete) {
      data.deleteTask(pendingDelete.id);
      setToast('Task deleted');
      setPendingDelete(null);
    }
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
        <div className="card animate-fade-up">
          <div className="empty-state border-0 bg-transparent">
            <div className="empty-icon">
              <ListTodo size={24} />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-700">
              {query
                ? 'No tasks match your search'
                : filter === 'completed'
                  ? 'Nothing completed yet'
                  : filter === 'pending'
                    ? 'No pending tasks — nice!'
                    : 'Your task list is empty'}
            </p>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
              {query
                ? 'Try a different word or clear the search.'
                : 'Add your first task to start building momentum.'}
            </p>
            {!query && (
              <button onClick={startAdd} className="btn-primary mt-4">
                <Plus size={15} strokeWidth={2.5} />
                Add Task
              </button>
            )}
          </div>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {visible.map((t) => (
            <li
              key={t.id}
              className={`card card-lift animate-fade-up flex flex-wrap items-center gap-3 px-5 py-4 ${
                t.completed ? 'opacity-70' : ''
              }`}
            >
              <button
                onClick={() => {
                  data.updateTask(t.id, { completed: !t.completed });
                  setToast(t.completed ? 'Moved to pending' : 'Task completed');
                }}
                aria-label={t.completed ? 'Mark as pending' : 'Mark as completed'}
                className="shrink-0 text-slate-300 transition-all duration-200 hover:scale-110 hover:text-emerald-500 active:scale-90"
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
                  className="rounded-lg p-2 text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-indigo-600 active:scale-90"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => setPendingDelete(t)}
                  aria-label="Delete task"
                  className="rounded-lg p-2 text-slate-400 transition-all duration-200 hover:bg-rose-50 hover:text-rose-600 active:scale-90"
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
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in" onClick={closeForm} />
          <div className="card relative w-full max-w-md animate-fade-up p-6 shadow-xl">
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

              <div>
                <label className="label">Subject</label>
                <SubjectPicker
                  value={form.subject}
                  onChange={(subject) => setForm({ ...form, subject })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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

      {/* Delete confirmation */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setPendingDelete(null)}
          />
          <div className="card relative w-full max-w-sm animate-fade-up p-6 shadow-xl">
            <div className="empty-icon mx-auto bg-rose-50 text-rose-500 ring-rose-100">
              <Trash2 size={22} />
            </div>
            <h2 className="section-title mt-4 text-center">Delete this task?</h2>
            <p className="mt-1.5 text-center text-sm leading-relaxed text-slate-500">
              "{pendingDelete.title}" will be permanently removed.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <button onClick={() => setPendingDelete(null)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={confirmDelete} className="btn-primary flex-1 bg-rose-600 hover:bg-rose-700 hover:shadow-rose-600/25">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </div>
  );
}
