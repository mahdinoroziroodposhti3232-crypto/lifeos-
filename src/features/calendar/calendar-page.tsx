'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Clock,
  CalendarDays,
  Calendar,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAppStore } from '@/lib/store';
import {
  toJalaali,
  toGregorian,
  getJalaaliMonthName,
  getJalaaliMonthDays,
  getJalaaliWeekDaysHeader,
  isTodayJalaali,
  type JalaaliDate,
} from '@/lib/jalali';
import { cn } from '@/lib/utils';
import {
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  SHAMSI_WEEK_DAYS,
  type CalendarEvent,
  type Task,
} from '@/types';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const COLOR_PRESETS = [
  '#10b981',
  '#3b82f6',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function toPersianDigits(num: number): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num
    .toString()
    .split('')
    .map((ch) => (/\d/.test(ch) ? persianDigits[Number(ch)] : ch))
    .join('');
}

function formatJalaaliDateKey(date: Date): string {
  const { jy, jm, jd } = toJalaali(date);
  return `${jy}/${jm}/${jd}`;
}

function formatSelectedDateDisplay(jy: number, jm: number, jd: number): string {
  const monthName = getJalaaliMonthName(jm);
  const weekDayIndex = (() => {
    const greg = toGregorian(jy, jm, jd);
    const day = greg.getDay();
    return (day + 1) % 7;
  })();
  const weekDayName = SHAMSI_WEEK_DAYS[weekDayIndex];
  return `${toPersianDigits(jd)} ${monthName} ${toPersianDigits(jy)} — ${weekDayName}`;
}

/* ------------------------------------------------------------------ */
/*  Calendar Day Cell                                                  */
/* ------------------------------------------------------------------ */

interface DayCellProps {
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  date: Date;
  eventDots: { color: string }[];
  taskDots: boolean;
  onClick: () => void;
}

function DayCell({
  day,
  isCurrentMonth,
  isToday,
  isSelected,
  date,
  eventDots,
  taskDots,
  onClick,
}: DayCellProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex h-full min-h-[72px] flex-col items-center gap-1 rounded-lg border border-transparent p-2 text-center transition-all duration-200 sm:min-h-[88px]',
        isCurrentMonth
          ? 'text-foreground hover:bg-accent/60'
          : 'text-muted-foreground/40 hover:bg-accent/30',
        isToday && !isSelected && 'ring-2 ring-primary/60 ring-offset-1 ring-offset-background',
        isSelected && 'bg-primary/10 border-primary/30 shadow-sm'
      )}
    >
      <span
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium transition-colors',
          isToday && !isSelected && 'bg-primary text-primary-foreground',
          isSelected && 'bg-primary/15 text-primary font-bold'
        )}
      >
        {toPersianDigits(day)}
      </span>

      {/* Dot indicators */}
      <div className="flex items-center gap-0.5 flex-wrap justify-center mt-auto">
        {eventDots.slice(0, 3).map((dot, i) => (
          <span
            key={`ev-${i}`}
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: dot.color }}
          />
        ))}
        {taskDots && (
          <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
        )}
        {eventDots.length > 3 && (
          <span className="text-[8px] text-muted-foreground">
            +{toPersianDigits(eventDots.length - 3)}
          </span>
        )}
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Selected Date Panel                                                */
/* ------------------------------------------------------------------ */

function SelectedDatePanel({
  jy,
  jm,
  jd,
  events,
  tasks,
  onToggleTask,
  onDeleteEvent,
}: {
  jy: number;
  jm: number;
  jd: number;
  events: CalendarEvent[];
  tasks: Task[];
  onToggleTask: (task: Task) => void;
  onDeleteEvent: (eventId: string) => void;
}) {
  const dateDisplay = formatSelectedDateDisplay(jy, jm, jd);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{dateDisplay}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Events section */}
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <CalendarDays className="h-4 w-4 text-primary" />
              رویدادها
              {events.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5">
                  {toPersianDigits(events.length)}
                </Badge>
              )}
            </h4>
            {events.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                رویدادی برای این روز وجود ندارد
              </p>
            ) : (
              <ScrollArea className="max-h-[240px]">
                <div className="space-y-2">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="group flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
                    >
                      <span
                        className="mt-1 h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: event.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-relaxed">
                          {event.title}
                        </p>
                        {event.description && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                            {event.description}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                          {event.isAllDay ? (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              تمام روز
                            </span>
                          ) : (
                            event.startTime && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {event.startTime}
                                {event.endTime ? ` — ${event.endTime}` : ''}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                        onClick={() => onDeleteEvent(event.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          <Separator />

          {/* Tasks due section */}
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Calendar className="h-4 w-4 text-orange-500" />
              وظایف سررسید
              {tasks.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5">
                  {toPersianDigits(tasks.length)}
                </Badge>
              )}
            </h4>
            {tasks.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                وظیفه‌ای برای این روز تعریف نشده است
              </p>
            ) : (
              <ScrollArea className="max-h-[240px]">
                <div className="space-y-2">
                  {tasks.map((task) => {
                    const isDone = task.status === 'done';
                    return (
                      <div
                        key={task.id}
                        className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
                      >
                        <Checkbox
                          checked={isDone}
                          onCheckedChange={() => onToggleTask(task)}
                          className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              'text-sm font-medium leading-relaxed',
                              isDone && 'text-muted-foreground line-through'
                            )}
                          >
                            {task.title}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="gap-1 text-[10px]"
                            >
                              <span
                                className="inline-block h-2 w-2 rounded-full"
                                style={{
                                  backgroundColor: PRIORITY_COLORS[task.priority],
                                }}
                              />
                              {PRIORITY_LABELS[task.priority]}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Calendar Page                                                 */
/* ------------------------------------------------------------------ */

export default function CalendarPage() {
  const { calendarEvents, tasks, settings, setSettings } = useAppStore();
  const queryClient = useQueryClient();

  // Initialize current month/year from today
  const todayJalaali = useMemo(() => toJalaali(new Date()), []);

  const [currentJalaaliYear, setCurrentJalaaliYear] = useState(todayJalaali.jy);
  const [currentJalaaliMonth, setCurrentJalaaliMonth] = useState(todayJalaali.jm);
  const [selectedDate, setSelectedDate] = useState<JalaaliDate | null>(todayJalaali);
  const [showAddEventDialog, setShowAddEventDialog] = useState(false);

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    isAllDay: true,
    color: COLOR_PRESETS[0],
  });

  /* ---------- computed ---------- */

  const monthName = getJalaaliMonthName(currentJalaaliMonth);
  const weekDayHeaders = getJalaaliWeekDaysHeader();

  const calendarDays = useMemo(
    () => getJalaaliMonthDays(currentJalaaliYear, currentJalaaliMonth),
    [currentJalaaliYear, currentJalaaliMonth]
  );

  // Build a map of dateKey -> events for quick lookup
  const eventsByDateKey = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const event of calendarEvents) {
      const key = event.date; // stored as jy/jm/jd
      if (!map[key]) map[key] = [];
      map[key].push(event);
    }
    return map;
  }, [calendarEvents]);

  // Build a map of dateKey -> tasks due on that day
  const tasksByDateKey = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const task of tasks) {
      if (task.dueDate && !task.isArchived) {
        const d = new Date(task.dueDate);
        const key = formatJalaaliDateKey(d);
        if (!map[key]) map[key] = [];
        map[key].push(task);
      }
    }
    return map;
  }, [tasks]);

  // Selected date events and tasks
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    const key = `${selectedDate.jy}/${selectedDate.jm}/${selectedDate.jd}`;
    return eventsByDateKey[key] || [];
  }, [selectedDate, eventsByDateKey]);

  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    const key = `${selectedDate.jy}/${selectedDate.jm}/${selectedDate.jd}`;
    return tasksByDateKey[key] || [];
  }, [selectedDate, tasksByDateKey]);

  /* ---------- mutations ---------- */

  const createEventMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/calendar-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('خطا در ایجاد رویداد');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      setShowAddEventDialog(false);
      setNewEvent({
        title: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        isAllDay: true,
        color: COLOR_PRESETS[0],
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/calendar-events?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('خطا در حذف رویداد');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });

  const toggleTaskDoneMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  /* ---------- handlers ---------- */

  const handlePrevMonth = useCallback(() => {
    if (currentJalaaliMonth === 1) {
      setCurrentJalaaliMonth(12);
      setCurrentJalaaliYear((y) => y - 1);
    } else {
      setCurrentJalaaliMonth((m) => m - 1);
    }
  }, [currentJalaaliMonth]);

  const handleNextMonth = useCallback(() => {
    if (currentJalaaliMonth === 12) {
      setCurrentJalaaliMonth(1);
      setCurrentJalaaliYear((y) => y + 1);
    } else {
      setCurrentJalaaliMonth((m) => m + 1);
    }
  }, [currentJalaaliMonth]);

  const handleDayClick = useCallback(
    (cell: { day: number; isCurrentMonth: boolean; date: Date }) => {
      const j = toJalaali(cell.date);
      setSelectedDate(j);

      // If clicking on a previous/next month day, navigate to that month
      if (!cell.isCurrentMonth) {
        setCurrentJalaaliMonth(j.jm);
        setCurrentJalaaliYear(j.jy);
      }
    },
    []
  );

  const handleToggleCalendarType = useCallback(() => {
    const next = settings.calendarType === 'shamsi' ? 'miladi' : 'shamsi';
    setSettings({ calendarType: next });
  }, [settings.calendarType, setSettings]);

  const handleOpenAddEvent = useCallback(() => {
    if (selectedDate) {
      setNewEvent((prev) => ({
        ...prev,
        date: `${selectedDate.jy}/${selectedDate.jm}/${selectedDate.jd}`,
      }));
    }
    setShowAddEventDialog(true);
  }, [selectedDate]);

  const handleSubmitEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title.trim() || !newEvent.date) return;

    createEventMutation.mutate({
      title: newEvent.title.trim(),
      description: newEvent.description.trim() || null,
      date: newEvent.date,
      startTime: newEvent.isAllDay ? null : (newEvent.startTime || null),
      endTime: newEvent.isAllDay ? null : (newEvent.endTime || null),
      isAllDay: newEvent.isAllDay,
      color: newEvent.color,
    });
  };

  const handleDeleteEvent = useCallback(
    (eventId: string) => {
      deleteEventMutation.mutate(eventId);
    },
    [deleteEventMutation]
  );

  const handleToggleTask = useCallback(
    (task: Task) => {
      const newStatus = task.status === 'done' ? 'todo' : 'done';
      toggleTaskDoneMutation.mutate({ id: task.id, status: newStatus });
    },
    [toggleTaskDoneMutation]
  );

  /* ---------- render ---------- */

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            تقویم
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Calendar type toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleCalendarType}
            className="gap-1.5 text-xs"
          >
            {settings.calendarType === 'shamsi' ? 'شمسی' : 'میلادی'}
          </Button>
          <Button
            size="sm"
            onClick={handleOpenAddEvent}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            رویداد
          </Button>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between rounded-xl border bg-card p-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevMonth}
          className="h-9 w-9"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold">
            {monthName} {toPersianDigits(currentJalaaliYear)}
          </h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextMonth}
          className="h-9 w-9"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Main content: Calendar grid + Selected date panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Calendar Grid */}
        <Card className="overflow-hidden py-0">
          {/* Week day headers */}
          <div className="grid grid-cols-7 border-b bg-muted/30">
            {weekDayHeaders.map((day, i) => (
              <div
                key={i}
                className="flex items-center justify-center py-2.5 text-xs font-semibold text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {calendarDays.map((cell, idx) => {
              const dateKey = formatJalaaliDateKey(cell.date);
              const dayEvents = eventsByDateKey[dateKey] || [];
              const dayTasks = tasksByDateKey[dateKey] || [];
              const hasTasks = dayTasks.length > 0;

              const eventDots = dayEvents.map((ev) => ({ color: ev.color }));

              const isSelected =
                selectedDate !== null &&
                toJalaali(cell.date).jy === selectedDate.jy &&
                toJalaali(cell.date).jm === selectedDate.jm &&
                toJalaali(cell.date).jd === selectedDate.jd;

              return (
                <div
                  key={idx}
                  className={cn(
                    'border-b border-l last:border-l-0',
                    // Remove bottom border on last row
                    idx >= 35 && 'border-b-0'
                  )}
                >
                  <DayCell
                    day={cell.day}
                    isCurrentMonth={cell.isCurrentMonth}
                    isToday={cell.isToday}
                    isSelected={isSelected}
                    date={cell.date}
                    eventDots={eventDots}
                    taskDots={hasTasks}
                    onClick={() => handleDayClick(cell)}
                  />
                </div>
              );
            })}
          </div>
        </Card>

        {/* Selected Date Panel */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          {selectedDate ? (
            <SelectedDatePanel
              jy={selectedDate.jy}
              jm={selectedDate.jm}
              jd={selectedDate.jd}
              events={selectedDateEvents}
              tasks={selectedDateTasks}
              onToggleTask={handleToggleTask}
              onDeleteEvent={handleDeleteEvent}
            />
          ) : (
            <Card className="flex h-64 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                یک روز را از تقویم انتخاب کنید
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Add Event Dialog */}
      <Dialog open={showAddEventDialog} onOpenChange={setShowAddEventDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>رویداد جدید</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitEvent} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">عنوان رویداد *</label>
              <Input
                value={newEvent.title}
                onChange={(e) =>
                  setNewEvent((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="مثلاً: جلسه تیم"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">تاریخ</label>
              <Input
                value={newEvent.date}
                onChange={(e) =>
                  setNewEvent((p) => ({ ...p, date: e.target.value }))
                }
                placeholder="۱۴۰۵/۴/۱۵"
                readOnly
                className="bg-muted/50"
              />
              <p className="text-[11px] text-muted-foreground">
                تاریخ بر اساس روز انتخاب‌شده در تقویم تنظیم شده است
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="all-day-check"
                checked={newEvent.isAllDay}
                onCheckedChange={(checked) =>
                  setNewEvent((p) => ({ ...p, isAllDay: !!checked }))
                }
              />
              <label
                htmlFor="all-day-check"
                className="cursor-pointer text-sm font-medium"
              >
                تمام روز
              </label>
            </div>

            {!newEvent.isAllDay && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">ساعت شروع</label>
                  <Input
                    type="time"
                    value={newEvent.startTime}
                    onChange={(e) =>
                      setNewEvent((p) => ({ ...p, startTime: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">ساعت پایان</label>
                  <Input
                    type="time"
                    value={newEvent.endTime}
                    onChange={(e) =>
                      setNewEvent((p) => ({ ...p, endTime: e.target.value }))
                    }
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">رنگ</label>
              <div className="flex flex-wrap gap-2.5">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() =>
                      setNewEvent((p) => ({ ...p, color }))
                    }
                    className={cn(
                      'h-8 w-8 rounded-full transition-all duration-200',
                      newEvent.color === color
                        ? 'ring-2 ring-offset-2 ring-offset-background scale-110'
                        : 'hover:scale-110'
                    )}
                    style={{
                      backgroundColor: color,
                      ...(newEvent.color === color ? { ringColor: color } : {}),
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">توضیحات</label>
              <Textarea
                value={newEvent.description}
                onChange={(e) =>
                  setNewEvent((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="توضیحات اختیاری درباره رویداد"
                rows={3}
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddEventDialog(false)}
              >
                انصراف
              </Button>
              <Button
                type="submit"
                disabled={
                  !newEvent.title.trim() ||
                  !newEvent.date ||
                  createEventMutation.isPending
                }
              >
                {createEventMutation.isPending ? 'در حال ایجاد...' : 'ایجاد رویداد'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}