'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Settings2,
  Clock,
  CheckCircle2,
  Coffee,
  Sofa,
  Target,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { toJalaali, formatJalaaliDateShort } from '@/lib/jalali';
import type { FocusType, Task } from '@/types';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MODE_LABELS: Record<FocusType, string> = {
  pomodoro: 'حالت تمرکز',
  'short-break': 'استراحت کوتاه',
  'long-break': 'استراحت بلند',
};

const MODE_BUTTONS: { value: FocusType; label: string }[] = [
  { value: 'pomodoro', label: 'تمرکز' },
  { value: 'short-break', label: 'استراحت کوتاه' },
  { value: 'long-break', label: 'استراحت بلند' },
];

const MODE_COLORS: Record<FocusType, { ring: string; bg: string; text: string; stroke: string }> = {
  pomodoro: {
    ring: 'from-emerald-400 via-green-500 to-teal-500',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-500',
    stroke: '#10b981',
  },
  'short-break': {
    ring: 'from-blue-400 via-sky-500 to-cyan-500',
    bg: 'bg-blue-500/10',
    text: 'text-blue-500',
    stroke: '#3b82f6',
  },
  'long-break': {
    ring: 'from-purple-400 via-violet-500 to-fuchsia-500',
    bg: 'bg-purple-500/10',
    text: 'text-purple-500',
    stroke: '#8b5cf6',
  },
};

const CIRCLE_RADIUS = 140;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function toPersianDigits(val: string | number): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(val).replace(/\d/g, (d) => persianDigits[parseInt(d)]);
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${toPersianDigits(String(mins).padStart(2, '0'))}:${toPersianDigits(String(secs).padStart(2, '0'))}`;
}

function getTodayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getDurationForMode(
  mode: FocusType,
  settings: { pomodoroDuration: number; shortBreakDuration: number; longBreakDuration: number }
): number {
  switch (mode) {
    case 'pomodoro':
      return settings.pomodoroDuration * 60;
    case 'short-break':
      return settings.shortBreakDuration * 60;
    case 'long-break':
      return settings.longBreakDuration * 60;
  }
}

function formatFocusTime(totalMinutes: number): string {
  if (totalMinutes < 60) {
    return `${toPersianDigits(totalMinutes)} دقیقه`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (mins === 0) return `${toPersianDigits(hours)} ساعت`;
  return `${toPersianDigits(hours)} ساعت و ${toPersianDigits(mins)} دقیقه`;
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
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function FocusPage() {
  const { tasks, focusSessions, settings, setSettings } = useAppStore();
  const queryClient = useQueryClient();

  /* ---- local state ---- */
  const [mode, setMode] = useState<FocusType>('pomodoro');
  const [timeLeft, setTimeLeft] = useState(getDurationForMode('pomodoro', settings));
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const originalDuration = useMemo(
    () => getDurationForMode(mode, settings),
    [mode, settings]
  );

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ---- eligible tasks ---- */
  const eligibleTasks = useMemo(
    () => tasks.filter((t: Task) => t.status === 'todo' || t.status === 'in-progress'),
    [tasks]
  );

  const selectedTask = useMemo(
    () => tasks.find((t: Task) => t.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId]
  );

  /* ---- today's sessions ---- */
  const todayStr = getTodayStr();
  const todaySessions = useMemo(
    () =>
      focusSessions.filter((s) => s.completedAt && s.completedAt.startsWith(todayStr)),
    [focusSessions, todayStr]
  );

  const todayTotalFocusMinutes = useMemo(
    () =>
      todaySessions
        .filter((s) => s.type === 'pomodoro')
        .reduce((acc, s) => acc + s.duration, 0),
    [todaySessions]
  );

  /* ---- progress ---- */
  const progress = originalDuration > 0 ? (originalDuration - timeLeft) / originalDuration : 0;
  const dashOffset = CIRCLE_CIRCUMFERENCE * (1 - progress);
  const colors = MODE_COLORS[mode];

  /* ---- timer logic ---- */
  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const handleTimerComplete = useCallback(() => {
    clearTimer();
    setIsRunning(false);

    /* play notification sound (Web Audio API) */
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.value = 0.3;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.stop(ctx.currentTime + 0.8);
    } catch {
      /* silent fallback */
    }

    if (mode === 'pomodoro') {
      toast.success('زمان تمرکز به پایان رسید! استراحت کنید.');
      setSessionCount((prev) => prev + 1);
    } else {
      toast.success('استراحت تمام شد! آماده تمرکز بعدی هستید؟');
    }
  }, [clearTimer, mode]);

  useEffect(() => {
    if (!isRunning) {
      clearTimer();
      return;
    }
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimerComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearTimer();
  }, [isRunning, clearTimer, handleTimerComplete]);

  /* auto-switch mode on timer complete */
  useEffect(() => {
    if (isRunning || timeLeft !== 0) return;

    if (mode === 'pomodoro') {
      const shouldLongBreak = sessionCount > 0 && sessionCount % settings.longBreakInterval === 0;
      const nextMode: FocusType = shouldLongBreak ? 'long-break' : 'short-break';
      setMode(nextMode);
      setTimeLeft(getDurationForMode(nextMode, settings));
    } else {
      setMode('pomodoro');
      setTimeLeft(getDurationForMode('pomodoro', settings));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isRunning]);

  /* ---- mutation: save session ---- */
  const saveSessionMutation = useMutation({
    mutationFn: async (payload: {
      type: FocusType;
      duration: number;
      taskId: string | null;
    }) => {
      const res = await fetch('/api/focus-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, userId: 'default' }),
      });
      if (!res.ok) throw new Error('خطا در ذخیره‌سازی');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-sessions'] });
    },
    onError: () => {
      toast.error('خطا در ذخیره‌سازی جلسه تمرکز');
    },
  });

  /* when timer completes, save to API */
  useEffect(() => {
    if (timeLeft === 0 && !isRunning) {
      saveSessionMutation.mutate({
        type: mode,
        duration: originalDuration / 60,
        taskId: selectedTaskId,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isRunning]);

  /* ---- controls ---- */
  const toggleTimer = () => setIsRunning((prev) => !prev);

  const resetTimer = () => {
    clearTimer();
    setIsRunning(false);
    setTimeLeft(getDurationForMode(mode, settings));
  };

  const skipTimer = () => {
    clearTimer();
    setIsRunning(false);
    setTimeLeft(0);
  };

  const switchMode = (newMode: FocusType) => {
    clearTimer();
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(getDurationForMode(newMode, settings));
  };

  /* ---- render ---- */
  return (
    <div className="h-full overflow-y-auto pb-8" dir="rtl">
      <div className="mx-auto max-w-3xl space-y-8 px-4 pt-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold">حالت تمرکز</h1>
            <p className="text-sm text-muted-foreground">با تکنیک پومودورو تمرکز خود را افزایش دهید</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className={cn(showSettings && 'bg-accent')}
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base">تنظیمات تایمر</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Pomodoro Duration */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>مدت تمرکز (دقیقه)</Label>
                        <span className="text-sm font-medium tabular-nums text-muted-foreground">
                          {toPersianDigits(settings.pomodoroDuration)}
                        </span>
                      </div>
                      <Slider
                        value={[settings.pomodoroDuration]}
                        onValueChange={([v]) => {
                          setSettings({ pomodoroDuration: v });
                          if (mode === 'pomodoro' && !isRunning) {
                            setTimeLeft(v * 60);
                          }
                        }}
                        min={1}
                        max={120}
                        step={1}
                      />
                    </div>

                    {/* Short Break Duration */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>استراحت کوتاه (دقیقه)</Label>
                        <span className="text-sm font-medium tabular-nums text-muted-foreground">
                          {toPersianDigits(settings.shortBreakDuration)}
                        </span>
                      </div>
                      <Slider
                        value={[settings.shortBreakDuration]}
                        onValueChange={([v]) => {
                          setSettings({ shortBreakDuration: v });
                          if (mode === 'short-break' && !isRunning) {
                            setTimeLeft(v * 60);
                          }
                        }}
                        min={1}
                        max={30}
                        step={1}
                      />
                    </div>

                    {/* Long Break Duration */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>استراحت بلند (دقیقه)</Label>
                        <span className="text-sm font-medium tabular-nums text-muted-foreground">
                          {toPersianDigits(settings.longBreakDuration)}
                        </span>
                      </div>
                      <Slider
                        value={[settings.longBreakDuration]}
                        onValueChange={([v]) => {
                          setSettings({ longBreakDuration: v });
                          if (mode === 'long-break' && !isRunning) {
                            setTimeLeft(v * 60);
                          }
                        }}
                        min={1}
                        max={60}
                        step={1}
                      />
                    </div>

                    {/* Long Break Interval */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>فاصله استراحت بلند (هر چند پومودورو)</Label>
                        <span className="text-sm font-medium tabular-nums text-muted-foreground">
                          {toPersianDigits(settings.longBreakInterval)}
                        </span>
                      </div>
                      <Slider
                        value={[settings.longBreakInterval]}
                        onValueChange={([v]) => setSettings({ longBreakInterval: v })}
                        min={1}
                        max={10}
                        step={1}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Task Selection */}
          {eligibleTasks.length > 0 && (
            <motion.div variants={itemVariants}>
              <div className="flex items-center gap-3">
                <Target className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Select
                  value={selectedTaskId ?? '__none__'}
                  onValueChange={(v) => setSelectedTaskId(v === '__none__' ? null : v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="وظیفه‌ای را برای تمرکز انتخاب کنید" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">بدون وظیفه</SelectItem>
                    {eligibleTasks.map((task: Task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}

          {/* Timer Card */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden">
              <CardContent className="flex flex-col items-center py-10">
                {/* Mode Selector */}
                <div className="mb-8 flex gap-2 rounded-xl bg-muted/50 p-1.5">
                  {MODE_BUTTONS.map((btn) => (
                    <button
                      key={btn.value}
                      onClick={() => switchMode(btn.value)}
                      className={cn(
                        'rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                        mode === btn.value
                          ? cn('bg-background text-foreground shadow-sm', colors.text)
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Circular Timer */}
                <div className="relative mb-6 flex items-center justify-center">
                  {/* Pulse animation when running */}
                  {isRunning && (
                    <motion.div
                      className={cn(
                        'absolute h-72 w-72 rounded-full opacity-20',
                        mode === 'pomodoro'
                          ? 'bg-emerald-500'
                          : mode === 'short-break'
                            ? 'bg-blue-500'
                            : 'bg-purple-500'
                      )}
                      animate={{
                        scale: [1, 1.08, 1],
                        opacity: [0.15, 0.25, 0.15],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  )}

                  <svg
                    width="300"
                    height="300"
                    viewBox="0 0 320 320"
                    className="-rotate-90"
                  >
                    <defs>
                      <linearGradient
                        id={`gradient-${mode}`}
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" className={colors.ring.split(' ')[0].replace('from-', '')} style={{ stopColor: colors.stroke, stopOpacity: 1 }} />
                        <stop offset="50%" style={{ stopColor: colors.stroke, stopOpacity: 0.7 }} />
                        <stop offset="100%" className={colors.ring.split(' ')[2].replace('to-', '')} style={{ stopColor: colors.stroke, stopOpacity: 1 }} />
                      </linearGradient>
                    </defs>

                    {/* Background circle */}
                    <circle
                      cx="160"
                      cy="160"
                      r={CIRCLE_RADIUS}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-muted/30"
                    />

                    {/* Progress circle */}
                    <motion.circle
                      cx="160"
                      cy="160"
                      r={CIRCLE_RADIUS}
                      fill="none"
                      stroke={colors.stroke}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={CIRCLE_CIRCUMFERENCE}
                      strokeDashoffset={dashOffset}
                      initial={false}
                      animate={{ strokeDashoffset: dashOffset }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      style={{
                        filter: `drop-shadow(0 0 8px ${colors.stroke}40)`,
                      }}
                    />
                  </svg>

                  {/* Timer Text */}
                  <div className="absolute flex flex-col items-center gap-1">
                    <span
                      className={cn(
                        'font-mono text-6xl font-bold tabular-nums tracking-tight',
                        colors.text
                      )}
                    >
                      {formatTime(timeLeft)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {MODE_LABELS[mode]}
                    </span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={resetTimer}
                    className="h-12 w-12 rounded-full"
                  >
                    <RotateCcw className="h-5 w-5" />
                  </Button>

                  <Button
                    size="icon"
                    onClick={toggleTimer}
                    className={cn(
                      'h-16 w-16 rounded-full shadow-lg transition-all duration-300',
                      isRunning
                        ? cn('bg-foreground text-background hover:bg-foreground/90')
                        : cn(
                            'bg-gradient-to-br',
                            colors.ring,
                            'text-white hover:opacity-90 shadow-lg'
                          )
                    )}
                  >
                    {isRunning ? (
                      <Pause className="h-7 w-7" />
                    ) : (
                      <Play className="h-7 w-7 mr-[-2px]" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={skipTimer}
                    className="h-12 w-12 rounded-full"
                  >
                    <SkipForward className="h-5 w-5" />
                  </Button>
                </div>

                {/* Selected task */}
                {selectedTask && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <Target className="h-3.5 w-3.5" />
                    <span>در حال تمرکز بر:</span>
                    <span className="font-medium text-foreground">{selectedTask.title}</span>
                  </motion.div>
                )}

                {/* Session count */}
                {sessionCount > 0 && (
                  <div className="mt-4 flex items-center gap-1.5">
                    {Array.from({ length: settings.longBreakInterval }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          'h-2.5 w-2.5 rounded-full transition-all duration-300',
                          i < sessionCount % settings.longBreakInterval || (sessionCount % settings.longBreakInterval === 0 && sessionCount > 0 && i < settings.longBreakInterval)
                            ? 'bg-emerald-500'
                            : 'bg-muted-foreground/20'
                        )}
                      />
                    ))}
                    <span className="mr-2 text-xs text-muted-foreground">
                      {toPersianDigits(sessionCount)} پومودورو
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Today's Sessions */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">جلسات امروز</CardTitle>
                  {todaySessions.length > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="h-3 w-3" />
                      مجموع تمرکز امروز: {formatFocusTime(todayTotalFocusMinutes)}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {todaySessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <CheckCircle2 className="mb-2 h-8 w-8 opacity-40" />
                    <p className="text-sm">هنوز جلسه‌ای امروز ندارید</p>
                    <p className="text-xs">یک جلسه تمرکز شروع کنید!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todaySessions.map((session, idx) => {
                      const sessionDate = new Date(session.completedAt);
                      const timeStr = toPersianDigits(
                        `${String(sessionDate.getHours()).padStart(2, '0')}:${String(sessionDate.getMinutes()).padStart(2, '0')}`
                      );
                      const typeLabel = MODE_LABELS[session.type];
                      const typeIcon =
                        session.type === 'pomodoro' ? (
                          <Clock className="h-3 w-3" />
                        ) : session.type === 'short-break' ? (
                          <Coffee className="h-3 w-3" />
                        ) : (
                          <Sofa className="h-3 w-3" />
                        );
                      const typeColor =
                        session.type === 'pomodoro'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : session.type === 'short-break'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : 'bg-purple-500/10 text-purple-600 dark:text-purple-400';

                      return (
                        <motion.div
                          key={session.id || idx}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-center justify-between rounded-lg border px-3 py-2.5"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className={cn('gap-1 text-xs', typeColor)}>
                              {typeIcon}
                              {typeLabel}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {toPersianDigits(session.duration)} دقیقه
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">{timeStr}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}