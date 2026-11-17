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
  'Other',
];

export const PRIORITIES: Priority[] = ['Low', 'Medium', 'High'];

export const DEFAULT_SETTINGS: Settings = {
  name: 'Student',
  focusMinutes: 25,
  breakMinutes: 5,
};
