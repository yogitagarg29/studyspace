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
  'Statistics',
  'Economics',
  'Psychology',
  'History',
  'Literature',
  'Geography',
  'Philosophy',
  'Political Science',
  'Art & Design',
  'Music',
];

/** Gradient classes per subject, used for chips and progress bars. */
export const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: 'from-indigo-500 to-violet-500',
  Physics: 'from-sky-500 to-cyan-400',
  Chemistry: 'from-emerald-500 to-teal-400',
  Biology: 'from-green-500 to-lime-400',
  'Computer Science': 'from-blue-600 to-indigo-500',
  Statistics: 'from-violet-500 to-fuchsia-400',
  Economics: 'from-amber-500 to-orange-400',
  Psychology: 'from-rose-500 to-pink-400',
  History: 'from-orange-600 to-amber-400',
  Literature: 'from-pink-500 to-rose-400',
  Geography: 'from-teal-500 to-emerald-400',
  Philosophy: 'from-slate-500 to-slate-400',
  'Political Science': 'from-red-500 to-orange-400',
  'Art & Design': 'from-fuchsia-500 to-pink-400',
  Music: 'from-purple-500 to-indigo-400',
};

export function subjectColor(subject: string): string {
  return SUBJECT_COLORS[subject] ?? 'from-indigo-500 to-sky-500';
}

export const PRIORITIES: Priority[] = ['Low', 'Medium', 'High'];

export const DEFAULT_SETTINGS: Settings = {
  name: 'Student',
  focusMinutes: 25,
  breakMinutes: 5,
};
