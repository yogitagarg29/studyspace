import { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  ListTodo,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
  Clock,
  AlertCircle,
  Filter as FilterIcon,
  BookOpen,
} from 'lucide-react';
import { PRIORITIES, SUBJECTS, subjectColor, type Priority, type Task } from '@/types';
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

type StatusFilter = 'all' | 'pending' | 'completed';
type SortOption = 'dueDateAsc' | 'dueDateDesc' | 'priority' | 'title';

const PRIORITY_RANK: Record<Priority, number> = { High: 3, Medium: 2, Low: 1 };

const EMPTY_FORM: FormState = {
  title: '',
  subject: 'Mathematics',
  priority: 'Medium',
  dueDate: todayISO(),
};

export function Tasks({ data }: TasksProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('dueDateAsc');
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showForm) closeForm();
        if (pendingDelete) setPendingDelete(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showForm, pendingDelete]);

  const startAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  };

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setForm({
      title: task.title,
      subject: task.subject,
      priority: task.priority,
      dueDate: task.dueDate,
    });
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
      data.updateTask(editingId, {
        title,
        subject: form.subject,
        priority: form.priority,
        dueDate: form.dueDate,
      });
      setToast('Task updated successfully');
    } else {
      data.addTask({
        title,
        subject: form.subject,
        priority: form.priority,
        dueDate: form.dueDate,
      });
      setToast('New task created');
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

  // Extract all subjects present in standard list + active tasks
  const availableSubjects = useMemo(() => {
    const set = new Set<string>(SUBJECTS);
    data.tasks.forEach((t) => set.add(t.subject));
    return Array.from(set);
  }, [data.tasks]);

  // Compute counts
  const today = todayISO();
  const overdueCount = useMemo(
    () => data.tasks.filter((t) => !t.completed && isOverdue(t.dueDate)).length,
    [data.tasks],
  );
  const dueTodayCount = useMemo(
    () => data.tasks.filter((t) => !t.completed && t.dueDate === today).length,
    [data.tasks, today],
  );

  const statusCounts = useMemo(
    () => ({
      all: data.tasks.length,
      pending: data.tasks.filter((t) => !t.completed).length,
      completed: data.tasks.filter((t) => t.completed).length,
    }),
    [data.tasks],
  );

  const subjectCounts = useMemo(() => {
    const map: Record<string, number> = {};
    data.tasks.forEach((t) => {
      map[t.subject] = (map[t.subject] || 0) + 1;
    });
    return map;
  }, [data.tasks]);

  const visible = useMemo(() => {
    return data.tasks
      .filter((t) => {
        if (statusFilter === 'pending') return !t.completed;
        if (statusFilter === 'completed') return t.completed;
        return true;
      })
      .filter((t) => {
        if (subjectFilter === 'all') return true;
        return t.subject === subjectFilter;
      })
      .filter((t) => {
        if (!query.trim()) return true;
        const q = query.trim().toLowerCase();
        return t.title.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (statusFilter === 'all' && a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }

        switch (sortBy) {
          case 'dueDateAsc':
            return a.dueDate.localeCompare(b.dueDate);
          case 'dueDateDesc':
            return b.dueDate.localeCompare(a.dueDate);
          case 'priority':
            return PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
          case 'title':
            return a.title.localeCompare(b.title);
          default:
            return 0;
        }
      });
  }, [data.tasks, statusFilter, subjectFilter, query, sortBy]);

  const hasActiveFilters =
    statusFilter !== 'all' || subjectFilter !== 'all' || query.trim().length > 0;

  const resetFilters = () => {
    setStatusFilter('all');
    setSubjectFilter('all');
    setQuery('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-subtitle">
            Plan, organize by subject, and complete your academic assignments on schedule.
          </p>
        </div>
        <button onClick={startAdd} className="btn-primary">
          <Plus size={16} strokeWidth={2.5} />
          Add Task
        </button>
      </header>

      {/* Metric summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card p-4 transition-all duration-200 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold muted">Total Tasks</p>
              <p className="font-display mt-0.5 text-2xl font-extrabold text-slate-900 dark:text-white">
                {statusCounts.all}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300">
              <ListTodo size={18} />
            </div>
          </div>
        </div>

        <div className="card p-4 transition-all duration-200 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold muted">Due Today</p>
              <p className="font-display mt-0.5 text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                {dueTodayCount}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <Clock size={18} />
            </div>
          </div>
        </div>

        <div className="card p-4 transition-all duration-200 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold muted">Overdue</p>
              <p
                className={`font-display mt-0.5 text-2xl font-extrabold ${
                  overdueCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'
                }`}
              >
                {overdueCount}
              </p>
            </div>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                overdueCount > 0
                  ? 'bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'
                  : 'bg-slate-500/10 text-slate-500 dark:bg-white/10 dark:text-slate-400'
              }`}
            >
              <AlertCircle size={18} />
            </div>
          </div>
        </div>

        <div className="card p-4 transition-all duration-200 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold muted">Completed</p>
              <p className="font-display mt-0.5 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {statusCounts.completed}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <CheckCircle2 size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Subject Filter Bar (Subject-wise Filtering feature) */}
      <div className="card p-4">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <BookOpen size={14} className="text-violet-500" />
            <span>Filter by Subject</span>
          </div>
          {subjectFilter !== 'all' && (
            <button
              onClick={() => setSubjectFilter('all')}
              className="text-xs font-semibold text-violet-600 hover:underline dark:text-violet-400"
            >
              Show all subjects
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSubjectFilter('all')}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
              subjectFilter === 'all'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/25 ring-0'
                : 'bg-slate-100 text-slate-600 ring-1 ring-slate-900/5 hover:bg-slate-200/70 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10 dark:hover:bg-white/10'
            }`}
          >
            All Subjects ({statusCounts.all})
          </button>

          {availableSubjects.map((s) => {
            const count = subjectCounts[s] || 0;
            const isSelected = subjectFilter === s;
            return (
              <button
                key={s}
                onClick={() => setSubjectFilter(s)}
                className={`group flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  isSelected
                    ? `bg-gradient-to-r text-white shadow-md ${subjectColor(s)}`
                    : 'bg-white/70 text-slate-700 ring-1 ring-slate-900/10 hover:bg-white hover:shadow-sm dark:bg-white/[0.04] dark:text-slate-300 dark:ring-white/10 dark:hover:bg-white/10'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isSelected ? 'bg-white' : `bg-gradient-to-r ${subjectColor(s)}`
                  }`}
                />
                <span>{s}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Status filter, Search, and Sort bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Status filters */}
        <div className="flex rounded-xl bg-white/80 p-1 ring-1 ring-slate-900/10 backdrop-blur dark:bg-white/[0.05] dark:ring-white/10">
          {(['all', 'pending', 'completed'] as StatusFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold capitalize transition-all duration-200 ${
                statusFilter === f
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/25'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {f} ({statusCounts[f]})
            </button>
          ))}
        </div>

        <div className="flex flex-1 flex-wrap items-center justify-end gap-2.5 sm:flex-nowrap">
          {/* Search */}
          <div className="relative w-full sm:max-w-xs">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title or subject…"
              className="input py-2 pl-9 pr-8 text-xs"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-1.5 rounded-xl bg-white/80 px-2.5 py-1.5 ring-1 ring-slate-900/10 backdrop-blur dark:bg-white/[0.05] dark:ring-white/10">
            <FilterIcon size={13} className="text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none dark:text-slate-200"
            >
              <option value="dueDateAsc">Due Date (Earliest)</option>
              <option value="dueDateDesc">Due Date (Latest)</option>
              <option value="priority">Priority (High to Low)</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      {visible.length === 0 ? (
        <div className="card animate-fade-up">
          <div className="empty-state border-0 bg-transparent py-14">
            <div className="empty-icon">
              <ListTodo size={24} />
            </div>
            <p className="mt-3 text-base font-bold text-slate-800 dark:text-slate-200">
              {hasActiveFilters ? 'No tasks match your filters' : 'Your task list is empty'}
            </p>
            <p className="mt-1 max-w-sm text-xs leading-relaxed muted">
              {hasActiveFilters
                ? 'Try broadening your search or resetting your subject and status filters.'
                : 'Create your first academic task to keep your studies organized.'}
            </p>
            <div className="mt-4 flex gap-2">
              {hasActiveFilters && (
                <button onClick={resetFilters} className="btn-secondary text-xs">
                  Reset Filters
                </button>
              )}
              <button onClick={startAdd} className="btn-primary text-xs">
                <Plus size={14} strokeWidth={2.5} />
                Add New Task
              </button>
            </div>
          </div>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {visible.map((t) => (
            <li
              key={t.id}
              className={`card card-lift animate-fade-up flex flex-wrap items-center gap-3 px-5 py-4 transition-all duration-200 ${
                t.completed ? 'opacity-70 dark:opacity-60' : ''
              }`}
            >
              {/* Subject accent bar */}
              <span
                className={`h-10 w-1.5 shrink-0 rounded-full bg-gradient-to-b ${subjectColor(
                  t.subject,
                )}`}
              />

              {/* Toggle complete button */}
              <button
                onClick={() => {
                  data.updateTask(t.id, { completed: !t.completed });
                  setToast(t.completed ? 'Task marked as pending' : 'Task completed! Great job!');
                }}
                aria-label={t.completed ? 'Mark as pending' : 'Mark as completed'}
                className="shrink-0 text-slate-300 transition-all duration-200 hover:scale-110 hover:text-emerald-500 active:scale-95 dark:text-slate-600"
              >
                {t.completed ? (
                  <CheckCircle2 size={22} className="text-emerald-500" />
                ) : (
                  <Circle size={22} />
                )}
              </button>

              {/* Task Details */}
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm font-semibold ${
                    t.completed
                      ? 'text-slate-400 line-through dark:text-slate-500'
                      : 'text-slate-800 dark:text-slate-100'
                  }`}
                >
                  {t.title}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium muted">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {t.subject}
                  </span>
                  <span>·</span>
                  <span>Due {formatDueLabel(t.dueDate)}</span>
                  {!t.completed && isOverdue(t.dueDate) && (
                    <span className="rounded-md bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 ring-1 ring-rose-500/20 dark:text-rose-400">
                      Overdue
                    </span>
                  )}
                  {!t.completed && t.dueDate === today && (
                    <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400">
                      Due Today
                    </span>
                  )}
                </div>
              </div>

              {/* Priority badge */}
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

              {/* Action buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => startEdit(t)}
                  aria-label="Edit task"
                  className="rounded-lg p-2 text-slate-400 transition-all duration-200 hover:bg-violet-500/10 hover:text-violet-600 active:scale-90 dark:hover:bg-violet-400/10 dark:hover:text-violet-300"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => setPendingDelete(t)}
                  aria-label="Delete task"
                  className="rounded-lg p-2 text-slate-400 transition-all duration-200 hover:bg-rose-500/10 hover:text-rose-600 active:scale-90 dark:hover:bg-rose-400/10 dark:hover:text-rose-400"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Add / Edit Task Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
            onClick={closeForm}
          />
          <div className="card relative w-full max-w-md animate-fade-up p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="section-title">{editingId ? 'Edit Task' : 'New Academic Task'}</h2>
              <button
                onClick={closeForm}
                aria-label="Close"
                className="rounded-lg p-1.5 text-slate-400 transition-all duration-200 hover:bg-slate-900/5 hover:text-slate-700 active:scale-90 dark:hover:bg-white/10 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
              <div>
                <label htmlFor="task-title" className="label">
                  Task Title
                </label>
                <input
                  id="task-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Finish Calculus problem set 7"
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
                  <label htmlFor="task-priority" className="label">
                    Priority
                  </label>
                  <select
                    id="task-priority"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
                    className="input"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="task-due" className="label">
                    Due Date
                  </label>
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
                <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-600 ring-1 ring-rose-500/20 dark:text-rose-400">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeForm} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingId ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setPendingDelete(null)}
          />
          <div className="card relative w-full max-w-sm animate-fade-up p-6 shadow-2xl">
            <div className="empty-icon mx-auto bg-rose-500/10 text-rose-500 ring-rose-500/20">
              <Trash2 size={22} />
            </div>
            <h2 className="section-title mt-4 text-center">Delete this task?</h2>
            <p className="mt-1.5 text-center text-xs leading-relaxed muted">
              "{pendingDelete.title}" will be permanently removed.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <button onClick={() => setPendingDelete(null)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="btn-primary flex-1 bg-rose-600 hover:bg-rose-700 hover:shadow-rose-600/25"
              >
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
