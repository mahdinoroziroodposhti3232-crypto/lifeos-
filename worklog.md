---
Task ID: 1
Agent: Main Agent
Task: Build complete Persian LifeOS application (Phase 1)

Work Log:
- Designed and pushed Prisma database schema with 18 models (User, Project, Task, Label, Goal, Milestone, Habit, HabitRecord, Note, CalendarEvent, FocusSession, UserSetting, DashboardLayout)
- Downloaded and installed Vazirmatn Persian font (4 weights: 300, 400, 500, 700)
- Created custom RTL Design System with emerald/teal primary color, oklch color system, dark/light mode support
- Built complete layout system: Sidebar (collapsible, animated), Topbar, AppShell, Command Palette (Ctrl+K), Empty State
- Created Zustand store with all state management (navigation, data, settings, sidebar)
- Built Jalali/Shamsi calendar utility library (toJalaali, toGregorian, formatJalaaliDate, getJalaaliMonthDays, etc.)
- Created 10 API route modules (tasks, projects, labels, goals, habits, habits/records, notes, calendar-events, focus-sessions, seed)
- Built 11 feature pages: Dashboard, Tasks (Kanban+List), Projects, Calendar (Shamsi), Habits, Goals, Focus (Pomodoro), Notes, Analytics, Settings, AI Assistant
- Wired up SPA routing in page.tsx with QueryProvider and auto-seed
- Fixed multiple API/schema mismatches (focus-sessions, calendar-events, habits/records, labels)
- Verified all 11 pages work correctly via Agent Browser

Stage Summary:
- Complete Persian LifeOS SPA with RTL layout, Shamsi calendar, dark/light mode
- All 11 modules functional: Dashboard, Tasks, Projects, Calendar, Habits, Goals, Focus, Notes, Analytics, Settings, AI Assistant
- Database seeded with 15 tasks, 3 projects, 5 labels, 3 goals, 4 habits, 5 notes, 12 focus sessions, 5 calendar events
- Screenshots saved to /home/z/my-project/download/