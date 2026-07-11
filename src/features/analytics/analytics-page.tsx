'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Clock,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';

import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { toJalaali, formatJalaaliDateShort } from '@/lib/jalali';
import {
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  SHAMSI_WEEK_DAYS,
} from '@/types';
import type { TaskPriority } from '@/types';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function toPersianDigits(num: number): string {
  return String(num).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
}

function getDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getLastNDays(n: number): Date[] {
  const days: Date[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

function getJalaaliWeekDayIndex(date: Date): number {
  const day = date.getDay(); // 0=Sun
  return (day + 1) % 7; // 0=Sat
}

function formatMinutes(totalMinutes: number): string {
  if (totalMinutes < 60) return `${toPersianDigits(totalMinutes)} دقیقه`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (m === 0) return `${toPersianDigits(h)} ساعت`;
  return `${toPersianDigits(h)} ساعت و ${toPersianDigits(m)} دقیقه`;
}

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

/* ------------------------------------------------------------------ */
/*  Custom Tooltip                                                     */
/* ------------------------------------------------------------------ */

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background/95 px-3 py-2 text-xs shadow-lg backdrop-blur-sm" dir="rtl">
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="text-muted-foreground">{item.name}:</span>
          <span className="font-medium">{toPersianDigits(item.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

type PeriodType = 'week' | 'month' | '3months';

export default function AnalyticsPage() {
  const { tasks, projects, habits, focusSessions, goals } = useAppStore();
  const [period, setPeriod] = useState<PeriodType>('week');

  const periodDays = period === 'week' ? 7 : period === 'month' ? 30 : 90;

  const startDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - periodDays);
    return d;
  }, [periodDays]);

  const startStr = getDateStr(startDate);
  const todayStr = getDateStr(new Date());

  /* ---- Filtered data for period ---- */
  const periodTasks = useMemo(
    () =>
      tasks.filter((t) => {
        if (!t.updatedAt) return false;
        return t.updatedAt >= startStr;
      }),
    [tasks, startStr]
  );

  const doneTasks = useMemo(
    () => periodTasks.filter((t) => t.status === 'done'),
    [periodTasks]
  );

  const totalTasks = useMemo(() => periodTasks.length, [periodTasks]);

  const periodSessions = useMemo(
    () =>
      focusSessions.filter((s) => {
        if (!s.completedAt) return false;
        return s.completedAt >= startStr;
      }),
    [focusSessions, startStr]
  );

  const totalFocusMinutes = useMemo(
    () => periodSessions.reduce((acc, s) => acc + s.duration, 0),
    [periodSessions]
  );

  const productivityScore = useMemo(() => {
    const taskScore = doneTasks.length * 10;
    const focusScore = Math.floor(totalFocusMinutes / 5);
    return taskScore + focusScore;
  }, [doneTasks.length, totalFocusMinutes]);

  const completionRate = totalTasks > 0 ? Math.round((doneTasks.length / totalTasks) * 100) : 0;

  const hasData = totalTasks > 0 || periodSessions.length > 0;

  /* ---- Chart 1: Task Completion Trend (last 7 days) ---- */
  const taskTrendData = useMemo(() => {
    const days = getLastNDays(7);
    return days.map((d) => {
      const ds = getDateStr(d);
      const completed = tasks.filter(
        (t) => t.status === 'done' && t.updatedAt && t.updatedAt.startsWith(ds)
      ).length;
      const dayIdx = getJalaaliWeekDayIndex(d);
      return {
        name: SHAMSI_WEEK_DAYS[dayIdx],
        completed,
      };
    });
  }, [tasks]);

  /* ---- Chart 2: Focus Time Distribution ---- */
  const focusDistributionData = useMemo(() => {
    const pomodoroMinutes = periodSessions
      .filter((s) => s.type === 'pomodoro')
      .reduce((a, s) => a + s.duration, 0);
    const shortBreakMinutes = periodSessions
      .filter((s) => s.type === 'short-break')
      .reduce((a, s) => a + s.duration, 0);
    const longBreakMinutes = periodSessions
      .filter((s) => s.type === 'long-break')
      .reduce((a, s) => a + s.duration, 0);
    return [
      { name: 'حالت تمرکز', value: pomodoroMinutes, color: '#10b981' },
      { name: 'استراحت کوتاه', value: shortBreakMinutes, color: '#3b82f6' },
      { name: 'استراحت بلند', value: longBreakMinutes, color: '#8b5cf6' },
    ].filter((d) => d.value > 0);
  }, [periodSessions]);

  /* ---- Chart 3: Tasks by Priority ---- */
  const priorityData = useMemo(() => {
    const priorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];
    return priorities.map((p) => ({
      name: PRIORITY_LABELS[p],
      count: periodTasks.filter((t) => t.priority === p).length,
      color: PRIORITY_COLORS[p],
    })).filter((d) => d.count > 0);
  }, [periodTasks]);

  /* ---- Chart 4: Habits Heatmap (last 28 days) ---- */
  const heatmapData = useMemo(() => {
    const days = getLastNDays(28);
    return days.map((d) => {
      const ds = getDateStr(d);
      const completedRecords = habits.reduce((acc, h) => {
        const records = h.records?.filter((r) => r.date === ds && r.count > 0) ?? [];
        return acc + records.length;
      }, 0);
      const totalHabits = habits.length;
      const rate = totalHabits > 0 ? completedRecords / totalHabits : 0;
      return {
        date: d,
        dateStr: formatJalaaliDateShort(d),
        completed: completedRecords,
        total: totalHabits,
        rate,
      };
    });
  }, [habits]);

  const getHeatmapColor = (rate: number): string => {
    if (rate === 0) return 'bg-muted/40';
    if (rate < 0.33) return 'bg-emerald-200 dark:bg-emerald-900/50';
    if (rate < 0.66) return 'bg-emerald-400 dark:bg-emerald-700';
    return 'bg-emerald-600 dark:bg-emerald-500';
  };

  /* ---- Chart 5: Project Progress ---- */
  const projectProgressData = useMemo(
    () => projects.filter((p) => p.progress > 0).map((p) => ({
      name: p.title,
      progress: p.progress,
      color: p.color,
    })),
    [projects]
  );

  /* ---- render ---- */
  return (
    <div className="h-full overflow-y-auto overflow-x-hidden pb-8" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8 px-3 sm:px-4 pt-6 sm:pt-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold">گزارش‌ها</h1>
            <p className="text-sm text-muted-foreground">تحلیل عملکرد شما</p>
          </div>
          <Tabs
            value={period}
            onValueChange={(v) => setPeriod(v as PeriodType)}
            dir="rtl"
          >
            <TabsList>
              <TabsTrigger value="week">این هفته</TabsTrigger>
              <TabsTrigger value="month">این ماه</TabsTrigger>
              <TabsTrigger value="3months">۳ ماه اخیر</TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {!hasData ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <BarChart3 className="mb-4 h-16 w-16 text-muted-foreground/20" />
            <p className="text-lg font-medium text-muted-foreground/60">
              هنوز داده‌ای برای نمایش گزارش ندارید.
            </p>
            <p className="mt-1 text-sm text-muted-foreground/40">
              شروع به استفاده از لایف‌او‌اس کنید!
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Stats Overview */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <Card>
                <CardContent className="flex flex-col gap-2 p-3 sm:p-5">
                  <div className="flex items-center justify-between">
                    <TrendingUp className="h-5 w-5 text-amber-500" />
                    <Badge variant="secondary" className="text-[10px]">
                      امتیاز
                    </Badge>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold tabular-nums">
                    {toPersianDigits(productivityScore)}
                  </div>
                  <p className="text-xs text-muted-foreground">امتیاز بهره‌وری</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex flex-col gap-2 p-3 sm:p-5">
                  <div className="flex items-center justify-between">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <Badge variant="secondary" className="text-[10px]">
                      وظیفه
                    </Badge>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold tabular-nums">
                    {toPersianDigits(doneTasks.length)}
                  </div>
                  <p className="text-xs text-muted-foreground">وظایف انجام شده</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex flex-col gap-2 p-3 sm:p-5">
                  <div className="flex items-center justify-between">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <Badge variant="secondary" className="text-[10px]">
                      زمان
                    </Badge>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold tabular-nums leading-9">
                    {formatMinutes(totalFocusMinutes)}
                  </div>
                  <p className="text-xs text-muted-foreground">زمان تمرکز</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex flex-col gap-2 p-3 sm:p-5">
                  <div className="flex items-center justify-between">
                    <BarChart3 className="h-5 w-5 text-purple-500" />
                    <Badge variant="secondary" className="text-[10px]">
                      درصد
                    </Badge>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold tabular-nums">
                    {toPersianDigits(completionRate)}
                    <span className="mr-0.5 text-lg text-muted-foreground">٪</span>
                  </div>
                  <p className="text-xs text-muted-foreground">نرخ انجام</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Charts Row 1 */}
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              {/* Chart 1: Task Completion Trend */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader className="pb-2 px-4 sm:px-6">
                    <CardTitle className="text-sm sm:text-base">روند انجام وظایف</CardTitle>
                    <CardDescription>۷ روز اخیر</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[180px] sm:h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={taskTrendData} barSize={28}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                            axisLine={false}
                            tickLine={false}
                            width={30}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar
                            dataKey="completed"
                            name="انجام شده"
                            fill="var(--primary)"
                            radius={[6, 6, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Chart 2: Focus Time Distribution */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">توزیع زمان تمرکز</CardTitle>
                    <CardDescription>نسبت زمان‌های مختلف</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {focusDistributionData.length === 0 ? (
                      <div className="flex h-[180px] sm:h-[260px] items-center justify-center text-sm text-muted-foreground">
                        داده‌ای موجود نیست
                      </div>
                    ) : (
                      <div className="h-[180px] sm:h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={focusDistributionData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={95}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {focusDistributionData.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const d = payload[0];
                                return (
                                  <div className="rounded-lg border bg-background/95 px-3 py-2 text-xs shadow-lg" dir="rtl">
                                    <p className="font-medium">{d.name}</p>
                                    <p className="text-muted-foreground">
                                      {formatMinutes(d.value as number)}
                                    </p>
                                  </div>
                                );
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        {/* Legend */}
                        <div className="mt-2 flex flex-wrap justify-center gap-4">
                          {focusDistributionData.map((d) => (
                            <div key={d.name} className="flex items-center gap-1.5 text-xs">
                              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                              <span className="text-muted-foreground">{d.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              {/* Chart 3: Tasks by Priority */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader className="pb-2 px-4 sm:px-6">
                    <CardTitle className="text-sm sm:text-base">وظایف بر اساس اولویت</CardTitle>
                    <CardDescription>توزیع اولویت‌ها</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {priorityData.length === 0 ? (
                      <div className="flex h-[180px] sm:h-[260px] items-center justify-center text-sm text-muted-foreground">
                        داده‌ای موجود نیست
                      </div>
                    ) : (
                      <div className="h-[180px] sm:h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={priorityData}
                            layout="vertical"
                            barSize={24}
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                            <XAxis
                              type="number"
                              allowDecimals={false}
                              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              dataKey="name"
                              type="category"
                              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                              axisLine={false}
                              tickLine={false}
                              width={50}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="count" name="تعداد" radius={[0, 6, 6, 0]}>
                              {priorityData.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Chart 4: Habits Heatmap */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">نقشه حرارتی عادت‌ها</CardTitle>
                    <CardDescription>۲۸ روز اخیر</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {habits.length === 0 ? (
                      <div className="flex h-[180px] sm:h-[260px] items-center justify-center text-sm text-muted-foreground">
                        عادتی ثبت نشده
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        {/* Day labels */}
                        <div className="grid grid-cols-7 gap-1.5" style={{ width: 'fit-content' }}>
                          {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((d) => (
                            <div
                              key={d}
                              className="flex h-5 w-5 sm:h-8 sm:w-8 items-center justify-center text-[10px] text-muted-foreground"
                            >
                              {d}
                            </div>
                          ))}
                        </div>
                        {/* Cells - 4 rows of 7 */}
                        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                          {heatmapData.map((cell, i) => (
                            <div
                              key={i}
                              className={cn(
                                'group relative h-6 w-6 sm:h-8 sm:w-8 rounded-md transition-all hover:scale-110',
                                getHeatmapColor(cell.rate)
                              )}
                              title={`${cell.dateStr} — ${toPersianDigits(cell.completed)}/${toPersianDigits(cell.total)}`}
                            >
                              {/* Tooltip */}
                              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 rounded bg-foreground px-2 py-1 text-[10px] text-background opacity-0 shadow-lg transition-opacity group-hover:opacity-100 whitespace-nowrap">
                                {cell.dateStr}
                                <br />
                                {toPersianDigits(cell.completed)} از {toPersianDigits(cell.total)}
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Legend */}
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>کم</span>
                          <div className="h-3 w-3 rounded-sm bg-muted/40" />
                          <div className="h-3 w-3 rounded-sm bg-emerald-200 dark:bg-emerald-900/50" />
                          <div className="h-3 w-3 rounded-sm bg-emerald-400 dark:bg-emerald-700" />
                          <div className="h-3 w-3 rounded-sm bg-emerald-600 dark:bg-emerald-500" />
                          <span>زیاد</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Chart 5: Project Progress */}
            {projectProgressData.length > 0 && (
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">پیشرفت پروژه‌ها</CardTitle>
                    <CardDescription>درصد تکمیل هر پروژه</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {projectProgressData.map((project) => (
                        <div key={project.name} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{project.name}</span>
                            <span className="text-muted-foreground tabular-nums">
                              {toPersianDigits(project.progress)}٪
                            </span>
                          </div>
                          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: project.color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${project.progress}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}