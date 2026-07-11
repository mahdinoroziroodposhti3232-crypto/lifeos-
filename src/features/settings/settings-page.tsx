'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sun,
  Moon,
  Monitor,
  CalendarDays,
  Timer,
  Info,
  RotateCcw,
  Paintbrush,
  ChevronLeft,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { UserSettings } from '@/types';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type SectionId = 'appearance' | 'calendar' | 'focus-timer' | 'about';

interface Section {
  id: SectionId;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const SECTIONS: Section[] = [
  {
    id: 'appearance',
    label: 'ظاهر',
    icon: <Paintbrush className="h-4 w-4" />,
    description: 'تم و رنگ‌بندی برنامه',
  },
  {
    id: 'calendar',
    label: 'تقویم',
    icon: <CalendarDays className="h-4 w-4" />,
    description: 'نوع تقویم و روز شروع هفته',
  },
  {
    id: 'focus-timer',
    label: 'تایمر تمرکز',
    icon: <Timer className="h-4 w-4" />,
    description: 'تنظیمات پومودورو',
  },
  {
    id: 'about',
    label: 'درباره',
    icon: <Info className="h-4 w-4" />,
    description: 'اطلاعات برنامه',
  },
];

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function toPersianDigits(num: number): string {
  return String(num).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
}

/* ------------------------------------------------------------------ */
/*  Section Components                                                 */
/* ------------------------------------------------------------------ */

function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const { settings } = useAppStore();

  const themeOptions = [
    { value: 'light', label: 'روشن', icon: <Sun className="h-4 w-4" /> },
    { value: 'dark', label: 'تاریک', icon: <Moon className="h-4 w-4" /> },
    { value: 'system', label: 'سیستم', icon: <Monitor className="h-4 w-4" /> },
  ] as const;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">تم برنامه</CardTitle>
            <CardDescription>حالت نمایش برنامه را انتخاب کنید</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={cn(
                    'flex flex-col items-center gap-2.5 rounded-xl border-2 p-4 transition-all duration-200',
                    theme === opt.value
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-border/80 hover:bg-muted/50'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                      theme === opt.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {opt.icon}
                  </div>
                  <span
                    className={cn(
                      'text-sm font-medium',
                      theme === opt.value ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Theme Preview */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">پیش‌نمایش</CardTitle>
            <CardDescription>نمایشی از تم فعلی</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border bg-background p-4 shadow-sm">
              <div className="space-y-3">
                <div className="h-3 w-24 rounded-full bg-foreground/80" />
                <div className="h-2 w-full rounded-full bg-muted" />
                <div className="h-2 w-4/5 rounded-full bg-muted" />
                <div className="mt-4 flex gap-2">
                  <div className="h-8 w-20 rounded-lg bg-primary" />
                  <div className="h-8 w-20 rounded-lg border border-border" />
                  <div className="h-8 w-20 rounded-lg border border-border" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function CalendarSection() {
  const { settings, setSettings } = useAppStore();

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">نوع تقویم</CardTitle>
            <CardDescription>نوع تقویم مورد استفاده را انتخاب کنید</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <button
                onClick={() => setSettings({ calendarType: 'shamsi' })}
                className={cn(
                  'flex-1 rounded-xl border-2 p-4 text-center transition-all',
                  settings.calendarType === 'shamsi'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                )}
              >
                <div className="text-lg font-bold">شمسی</div>
                <div className="text-xs text-muted-foreground mt-1">
                  جلالی / هجری شمسی
                </div>
              </button>
              <button
                onClick={() => setSettings({ calendarType: 'miladi' })}
                className={cn(
                  'flex-1 rounded-xl border-2 p-4 text-center transition-all',
                  settings.calendarType === 'miladi'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                )}
              >
                <div className="text-lg font-bold">میلادی</div>
                <div className="text-xs text-muted-foreground mt-1">
                  گرگوری / میلادی
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">روز شروع هفته</CardTitle>
            <CardDescription>اولین روز هفته در تقویم شما</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <button
                onClick={() => setSettings({ weekStart: 'saturday' })}
                className={cn(
                  'flex-1 rounded-xl border-2 p-4 text-center transition-all',
                  settings.weekStart === 'saturday'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                )}
              >
                <div className="text-lg font-bold">شنبه</div>
                <div className="text-xs text-muted-foreground mt-1">شنبه تا جمعه</div>
              </button>
              <button
                onClick={() => setSettings({ weekStart: 'sunday' })}
                className={cn(
                  'flex-1 rounded-xl border-2 p-4 text-center transition-all',
                  settings.weekStart === 'sunday'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                )}
              >
                <div className="text-lg font-bold">یکشنبه</div>
                <div className="text-xs text-muted-foreground mt-1">یکشنبه تا شنبه</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function FocusTimerSection() {
  const { settings, setSettings } = useAppStore();

  const fields = [
    {
      key: 'pomodoroDuration' as const,
      label: 'مدت تمرکز (دقیقه)',
      description: 'طول هر جلسه تمرکز پومودورو',
      min: 1,
      max: 120,
    },
    {
      key: 'shortBreakDuration' as const,
      label: 'استراحت کوتاه (دقیقه)',
      description: 'مدت استراحت بین جلسات تمرکز',
      min: 1,
      max: 30,
    },
    {
      key: 'longBreakDuration' as const,
      label: 'استراحت بلند (دقیقه)',
      description: 'مدت استراحت بعد از چند جلسه متوالی',
      min: 1,
      max: 60,
    },
    {
      key: 'longBreakInterval' as const,
      label: 'فاصله استراحت بلند',
      description: 'هر چند جلسه تمرکز، استراحت بلند شود',
      min: 1,
      max: 10,
    },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">تنظیمات پومودورو</CardTitle>
            <CardDescription>مدت زمان‌های تایمر تمرکز را تنظیم کنید</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">{field.label}</Label>
                    <p className="text-xs text-muted-foreground">{field.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={field.min}
                      max={field.max}
                      value={settings[field.key]}
                      onChange={(e) => {
                        let val = parseInt(e.target.value);
                        if (isNaN(val)) val = field.min;
                        val = Math.max(field.min, Math.min(field.max, val));
                        setSettings({ [field.key]: val });
                      }}
                      className="h-9 w-20 text-center tabular-nums"
                      dir="ltr"
                    />
                    <span className="text-xs text-muted-foreground">
                      {field.key === 'longBreakInterval' ? 'جلسه' : 'دقیقه'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function AboutSection() {
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      if (res.ok) {
        toast.success('داده‌های آزمایشی با موفقیت بازنشانی شدند!');
      } else {
        toast.error('خطا در بازنشانی داده‌ها');
      }
    } catch {
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5">
              <span className="text-3xl">🚀</span>
            </div>
            <CardTitle className="text-xl">لایف‌او‌اس</CardTitle>
            <CardDescription>سیستم عامل زندگی شما</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                <span>نسخه</span>
                <span className="font-medium text-foreground">۱.۰.۰</span>
              </div>
              <p className="text-sm text-muted-foreground">
                یک سیستم مدیریت زندگی جامع برای برنامه‌ریزی، پیگیری اهداف و افزایش بهره‌وری
              </p>
              <Separator />
              <p className="text-sm">
                ساخته شده با ❤️
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">داده‌ها</CardTitle>
            <CardDescription>مدیریت داده‌های برنامه</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={handleSeed}
              disabled={isSeeding}
              className="w-full gap-2"
            >
              <RotateCcw className={cn('h-4 w-4', isSeeding && 'animate-spin')} />
              {isSeeding ? 'در حال بازنشانی...' : 'بازنشانی داده‌های آزمایشی'}
            </Button>
            <p className="mt-2 text-center text-[11px] text-muted-foreground/60">
              تمام داده‌های فعلی پاک شده و داده‌های نمونه جایگزین می‌شوند
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Settings Page                                                 */
/* ------------------------------------------------------------------ */

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SectionId>('appearance');

  const renderSection = () => {
    switch (activeSection) {
      case 'appearance':
        return <AppearanceSection />;
      case 'calendar':
        return <CalendarSection />;
      case 'focus-timer':
        return <FocusTimerSection />;
      case 'about':
        return <AboutSection />;
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-8" dir="rtl">
      <div className="mx-auto max-w-4xl px-4 pt-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold">تنظیمات</h1>
          <p className="text-sm text-muted-foreground">شخصی‌سازی لایف‌او‌اس</p>
        </motion.div>

        <div className="flex flex-col gap-8 md:flex-row">
          {/* Section Navigation (right side in RTL) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full shrink-0 md:w-64"
          >
            <nav className="flex flex-row gap-1 overflow-x-auto md:flex-col">
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-right transition-all duration-200',
                    activeSection === section.id
                      ? 'bg-accent text-foreground font-medium'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                      activeSection === section.id
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {section.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm">{section.label}</div>
                    <div className="text-[11px] text-muted-foreground hidden md:block truncate">
                      {section.description}
                    </div>
                  </div>
                </button>
              ))}
            </nav>
          </motion.div>

          {/* Content (left side in RTL) */}
          <div className="flex-1 min-w-0">
            {renderSection()}
          </div>
        </div>
      </div>
    </div>
  );
}