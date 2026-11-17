export type Priority = 'Low' | 'Medium' | 'High';

export interface Task {
  id: string;
  title: string;
  subject: string;
  priority: Priority;
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
  createdAt: number;
}

export interface StudySession {
  id: string;
  subject: string;
  hours: number;
  date: string; // YYYY-MM-DD
  createdAt: number;
}

export interface Settings {
  name: string;
  focusMinutes: number;
  breakMinutes: number;
}

export const SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'Economics',
  'History',
  'Literature',
];

/** Gradient classes per subject, used for chips and progress bars. */
export const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: 'from-indigo-500 to-violet-500',
  Physics: 'from-sky-500 to-cyan-400',
  Chemistry: 'from-emerald-500 to-teal-400',
  Biology: 'from-green-500 to-lime-400',
  'Computer Science': 'from-blue-600 to-indigo-500',
  Economics: 'from-amber-500 to-orange-400',
  History: 'from-orange-600 to-amber-400',
  Literature: 'from-pink-500 to-rose-400',
};

const FALLBACK_COLORS = [
  'from-indigo-500 to-sky-500',
  'from-violet-500 to-fuchsia-400',
  'from-teal-500 to-emerald-400',
  'from-rose-500 to-pink-400',
  'from-blue-600 to-cyan-400',
  'from-amber-500 to-yellow-400',
];

export function subjectColor(subject: string): string {
  if (SUBJECT_COLORS[subject]) return SUBJECT_COLORS[subject];
  // Pick a stable fallback gradient for custom subjects
  let hash = 0;
  for (let i = 0; i < subject.length; i++) hash = (hash * 31 + subject.charCodeAt(i)) >>> 0;
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}

export const PRIORITIES: Priority[] = ['Low', 'Medium', 'High'];

export const DEFAULT_SETTINGS: Settings = {
  name: 'Student',
  focusMinutes: 25,
  breakMinutes: 5,
};
