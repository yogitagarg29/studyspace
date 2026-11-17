import { useMemo } from 'react';
import type { StudySession, Task } from '@/types';
import { lastNDays, todayISO } from '@/utils/date';

export function hoursOf(sessions: StudySession[], iso: string): number {
  return sessions
    .filter((s) => s.date === iso)
    .reduce((sum, s) => sum + s.hours, 0);
}

export function totalHours(sessions: StudySession[]): number {
  return sessions.reduce((sum, s) => sum + s.hours, 0);
}

export function subjectTotals(sessions: StudySession[]): { subject: string; hours: number }[] {
  const map = new Map<string, number>();
  for (const s of sessions) {
    map.set(s.subject, (map.get(s.subject) ?? 0) + s.hours);
  }
  return [...map.entries()]
    .map(([subject, hours]) => ({ subject, hours }))
    .sort((a, b) => b.hours - a.hours);
}

export function dailyHours(sessions: StudySession[], days = 7): { label: string; hours: number }[] {
  return lastNDays(days).map(({ iso, label }) => ({
    label,
    hours: Math.round(hoursOf(sessions, iso) * 10) / 10,
  }));
}

export function weekCompletedTasks(tasks: Task[]): number {
  const isos = new Set(lastNDays(7).map((d) => d.iso));
  return tasks.filter((t) => t.completed && isos.has(t.dueDate)).length;
}

/** Productivity score 0-100: 60% from today's completed tasks, 40% from today's study hours. */
export function productivityScore(tasks: Task[], sessions: StudySession[]): number {
  const today = todayISO();
  const tasksToday = tasks.filter((t) => t.dueDate === today);
  const doneToday = tasksToday.filter((t) => t.completed).length;
  const taskPart = tasksToday.length > 0 ? doneToday / tasksToday.length : doneToday > 0 ? 1 : 0;

  const hours = hoursOf(sessions, today);
  const hoursPart = Math.min(hours / 4, 1); // 4h of study = full marks

  const score = taskPart * 60 + hoursPart * 40;
  return Math.round(score);
}

export function useDerived(tasks: Task[], sessions: StudySession[]) {
  return useMemo(() => {
    const today = todayISO();
    const todaysTasks = tasks.filter((t) => t.dueDate === today);
    return {
      totalTasks: tasks.length,
      completedTasks: tasks.filter((t) => t.completed).length,
      pendingTasks: tasks.filter((t) => !t.completed).length,
      todaysTasks,
      todaysCompleted: todaysTasks.filter((t) => t.completed).length,
      hoursToday: hoursOf(sessions, today),
      hoursTotal: totalHours(sessions),
      bySubject: subjectTotals(sessions),
      weekHours: dailyHours(sessions, 7),
      weekCompleted: weekCompletedTasks(tasks),
      score: productivityScore(tasks, sessions),
    };
  }, [tasks, sessions]);
}
