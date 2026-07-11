'use client';

import { Search, Command, Menu, User } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'داشبورد',
  tasks: 'وظایف',
  projects: 'پروژه‌ها',
  calendar: 'تقویم',
  habits: 'عادت‌ها',
  goals: 'اهداف',
  focus: 'حالت تمرکز',
  notes: 'یادداشت‌ها',
  analytics: 'گزارش‌ها',
  settings: 'تنظیمات',
  'ai-assistant': 'دستیار هوشمند',
  'project-detail': 'جزئیات پروژه',
};

export function Topbar() {
  const { currentPage, commandPaletteOpen, setCommandPaletteOpen, sidebarOpen, setSidebarOpen } =
    useAppStore();

  const pageTitle = PAGE_TITLES[currentPage] || 'داشبورد';

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-4 md:px-6">
      {/* Right Side: Menu button (mobile) + Page Title */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <h1 className="text-base font-semibold text-foreground">{pageTitle}</h1>
      </div>

      {/* Left Side: Command Palette + Search + Profile */}
      <div className="flex items-center gap-2">
        {/* Command Palette Trigger */}
        <button
          onClick={() => setCommandPaletteOpen(!commandPaletteOpen)}
          className={cn(
            'flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5',
            'text-sm text-muted-foreground transition-all duration-200',
            'hover:bg-muted hover:text-foreground hover:border-border/80'
          )}
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">جستجو...</span>
          <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border/60 bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </button>

        {/* Search button */}
        <button className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <Search className="h-4 w-4" />
        </button>

        {/* Profile Avatar */}
        <button className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20">
          <User className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}