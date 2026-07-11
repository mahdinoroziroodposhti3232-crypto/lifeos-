'use client';

import { useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  CalendarDays,
  Repeat,
  Target,
  Timer,
  FileText,
  BarChart3,
  Sparkles,
  Settings,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { PageType } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface CommandNavItem {
  id: PageType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string[];
}

const commandNavItems: CommandNavItem[] = [
  { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard, keywords: ['خانه', 'میز کار'] },
  { id: 'tasks', label: 'وظایف', icon: CheckSquare, keywords: ['کار', 'تسک', 'انجام'] },
  { id: 'projects', label: 'پروژه‌ها', icon: FolderKanban, keywords: ['پروژه', 'کارها'] },
  { id: 'calendar', label: 'تقویم', icon: CalendarDays, keywords: ['تاریخ', 'رویداد', 'جلسه'] },
  { id: 'habits', label: 'عادت‌ها', icon: Repeat, keywords: ['عادت', 'روتین', 'روزانه'] },
  { id: 'goals', label: 'اهداف', icon: Target, keywords: ['هدف', 'برنامه', 'آرزو'] },
  { id: 'focus', label: 'تمرکز', icon: Timer, keywords: ['پومودورو', 'تمرکز', 'زمان'] },
  { id: 'notes', label: 'یادداشت‌ها', icon: FileText, keywords: ['نوت', 'یادداشت', 'متن'] },
  { id: 'analytics', label: 'گزارش‌ها', icon: BarChart3, keywords: ['آمار', 'نمودار', 'تحلیل'] },
  { id: 'ai-assistant', label: 'دستیار هوشمند', icon: Sparkles, keywords: ['هوش مصنوعی', 'دستیار', 'ای آی'] },
  { id: 'settings', label: 'تنظیمات', icon: Settings, keywords: ['تنظیم', 'پیکربندی'] },
];

export function CommandPalette() {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setCurrentPage,
    setSelectedProjectId,
    projects,
  } = useAppStore();

  const handleSelect = useCallback(
    (page: PageType) => {
      setCurrentPage(page);
      setCommandPaletteOpen(false);
    },
    [setCurrentPage, setCommandPaletteOpen]
  );

  const handleProjectSelect = useCallback(
    (projectId: string) => {
      setSelectedProjectId(projectId);
      setCurrentPage('project-detail');
      setCommandPaletteOpen(false);
    },
    [setSelectedProjectId, setCurrentPage, setCommandPaletteOpen]
  );

  // Global keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  return (
    <Dialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <DialogHeader className="sr-only">
        <DialogTitle>پالت فرمان‌ها</DialogTitle>
        <DialogDescription>جستجو و ناوبری سریع در برنامه</DialogDescription>
      </DialogHeader>
      <DialogContent className="overflow-hidden p-0 sm:max-w-[560px]">
        <Command dir="rtl" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2">
          <CommandInput placeholder="جستجو در صفحات و پروژه‌ها..." className="h-12 text-sm" />
          <CommandList>
            <CommandEmpty className="py-8 text-center text-sm text-muted-foreground">
              نتیجه‌ای یافت نشد...
            </CommandEmpty>

            {/* Navigation Pages */}
            <CommandGroup heading="صفحات">
              {commandNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.id}
                    value={`${item.label} ${item.keywords?.join(' ') || ''}`}
                    onSelect={() => handleSelect(item.id)}
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 text-sm">{item.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>

            {/* Projects */}
            {projects && projects.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="پروژه‌ها">
                  {projects.map((project) => (
                    <CommandItem
                      key={project.id}
                      value={project.title}
                      onSelect={() => handleProjectSelect(project.id)}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                    >
                      <div
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="flex-1 text-sm truncate">{project.title}</span>
                      {project._count && (
                        <span className="text-xs text-muted-foreground">
                          {project._count.tasks} وظیفه
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}