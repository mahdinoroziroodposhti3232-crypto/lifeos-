export type PageType = 'dashboard' | 'tasks' | 'projects' | 'calendar' | 'habits' | 'goals' | 'focus' | 'notes' | 'analytics' | 'settings' | 'ai-assistant' | 'project-detail';

export type TaskStatus = 'todo' | 'in-progress' | 'done' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type HabitFrequency = 'daily' | 'weekly' | 'monthly';
export type GoalCategory = 'personal' | 'work' | 'health' | 'education' | 'financial' | 'social';
export type FocusType = 'pomodoro' | 'short-break' | 'long-break';
export type CalendarViewType = 'month' | 'week' | 'day';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  dueTime?: string;
  reminderAt?: string;
  repeatRule?: string;
  isArchived: boolean;
  order: number;
  projectId?: string;
  labelId?: string;
  parentId?: string;
  estimatedMinutes?: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  project?: Project;
  label?: Label;
  children?: Task[];
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  color: string;
  icon?: string;
  status: string;
  progress: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  _count?: { tasks: number };
}

export interface Label {
  id: string;
  name: string;
  color: string;
  userId: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: GoalCategory;
  progress: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  milestones?: Milestone[];
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  dueDate?: string;
  order: number;
  goalId: string;
  userId: string;
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  frequency: HabitFrequency;
  targetCount: number;
  color: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  records?: HabitRecord[];
}

export interface HabitRecord {
  id: string;
  date: string;
  count: number;
  habitId: string;
  userId: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  color?: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  color: string;
  isAllDay: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface FocusSession {
  id: string;
  type: FocusType;
  duration: number;
  completedAt: string;
  taskId?: string;
  userId: string;
}

export interface DashboardWidget {
  id: string;
  type: 'today-tasks' | 'calendar' | 'habits' | 'projects' | 'focus-stats' | 'productivity-chart' | 'ai-suggestions';
  order: number;
  visible: boolean;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  calendarType: 'shamsi' | 'miladi';
  pomodoroDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  weekStart: 'saturday' | 'sunday';
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  theme: 'system',
  calendarType: 'shamsi',
  pomodoroDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  weekStart: 'saturday',
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: '#6b7280',
  medium: '#3b82f6',
  high: '#f59e0b',
  urgent: '#ef4444',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'کم',
  medium: 'متوسط',
  high: 'زیاد',
  urgent: 'فوری',
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'انجام نشده',
  'in-progress': 'در حال انجام',
  done: 'انجام شده',
  archived: 'بایگانی شده',
};

export const GOAL_CATEGORY_LABELS: Record<GoalCategory, string> = {
  personal: 'شخصی',
  work: 'کاری',
  health: 'سلامتی',
  education: 'آموزشی',
  financial: 'مالی',
  social: 'اجتماعی',
};

export const HABIT_FREQUENCY_LABELS: Record<HabitFrequency, string> = {
  daily: 'روزانه',
  weekly: 'هفتگی',
  monthly: 'ماهانه',
};

export const SHAMSI_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

export const SHAMSI_WEEK_DAYS = [
  'شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'
];

export const MILADI_WEEK_DAYS_SHORT = [
  'ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'
];