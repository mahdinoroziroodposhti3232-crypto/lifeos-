import { create } from 'zustand';
import type { PageType, UserSettings, Task, Project, Label, Goal, Habit, Note, FocusSession, CalendarEvent, DashboardWidget, Notification } from '@/types';
import { DEFAULT_USER_SETTINGS } from '@/types';

interface AppState {
  // User
  user: { id: string; name: string; email: string; avatar?: string } | null;
  setUser: (user: { id: string; name: string; email: string; avatar?: string } | null) => void;

  // Notifications
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
  unreadCount: number;

  // Navigation
  currentPage: PageType;
  setCurrentPage: (page: PageType) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;

  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Command Palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  // Data
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  labels: Label[];
  setLabels: (labels: Label[]) => void;
  goals: Goal[];
  setGoals: (goals: Goal[]) => void;
  habits: Habit[];
  setHabits: (habits: Habit[]) => void;
  notes: Note[];
  setNotes: (notes: Note[]) => void;
  focusSessions: FocusSession[];
  setFocusSessions: (sessions: FocusSession[]) => void;
  calendarEvents: CalendarEvent[];
  setCalendarEvents: (events: CalendarEvent[]) => void;

  // Settings
  settings: UserSettings;
  setSettings: (settings: Partial<UserSettings>) => void;

  // Dashboard
  dashboardWidgets: DashboardWidget[];
  setDashboardWidgets: (widgets: DashboardWidget[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // User
  user: null,
  setUser: (user) => set({ user }),

  // Notifications
  notifications: [],
  setNotifications: (notifications) => set({ notifications, unreadCount: notifications.filter((n) => !n.read).length }),
  unreadCount: 0,

  // Navigation
  currentPage: 'dashboard',
  setCurrentPage: (page) => set({ currentPage: page }),
  selectedProjectId: null,
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),

  // Sidebar
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  // Command Palette
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  // Data
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  projects: [],
  setProjects: (projects) => set({ projects }),
  labels: [],
  setLabels: (labels) => set({ labels }),
  goals: [],
  setGoals: (goals) => set({ goals }),
  habits: [],
  setHabits: (habits) => set({ habits }),
  notes: [],
  setNotes: (notes) => set({ notes }),
  focusSessions: [],
  setFocusSessions: (sessions) => set({ focusSessions: sessions }),
  calendarEvents: [],
  setCalendarEvents: (events) => set({ calendarEvents: events }),

  // Settings
  settings: DEFAULT_USER_SETTINGS,
  setSettings: (partial) => set((state) => ({
    settings: { ...state.settings, ...partial }
  })),

  // Dashboard
  dashboardWidgets: [
    { id: '1', type: 'today-tasks', order: 0, visible: true },
    { id: '2', type: 'calendar', order: 1, visible: true },
    { id: '3', type: 'habits', order: 2, visible: true },
    { id: '4', type: 'projects', order: 3, visible: true },
    { id: '5', type: 'focus-stats', order: 4, visible: true },
    { id: '6', type: 'productivity-chart', order: 5, visible: true },
    { id: '7', type: 'ai-suggestions', order: 6, visible: true },
  ],
  setDashboardWidgets: (widgets) => set({ dashboardWidgets: widgets }),
}));