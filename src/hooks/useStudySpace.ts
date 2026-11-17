import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, type Settings, type StudySession, type Task } from '@/types';
import { addDays, toISODate, todayISO } from '@/utils/date';

const TASKS_KEY = 'studyspace:tasks';
const SESSIONS_KEY = 'studyspace:sessions';
const SETTINGS_KEY = 'studyspace:settings';
const SEEDED_KEY = 'studyspace:seeded';

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable (private mode) — app still works in memory
  }
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function seedData(): { tasks: Task[]; sessions: StudySession[] } {
  const now = Date.now();

  const tasks: Task[] = [
    {
      id: uid(),
      title: 'Finish calculus problem set 7',
      subject: 'Mathematics',
      priority: 'High',
      dueDate: todayISO(),
      completed: false,
      createdAt: now - 1000,
    },
    {
      id: uid(),
      title: 'Read Chapter 4: Thermodynamics',
      subject: 'Physics',
      priority: 'Medium',
      dueDate: toISODate(addDays(new Date(), 1)),
      completed: false,
      createdAt: now - 2000,
    },
    {
      id: uid(),
      title: 'Prepare biology lab report',
      subject: 'Biology',
      priority: 'High',
      dueDate: toISODate(addDays(new Date(), 3)),
      completed: false,
      createdAt: now - 3000,
    },
    {
      id: uid(),
      title: 'Review economics lecture notes',
      subject: 'Economics',
      priority: 'Low',
      dueDate: toISODate(addDays(new Date(), -1)),
      completed: true,
      createdAt: now - 4000,
    },
    {
      id: uid(),
      title: 'Complete SQL practice exercises',
      subject: 'Computer Science',
      priority: 'Medium',
      dueDate: todayISO(),
      completed: true,
      createdAt: now - 5000,
    },
  ];

  const subjects = ['Mathematics', 'Physics', 'Computer Science', 'Economics', 'Biology'];
  const sessions: StudySession[] = [];
  const pattern = [2, 1.5, 3, 1, 2.5, 0.5, 2]; // today back to 6 days ago
  pattern.forEach((hours, i) => {
    const d = addDays(new Date(), -i);
    sessions.push({
      id: uid(),
      subject: subjects[i % subjects.length],
      hours,
      date: toISODate(d),
      createdAt: now - (i + 1) * 10000,
    });
  });
  // one older session so the tracker history feels real
  sessions.push({
    id: uid(),
    subject: 'Chemistry',
    hours: 2,
    date: toISODate(addDays(new Date(), -9)),
    createdAt: now - 20000,
  });

  return { tasks, sessions };
}

export function useStudySpace() {
  const [tasks, setTasks] = useState<Task[]>(() => load<Task[]>(TASKS_KEY, []));
  const [sessions, setSessions] = useState<StudySession[]>(() =>
    load<StudySession[]>(SESSIONS_KEY, []),
  );
  const [settings] = useState<Settings>(() => ({
    ...DEFAULT_SETTINGS,
    ...load<Partial<Settings>>(SETTINGS_KEY, {}),
  }));
  const [ready, setReady] = useState(false);

  // One-time realistic sample data on the very first visit
  useEffect(() => {
    if (localStorage.getItem(SEEDED_KEY) === null) {
      const { tasks: t, sessions: s } = seedData();
      setTasks(t);
      setSessions(s);
      save(TASKS_KEY, t);
      save(SESSIONS_KEY, s);
      localStorage.setItem(SEEDED_KEY, '1');
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) save(TASKS_KEY, tasks);
  }, [tasks, ready]);

  useEffect(() => {
    if (ready) save(SESSIONS_KEY, sessions);
  }, [sessions, ready]);

  useEffect(() => {
    if (ready) save(SETTINGS_KEY, settings);
  }, [settings, ready]);

  const addTask = useCallback((task: Omit<Task, 'id' | 'completed' | 'createdAt'>) => {
    setTasks((prev) => [
      { ...task, id: uid(), completed: false, createdAt: Date.now() },
      ...prev,
    ]);
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addSession = useCallback((session: Omit<StudySession, 'id' | 'createdAt'>) => {
    setSessions((prev) => [{ ...session, id: uid(), createdAt: Date.now() }, ...prev]);
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return {
    tasks,
    sessions,
    settings,
    addTask,
    updateTask,
    deleteTask,
    addSession,
    deleteSession,
  };
}

export type StudySpace = ReturnType<typeof useStudySpace>;
