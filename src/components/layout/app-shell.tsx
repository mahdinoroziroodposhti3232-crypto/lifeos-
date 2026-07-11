'use client';

import { useEffect } from 'react';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { CommandPalette } from './command-palette';
import { useAppStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    sidebarCollapsed,
    setTasks,
    setProjects,
    setLabels,
    setGoals,
    setHabits,
    setNotes,
    setFocusSessions,
    setCalendarEvents,
  } = useAppStore();

  // Fetch all data on mount
  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => fetch('/api/tasks').then((r) => r.json()),
  });
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => fetch('/api/projects').then((r) => r.json()),
  });
  const { data: labels } = useQuery({
    queryKey: ['labels'],
    queryFn: () => fetch('/api/labels').then((r) => r.json()),
  });
  const { data: goals } = useQuery({
    queryKey: ['goals'],
    queryFn: () => fetch('/api/goals').then((r) => r.json()),
  });
  const { data: habits } = useQuery({
    queryKey: ['habits'],
    queryFn: () => fetch('/api/habits').then((r) => r.json()),
  });
  const { data: notes } = useQuery({
    queryKey: ['notes'],
    queryFn: () => fetch('/api/notes').then((r) => r.json()),
  });
  const { data: focusSessions } = useQuery({
    queryKey: ['focus-sessions'],
    queryFn: () => fetch('/api/focus-sessions').then((r) => r.json()),
  });
  const { data: calendarEvents } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: () => fetch('/api/calendar-events').then((r) => r.json()),
  });

  useEffect(() => {
    if (tasks) setTasks(tasks);
  }, [tasks, setTasks]);
  useEffect(() => {
    if (projects) setProjects(projects);
  }, [projects, setProjects]);
  useEffect(() => {
    if (labels) setLabels(labels);
  }, [labels, setLabels]);
  useEffect(() => {
    if (goals) setGoals(goals);
  }, [goals, setGoals]);
  useEffect(() => {
    if (habits) setHabits(habits);
  }, [habits, setHabits]);
  useEffect(() => {
    if (notes) setNotes(notes);
  }, [notes, setNotes]);
  useEffect(() => {
    if (focusSessions) setFocusSessions(focusSessions);
  }, [focusSessions, setFocusSessions]);
  useEffect(() => {
    if (calendarEvents) setCalendarEvents(calendarEvents);
  }, [calendarEvents, setCalendarEvents]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div
        className={cn(
          'flex flex-1 flex-col overflow-hidden transition-all duration-300',
          sidebarCollapsed ? 'mr-[72px]' : 'mr-[260px]',
          'max-md:mr-0'
        )}
      >
        <Topbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6 pb-20 md:pb-6 scrollbar-thin">
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}