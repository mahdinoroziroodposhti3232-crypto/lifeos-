'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Repeat,
  Trash2,
  Edit3,
  Flame,
  Check,
  Circle,
  X,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAppStore } from '@/lib/store';
import { toJalaali, formatJalaaliDateShort, type JalaaliDate } from '@/lib/jalali';
import { cn } from '@/lib/utils';
import {
  HABIT_FREQUENCY_LABELS,
  type Habit,
  type HabitFrequency,
} from '@/types';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/layout/empty-state';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PRESET_COLORS = [
  '#10b981',
  '#3b82f6',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
];

const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

function toPersianNum(num: number): string {
  return String(num).replace(/\d/g, (d) => persianDigits[parseInt(d)]);
}

/* ------------------------------------------------------------------ */
/*  Helper Functions                                                   */
/* ------------------------------------------------------------------ */

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function jalaaliDateKey(jd: JalaaliDate): string {
  return `${jd.jy}/${String(jd.jm).padStart(2, '0')}/${String(jd.jd).padStart(2, '0')}`;
}

function getLast7Days(weekOffset: number): Date[] {
  const days: Date[] = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + weekOffset * 7);
  for (let i = 6; i >= 0; i--) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    days.push(date);
  }
  return days;
}

function isRecordedForDate(habit: Habit, date: Date): boolean {
  if (!habit.records || habit.records.length === 0) return false;
  const dateStr = formatDateKey(date);
  return habit.records.some((r) => {
    const recordDate = new Date(r.date);
    return formatDateKey(recordDate) === dateStr;
  });
}

function getRecordForDate(habit: Habit, date: Date) {
  if (!habit.records || habit.records.length === 0) return null;
  const dateStr = formatDateKey(date);
  return habit.records.find((r) => {
    const recordDate = new Date(r.date);
    return formatDateKey(recordDate) === dateStr;
  }) ?? null;
}

function calculateStreak(habit: Habit): number {
  if (!habit.records || habit.records.length === 0) return 0;

  const todayKey = formatDateKey(new Date());
  const recordDates = habit.records
    .map((r) => formatDateKey(new Date(r.date)))
    .sort()
    .reverse();

  // Remove duplicates
  const uniqueDates = [...new Set(recordDates)];

  // Check if today is recorded; if not, check yesterday (streak might still be valid)
  let startIndex = 0;
  if (uniqueDates[0] !== todayKey) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = formatDateKey(yesterday);
    if (uniqueDates[0] !== yesterdayKey) return 0;
  }

  let streak = 0;
  const checkDate = new Date();
  if (uniqueDates[0] !== todayKey) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  for (let i = 0; i < 365; i++) {
    const key = formatDateKey(checkDate);
    if (uniqueDates.includes(key)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

function calculateCompletionRate(habit: Habit, last7Days: Date[]): number {
  if (!habit.records || habit.records.length === 0) return 0;
  const completed = last7Days.filter((d) => isRecordedForDate(habit, d)).length;
  return Math.round((completed / 7) * 100);
}

function getWeekLabel(offset: number): string {
  if (offset === 0) return 'هفته جاری';
  if (offset === -1) return 'هفته قبل';
  if (offset === 1) return 'هفته بعد';
  if (offset < -1) return `${toPersianNum(Math.abs(offset))} هفته قبل`;
  return `${toPersianNum(offset)} هفته بعد`;
}

/* ------------------------------------------------------------------ */
/*  Habit Form Dialog State                                            */
/* ------------------------------------------------------------------ */

interface HabitFormData {
  title: string;
  description: string;
  frequency: HabitFrequency;
  targetCount: number;
  color: string;
}

const defaultFormData: HabitFormData = {
  title: '',
  description: '',
  frequency: 'daily',
  targetCount: 1,
  color: PRESET_COLORS[0],
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function HabitsPage() {
  const { habits, setHabits, settings } = useAppStore();
  const queryClient = useQueryClient();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Habit | null>(null);

  // Form state
  const [formData, setFormData] = useState<HabitFormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  /* ---------------------------------------------------------------- */
  /*  Fetch habits on mount                                            */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    async function fetchHabits() {
      try {
        const res = await fetch('/api/habits');
        if (res.ok) {
          const data = await res.json();
          setHabits(data);
        }
      } catch (err) {
        console.error('Error fetching habits:', err);
      }
    }
    fetchHabits();
  }, [setHabits]);

  /* ---------------------------------------------------------------- */
  /*  Mutations                                                        */
  /* ---------------------------------------------------------------- */

  const createHabitMutation = useMutation({
    mutationFn: async (data: HabitFormData) => {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description || undefined,
          frequency: data.frequency,
          targetCount: data.targetCount,
          color: data.color,
          userId: 'default',
        }),
      });
      if (!res.ok) throw new Error('خطا در ایجاد عادت');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      refetchHabits();
      closeDialog();
    },
  });

  const updateHabitMutation = useMutation({
    mutationFn: async (data: HabitFormData & { id: string }) => {
      const res = await fetch('/api/habits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: data.id,
          title: data.title,
          description: data.description || undefined,
          frequency: data.frequency,
          targetCount: data.targetCount,
          color: data.color,
        }),
      });
      if (!res.ok) throw new Error('خطا در بروزرسانی عادت');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      refetchHabits();
      closeDialog();
    },
  });

  const deleteHabitMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/habits?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('خطا در حذف عادت');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      refetchHabits();
      setDeleteTarget(null);
    },
  });

  const toggleRecordMutation = useMutation({
    mutationFn: async ({ habitId, recordId, add }: { habitId: string; recordId?: string; add: boolean }) => {
      if (add) {
        const today = new Date();
        const res = await fetch('/api/habits/records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            habitId,
            date: today.toISOString(),
            userId: 'default',
            value: true,
          }),
        });
        if (!res.ok) throw new Error('خطا در ثبت رکورد');
        return res.json();
      } else if (recordId) {
        const res = await fetch(`/api/habits/records?id=${recordId}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('خطا در حذف رکورد');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      refetchHabits();
    },
  });

  /* ---------------------------------------------------------------- */
  /*  Helpers                                                          */
  /* ---------------------------------------------------------------- */

  async function refetchHabits() {
    try {
      const res = await fetch('/api/habits');
      if (res.ok) {
        const data = await res.json();
        setHabits(data);
      }
    } catch (err) {
      console.error('Error refetching habits:', err);
    }
  }

  function openAddDialog() {
    setEditingHabit(null);
    setFormData(defaultFormData);
    setFormErrors({});
    setShowAddDialog(true);
  }

  function openEditDialog(habit: Habit) {
    setEditingHabit(habit);
    setFormData({
      title: habit.title,
      description: habit.description || '',
      frequency: habit.frequency,
      targetCount: habit.targetCount,
      color: habit.color,
    });
    setFormErrors({});
    setShowAddDialog(true);
  }

  function closeDialog() {
    setShowAddDialog(false);
    setEditingHabit(null);
    setFormData(defaultFormData);
    setFormErrors({});
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) {
      errors.title = 'عنوان عادت الزامی است';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit() {
    if (!validateForm()) return;
    if (editingHabit) {
      updateHabitMutation.mutate({ ...formData, id: editingHabit.id });
    } else {
      createHabitMutation.mutate(formData);
    }
  }

  function handleToggleToday(habit: Habit) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existingRecord = getRecordForDate(habit, today);

    if (existingRecord) {
      toggleRecordMutation.mutate({
        habitId: habit.id,
        recordId: existingRecord.id,
        add: false,
      });
    } else {
      toggleRecordMutation.mutate({
        habitId: habit.id,
        add: true,
      });
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Computed                                                         */
  /* ---------------------------------------------------------------- */

  const last7Days = useMemo(() => getLast7Days(currentWeekOffset), [currentWeekOffset]);

  const todayKey = useMemo(() => formatDateKey(new Date()), []);

  const habitsWithStats = useMemo(() => {
    return habits.map((habit) => ({
      habit,
      streak: calculateStreak(habit),
      completionRate: calculateCompletionRate(habit, last7Days),
      isTodayCompleted: isRecordedForDate(habit, new Date()),
    }));
  }, [habits, last7Days]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">عادت‌ها</h1>
          <p className="text-sm text-muted-foreground mt-1">
            عادت‌های خود را دنبال کنید
          </p>
        </div>

        <Button onClick={openAddDialog} className="gap-2 rounded-xl">
          <Plus className="h-4 w-4" />
          عادت جدید
        </Button>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => setCurrentWeekOffset((prev) => prev - 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="min-w-[140px] text-center text-sm font-medium text-foreground">
          {getWeekLabel(currentWeekOffset)}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
          disabled={currentWeekOffset >= 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {currentWeekOffset !== 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="mr-2 text-xs text-muted-foreground"
            onClick={() => setCurrentWeekOffset(0)}
          >
            بازگشت به هفته جاری
          </Button>
        )}
      </div>

      {/* Content */}
      {habitsWithStats.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="هنوز عادتی ثبت نکرده‌اید"
          description="با ایجاد عادت‌های جدید، بهره‌وری خود را افزایش دهید و پیشرفت روزانه خود را دنبال کنید."
          action={{
            label: '+ عادت جدید',
            onClick: openAddDialog,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {habitsWithStats.map(({ habit, streak, completionRate, isTodayCompleted }, index) => (
              <motion.div
                key={habit.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.05,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                <Card className="group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:border-border">
                  {/* Color accent strip */}
                  <div
                    className="absolute top-0 right-0 h-1 w-full"
                    style={{ backgroundColor: habit.color }}
                  />

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="h-3 w-3 shrink-0 rounded-full shadow-sm"
                          style={{ backgroundColor: habit.color }}
                        />
                        <CardTitle className="truncate text-sm font-semibold">
                          {habit.title}
                        </CardTitle>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEditDialog(habit)}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(habit)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Description */}
                    {habit.description && (
                      <CardDescription className="mt-1 line-clamp-1 text-xs">
                        {habit.description}
                      </CardDescription>
                    )}

                    {/* Badges row */}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-2 py-0 h-5 font-medium"
                      >
                        {HABIT_FREQUENCY_LABELS[habit.frequency]}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-2 py-0 h-5"
                      >
                        هدف: {toPersianNum(habit.targetCount)} بار {habit.frequency === 'daily' ? 'در روز' : habit.frequency === 'weekly' ? 'در هفته' : 'در ماه'}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* 7-Day Contribution Grid */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground font-medium">
                          ۷ روز اخیر
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {completionRate > 0 ? `${toPersianNum(completionRate)}٪` : ''}
                        </span>
                      </div>

                      <div className="flex items-center justify-center gap-2" dir="ltr">
                        {last7Days.map((day) => {
                          const jDate = toJalaali(day);
                          const dayKey = formatDateKey(day);
                          const isRecorded = isRecordedForDate(habit, day);
                          const isToday = dayKey === todayKey;

                          return (
                            <div key={dayKey} className="flex flex-col items-center gap-1.5">
                              <span className="text-[10px] text-muted-foreground tabular-nums">
                                {jDate.jd}
                              </span>
                              <button
                                className={cn(
                                  'h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full transition-all duration-200',
                                  isRecorded
                                    ? 'scale-100 shadow-sm'
                                    : 'scale-90 bg-muted-foreground/15 hover:bg-muted-foreground/25',
                                  isToday && !isRecorded && 'ring-2 ring-offset-1 ring-offset-background',
                                  isToday && 'h-2.5 w-2.5 sm:h-3 sm:w-3'
                                )}
                                style={
                                  isRecorded
                                    ? {
                                        backgroundColor: habit.color,
                                        boxShadow: isToday
                                          ? `0 0 8px ${habit.color}40`
                                          : `0 0 4px ${habit.color}30`,
                                      }
                                    : isToday
                                      ? { '--tw-ring-color': habit.color } as React.CSSProperties
                                      : undefined
                                }
                                title={`${jalaaliDateKey(jDate)} - ${isRecorded ? 'انجام شده' : 'انجام نشده'}`}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Flame
                          className="h-3.5 w-3.5"
                          style={{ color: streak > 0 ? '#f59e0b' : undefined }}
                        />
                        <span
                          className={cn(
                            'text-xs font-medium tabular-nums',
                            streak > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
                          )}
                        >
                          {streak > 0 ? `${toPersianNum(streak)} روز متوالی` : 'بدون استریک'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Progress
                          value={completionRate}
                          className="h-1.5 w-16"
                        />
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                          {toPersianNum(completionRate)}٪
                        </span>
                      </div>
                    </div>

                    {/* Today Toggle */}
                    <Button
                      variant={isTodayCompleted ? 'outline' : 'default'}
                      size="sm"
                      className={cn(
                        'w-full gap-2 rounded-xl text-xs font-medium transition-all duration-200',
                        isTodayCompleted && 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400 dark:hover:bg-green-950/50'
                      )}
                      style={!isTodayCompleted ? { backgroundColor: habit.color, borderColor: habit.color } : undefined}
                      onClick={() => handleToggleToday(habit)}
                      disabled={toggleRecordMutation.isPending}
                    >
                      {isTodayCompleted ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          امروز انجام شد
                        </>
                      ) : (
                        <>
                          <Circle className="h-3.5 w-3.5" />
                          انجام دادم امروز
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto max-w-full sm:max-w-[460px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">
              {editingHabit ? 'ویرایش عادت' : 'عادت جدید'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                عنوان <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="مثلاً: ورزش، مطالعه، مدیتیشن..."
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                className={cn(formErrors.title && 'border-destructive')}
              />
              {formErrors.title && (
                <p className="text-xs text-destructive">{formErrors.title}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">توضیحات</label>
              <Textarea
                placeholder="توضیح مختصری درباره این عادت..."
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Frequency */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">تکرار</label>
              <Select
                value={formData.frequency}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, frequency: val as HabitFrequency }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(HABIT_FREQUENCY_LABELS) as [HabitFrequency, string][]).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Target Count */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                تعداد هدف در {formData.frequency === 'daily' ? 'هر روز' : formData.frequency === 'weekly' ? 'هر هفته' : 'هر ماه'}
              </label>
              <Input
                type="number"
                min={1}
                max={100}
                value={formData.targetCount}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    targetCount: Math.max(1, parseInt(e.target.value) || 1),
                  }))
                }
                className="w-full"
              />
            </div>

            {/* Color Picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">رنگ</label>
              <div className="flex flex-wrap gap-2.5">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      'h-8 w-8 rounded-full transition-all duration-200',
                      formData.color === color
                        ? 'scale-110 ring-2 ring-offset-2 ring-offset-background shadow-md'
                        : 'scale-100 hover:scale-105 opacity-70 hover:opacity-100'
                    )}
                    style={{
                      backgroundColor: color,
                      ...(formData.color === color ? { '--tw-ring-color': color } as React.CSSProperties : {}),
                    }}
                    onClick={() => setFormData((prev) => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={closeDialog}
              className="rounded-xl"
            >
              انصراف
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createHabitMutation.isPending || updateHabitMutation.isPending}
              className="rounded-xl"
            >
              {createHabitMutation.isPending || updateHabitMutation.isPending
                ? 'در حال ذخیره...'
                : editingHabit
                  ? 'بروزرسانی'
                  : 'ایجاد عادت'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف عادت</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف عادت «{deleteTarget?.title}» اطمینان دارید؟ تمام رکوردهای مرتبط نیز حذف خواهد شد. این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl">انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  deleteHabitMutation.mutate(deleteTarget.id);
                }
              }}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteHabitMutation.isPending ? 'در حال حذف...' : 'حذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}