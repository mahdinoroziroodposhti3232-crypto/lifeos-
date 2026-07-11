'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  CheckSquare,
  FolderKanban,
  Repeat,
  Timer,
  Sparkles,
  CircleCheckBig,
  Inbox,
  Clock,
  MoreHorizontal,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAppStore } from '@/lib/store';
import { formatJalaaliDate, toJalaali, getJalaaliWeekDay } from '@/lib/jalali';
import { cn } from '@/lib/utils';
import { PRIORITY_COLORS, PRIORITY_LABELS, SHAMSI_WEEK_DAYS } from '@/types';
import type { Task } from '@/types';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

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
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function getTodayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isToday(dateStr?: string): boolean {
  if (!dateStr) return false;
  return dateStr === getTodayStr();
}

function getLast7DaysLabels(): string[] {
  const labels: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const idx = getJalaaliWeekDay(d);
    labels.push(SHAMSI_WEEK_DAYS[idx]);
  }
  return labels;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StatCard({
  icon: Icon,
  count,
  label,
  color,
}: {
  icon: React.ElementType;
  count: number;
  label: string;
  color: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="h-6 w-6" style={{ color }} />
        </div>
        <div className="min-w-0">
          <p className="text-3xl font-bold leading-none tabular-nums">{count}</p>
          <p className="mt-1 truncate text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskRow({
  task,
  onToggle,
}: {
  task: Task;
  onToggle: (id: string, done: boolean) => void;
}) {
  const priorityColor = PRIORITY_COLORS[task.priority];
  const isDone = task.status === 'done';

  return (
    <div className="group flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50">
      <Checkbox
        checked={isDone}
        onCheckedChange={(checked) => onToggle(task.id, !!checked)}
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
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: priorityColor }}
          />
          <span className="text-xs text-muted-foreground">
            {PRIORITY_LABELS[task.priority]}
          </span>
          {task.project && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {task.project.title}
            </Badge>
          )}
          {task.dueTime && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {task.dueTime}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectCard({
  projectId,
  title,
  color,
  taskCount,
  progress,
  onClick,
}: {
  projectId: string;
  title: string;
  color: string;
  taskCount: number;
  progress: number;
  onClick: () => void;
}) {
  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{title}</p>
            <p className="text-xs text-muted-foreground">{taskCount} وظیفه</p>
          </div>
          <span className="text-sm font-bold tabular-nums">{progress}%</span>
        </div>
        <Progress
          value={progress}
          className="mt-3 h-2"
          style={
            {
              '--progress-color': color,
            } as React.CSSProperties
          }
        />
      </CardContent>
    </Card>
  );
}

function HabitRow({
  habitId,
  name,
  color,
  targetCount,
  isCompletedToday,
  onToggle,
}: {
  habitId: string;
  name: string;
  color: string;
  targetCount: number;
  isCompletedToday: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-right transition-colors hover:bg-accent/50"
    >
      <div
        className="h-3 w-3 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="flex-1 text-sm">{name}</span>
      {isCompletedToday ? (
        <CircleCheckBig className="h-5 w-5 text-emerald-500" />
      ) : (
        <span className="text-xs text-muted-foreground">{targetCount} بار</span>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Dashboard Page                                                */
/* ------------------------------------------------------------------ */
export function DashboardPage() {
  const queryClient = useQueryClient();
  const {
    tasks,
    projects,
    habits,
    focusSessions,
    settings,
    setCurrentPage,
    setSelectedProjectId,
  } = useAppStore();

  /* ---------- derived data ---------- */
  const todayStr = getTodayStr();

  const todayTasks = useMemo(
    () => tasks.filter((t) => !t.isArchived && isToday(t.dueDate)),
    [tasks]
  );

  const activeProjects = useMemo(
    () => projects.filter((p) => p.status === 'active'),
    [projects]
  );

  const todayFocusMinutes = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return focusSessions
      .filter((s) => {
        const completed = new Date(s.completedAt);
        return completed >= today && s.type === 'pomodoro';
      })
      .reduce((sum, s) => sum + s.duration, 0);
  }, [focusSessions]);

  const todayHabits = useMemo(() => {
    return habits.map((h) => {
      const todayRecord = h.records?.find(
        (r) => r.date && isToday(r.date.split('T')[0])
      );
      return {
        id: h.id,
        title: h.title,
        color: h.color,
        targetCount: h.targetCount,
        isCompletedToday: !!todayRecord,
        recordId: todayRecord?.id ?? null,
      };
    });
  }, [habits]);

  /* ---------- chart data (mock last 7 days) ---------- */
  const chartData = useMemo(() => {
    const labels = getLast7DaysLabels();
    // Use actual completed-tasks data where possible, pad with realistic mock
    const data = labels.map((name, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const count = tasks.filter(
        (t) =>
          t.status === 'done' &&
          t.updatedAt &&
          t.updatedAt.startsWith(ds)
      ).length;
      return {
        name,
        done: count || Math.floor(Math.random() * 5) + 1,
      };
    });
    return data;
  }, [tasks]);

  /* ---------- mutations ---------- */
  const toggleTaskMutation = useMutation({
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

  const toggleHabitRecordMutation = useMutation({
    mutationFn: async ({ habitId }: { habitId: string }) => {
      // Toggle: if completed today, delete; otherwise create
      const habit = habits.find((h) => h.id === habitId);
      const existing = habit?.records?.find(
        (r) => r.date && isToday(r.date.split('T')[0])
      );
      if (existing) {
        await fetch(`/api/habits/records?id=${existing.id}`, { method: 'DELETE' });
      } else {
        await fetch('/api/habits/records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ habitId, date: todayStr, value: true }),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });

  /* ---------- handlers ---------- */
  const handleToggleTask = (id: string, done: boolean) => {
    toggleTaskMutation.mutate({ id, status: done ? 'done' : 'todo' });
  };

  const handleToggleHabit = (habitId: string) => {
    toggleHabitRecordMutation.mutate({ habitId });
  };

  const handleProjectClick = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentPage('project-detail');
  };

  /* ---------- AI suggestions ---------- */
  const aiSuggestions = [
    'شما ۳ وظیفه مهم امروز دارید. پیشنهاد می‌کنم با «طراحی صفحه اصلی» شروع کنید.',
    'عادت مطالعه شما ۵ روز متوالی انجام شده. به این روند ادامه دهید!',
    'پروژه «یادگیری زبان» ۶۰٪ پیشرفت دارد. با یک جلسه تمرکز ۲۵ دقیقه‌ای پیشرفت کنید.',
  ];

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */
  return (
    <motion.div
      className="mx-auto max-w-7xl space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Section 1 — Welcome + Date */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold">
              سلام! امروز {formatJalaaliDate(new Date())} است
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              خلاصه‌ای از روز شما
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Section 2 — Quick Stats */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <StatCard
          icon={CheckSquare}
          count={todayTasks.length}
          label="وظایف امروز"
          color="#14b8a6"
        />
        <StatCard
          icon={FolderKanban}
          count={activeProjects.length}
          label="پروژه‌های فعال"
          color="#3b82f6"
        />
        <StatCard
          icon={Repeat}
          count={todayHabits.filter((h) => h.isCompletedToday).length}
          label="عادت‌های امروز"
          color="#a855f7"
        />
        <StatCard
          icon={Timer}
          count={todayFocusMinutes}
          label="زمان تمرکز (دقیقه)"
          color="#f97316"
        />
      </motion.div>

      {/* Main 2-column grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Section 3 — Today's Tasks */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckSquare className="h-5 w-5 text-teal-500" />
                  وظایف امروز
                  <Badge variant="secondary" className="mr-auto text-xs">
                    {todayTasks.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-4 pb-4">
                {todayTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Inbox className="mb-2 h-10 w-10 opacity-40" />
                    <p className="text-sm">وظیفه‌ای برای امروز ندارید</p>
                  </div>
                ) : (
                  todayTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onToggle={handleToggleTask}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Section 4 — Active Projects */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FolderKanban className="h-5 w-5 text-blue-500" />
                  پروژه‌های فعال
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4">
                {activeProjects.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    پروژه فعالی ندارید
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {activeProjects.map((p) => (
                      <ProjectCard
                        key={p.id}
                        projectId={p.id}
                        title={p.title}
                        color={p.color}
                        taskCount={p._count?.tasks ?? 0}
                        progress={p.progress}
                        onClick={() => handleProjectClick(p.id)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right column (sidebar widgets) */}
        <div className="space-y-6">
          {/* Section 5 — Today's Habits */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Repeat className="h-5 w-5 text-purple-500" />
                  عادت‌های امروز
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                {todayHabits.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    عادتی ثبت نشده
                  </p>
                ) : (
                  todayHabits.map((h) => (
                    <HabitRow
                      key={h.id}
                      habitId={h.id}
                      name={h.title}
                      color={h.color}
                      targetCount={h.targetCount}
                      isCompletedToday={h.isCompletedToday}
                      onToggle={() => handleToggleHabit(h.id)}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Section 6 — Productivity Chart */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Timer className="h-5 w-5 text-orange-500" />
                  نمودار بهره‌وری هفتگی
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barCategoryGap="20%">
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: '1px solid hsl(var(--border))',
                          backgroundColor: 'hsl(var(--card))',
                          color: 'hsl(var(--card-foreground))',
                          fontSize: '12px',
                        }}
                        labelFormatter={(label) => `روز: ${label}`}
                        formatter={(value: number) => [`${value} وظیفه`, 'انجام شده']}
                      />
                      <Bar
                        dataKey="done"
                        fill="hsl(var(--primary))"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={36}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Section 7 — AI Suggestions */}
          <motion.div variants={itemVariants}>
            <div className="relative rounded-xl p-[2px]">
              {/* Gradient border */}
              <div
                className="pointer-events-none absolute inset-0 rounded-xl"
                style={{
                  background:
                    'linear-gradient(135deg, #6366f1, #a855f7, #ec4899, #f97316)',
                  borderRadius: 'inherit',
                }}
              />
              <Card className="relative overflow-hidden bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    پیشنهادهای هوشمند
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 px-6 pb-6">
                  {aiSuggestions.map((text, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg bg-accent/40 p-3"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                        {i + 1}
                      </span>
                      <p className="text-sm leading-relaxed">{text}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}