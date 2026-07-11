'use client';

import { useCallback } from 'react';
import { Search, Command, Menu, User, Bell, Info, CheckCircle2, AlertTriangle, XCircle, BellRing, CheckCheck, Inbox } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { Notification, PageType } from '@/types';

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

const NOTIFICATION_ICON_MAP: Record<string, { icon: typeof Info; color: string; bg: string }> = {
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  success: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  error: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  reminder: { icon: BellRing, color: 'text-purple-500', bg: 'bg-purple-500/10' },
};

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 60) return 'همین الان';
  if (diffMin < 60) return `${toPersianNum(diffMin)} دقیقه پیش`;
  if (diffHour < 24) return `${toPersianNum(diffHour)} ساعت پیش`;
  if (diffDay < 7) return `${toPersianNum(diffDay)} روز پیش`;
  if (diffWeek < 4) return `${toPersianNum(diffWeek)} هفته پیش`;
  if (diffMonth < 12) return `${toPersianNum(diffMonth)} ماه پیش`;
  return `${toPersianNum(Math.floor(diffDay / 365))} سال پیش`;
}

function toPersianNum(num: number): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/\d/g, (d) => persianDigits[parseInt(d)]);
}

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
}) {
  const typeConfig = NOTIFICATION_ICON_MAP[notification.type] || NOTIFICATION_ICON_MAP.info;
  const Icon = typeConfig.icon;

  const handleClick = () => {
    if (!notification.read) {
      onMarkRead(notification.id);
    }
    if (notification.actionUrl) {
      useAppStore.getState().setCurrentPage(notification.actionUrl as PageType);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20, transition: { duration: 0.15 } }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onClick={handleClick}
      className={cn(
        'flex items-start gap-3 rounded-lg p-3 cursor-pointer transition-colors duration-150',
        notification.read
          ? 'hover:bg-muted/50'
          : 'bg-primary/[0.04] hover:bg-primary/[0.08]'
      )}
    >
      {/* Type icon */}
      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full mt-0.5', typeConfig.bg)}>
        <Icon className={cn('h-4 w-4', typeConfig.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center justify-between gap-2">
          <p className={cn('text-sm font-medium leading-5 truncate', notification.read ? 'text-muted-foreground' : 'text-foreground')}>
            {notification.title}
          </p>
          {!notification.read && (
            <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-4 line-clamp-2">
          {notification.body}
        </p>
        <p className="text-[11px] text-muted-foreground/60 mt-1">
          {getRelativeTime(notification.createdAt)}
        </p>
      </div>
    </motion.div>
  );
}

export function Topbar() {
  const { currentPage, commandPaletteOpen, setCommandPaletteOpen, sidebarOpen, setSidebarOpen } =
    useAppStore();
  const queryClient = useQueryClient();

  const pageTitle = PAGE_TITLES[currentPage] || 'داشبورد';

  // Fetch notifications
  const { data, isLoading } = useQuery<{
    notifications: Notification[];
    unreadCount: number;
  }>({
    queryKey: ['notifications'],
    queryFn: () => fetch('/api/notifications').then((r) => r.json()),
    refetchInterval: 30000,
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: (payload: { id?: string; ids?: string[]; all?: boolean }) =>
      fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleMarkRead = useCallback(
    (id: string) => {
      markReadMutation.mutate({ id });
    },
    [markReadMutation]
  );

  const handleMarkAllRead = useCallback(() => {
    markReadMutation.mutate({ all: true });
  }, [markReadMutation]);

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

      {/* Left Side: Command Palette + Notifications + Profile */}
      <div className="flex items-center gap-1.5">
        {/* Command Palette Trigger */}
        <button
          onClick={() => setCommandPaletteOpen(!commandPaletteOpen)}
          className={cn(
            'flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-2.5 sm:px-3 py-1.5',
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

        {/* Notification Bell */}
        <Popover dir="rtl">
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className="absolute -top-0.5 -left-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white"
                >
                  {unreadCount > 99 ? '۹۹+' : toPersianNum(unreadCount)}
                </motion.span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            side="bottom"
            sideOffset={8}
            className="w-80 sm:w-96 p-0 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">اعلان‌ها</h3>
                {unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[11px] font-medium text-primary">
                    {toPersianNum(unreadCount)}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllRead}
                  className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  خواندن همه
                </Button>
              )}
            </div>

            {/* Notification list */}
            <div className="max-h-96">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-xs text-muted-foreground mt-3">در حال بارگذاری...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Inbox className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mt-3">بدون اعلان جدید</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">اعلان‌های شما اینجا نمایش داده می‌شود</p>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <AnimatePresence mode="popLayout">
                    <div className="p-2 space-y-1">
                      {notifications.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onMarkRead={handleMarkRead}
                        />
                      ))}
                    </div>
                  </AnimatePresence>
                </ScrollArea>
              )}
            </div>

            {notifications.length > 0 && (
              <>
                <Separator />
                <div className="px-4 py-2">
                  <p className="text-[11px] text-center text-muted-foreground/50">
                    بروزرسانی خودکار هر ۳۰ ثانیه
                  </p>
                </div>
              </>
            )}
          </PopoverContent>
        </Popover>

        {/* Profile Avatar */}
        <button className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20">
          <User className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}