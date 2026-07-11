'use client';

import { useEffect, useState } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import { AppShell } from '@/components/layout/app-shell';
import { useAppStore } from '@/lib/store';
import type { PageType } from '@/types';
import { DashboardPage } from '@/features/dashboard/dashboard-page';
import { TasksPage } from '@/features/tasks/tasks-page';
import ProjectsPage from '@/features/projects/projects-page';
import CalendarPage from '@/features/calendar/calendar-page';
import HabitsPage from '@/features/habits/habits-page';
import GoalsPage from '@/features/goals/goals-page';
import FocusPage from '@/features/focus/focus-page';
import NotesPage from '@/features/notes/notes-page';
import AnalyticsPage from '@/features/analytics/analytics-page';
import SettingsPage from '@/features/settings/settings-page';
import AIPage from '@/features/ai-assistant/ai-page';
import { AuthPage } from '@/features/auth/auth-page';
import { Loader2 } from 'lucide-react';

function PageRouter() {
  const { currentPage } = useAppStore();

  const pages: Record<PageType, React.ReactNode> = {
    dashboard: <DashboardPage />,
    tasks: <TasksPage />,
    projects: <ProjectsPage />,
    calendar: <CalendarPage />,
    habits: <HabitsPage />,
    goals: <GoalsPage />,
    focus: <FocusPage />,
    notes: <NotesPage />,
    analytics: <AnalyticsPage />,
    settings: <SettingsPage />,
    'ai-assistant': <AIPage />,
    'project-detail': <ProjectsPage />,
  };

  return (
    <>
      {pages[currentPage] || <DashboardPage />}
    </>
  );
}

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-background" dir="rtl">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <span className="text-3xl">✦</span>
          </div>
          <div className="absolute -bottom-1 -left-1 h-16 w-16 rounded-2xl bg-primary/5 animate-ping" />
        </div>
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-lg font-medium text-muted-foreground">در حال بارگذاری لایف‌او‌اس...</span>
        </div>
      </div>
    </div>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <LoadingScreen />;
  }

  if (!session) {
    return <AuthPage />;
  }

  return <>{children}</>;
}

function AppContent() {
  const [isSeeded, setIsSeeded] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    async function initialize() {
      try {
        // Check if data exists
        const tasksRes = await fetch('/api/tasks');
        const tasks = await tasksRes.json();

        if (!Array.isArray(tasks) || tasks.length === 0) {
          // Seed demo data
          await fetch('/api/seed', { method: 'POST' });
        }
        setIsSeeded(true);
      } catch (error) {
        console.error('Init error:', error);
        setIsSeeded(true);
      } finally {
        setIsInitializing(false);
      }
    }
    initialize();
  }, []);

  if (isInitializing) {
    return <LoadingScreen />;
  }

  return (
    <AppShell>
      <PageRouter />
    </AppShell>
  );
}

export default function Home() {
  return (
    <SessionProvider>
      <AuthGate>
        <AppContent />
      </AuthGate>
    </SessionProvider>
  );
}