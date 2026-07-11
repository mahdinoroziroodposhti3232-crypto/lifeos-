'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  ChevronDown,
  ChevronLeft,
  Trash2,
  Edit3,
  Target,
  CalendarDays,
  X,
  Milestone as MilestoneIcon,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAppStore } from '@/lib/store';
import { toJalaali, formatJalaaliDateShort } from '@/lib/jalali';
import { cn } from '@/lib/utils';
import {
  GOAL_CATEGORY_LABELS,
  type Goal,
  type GoalCategory,
  type Milestone,
} from '@/types';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

function toPersianNum(num: number): string {
  return String(num).replace(/\d/g, (d) => persianDigits[parseInt(d)]);
}

const CATEGORY_COLORS: Record<GoalCategory, { bg: string; text: string; dot: string; gradient: string }> = {
  personal: {
    bg: 'bg-teal-50 dark:bg-teal-950/30',
    text: 'text-teal-700 dark:text-teal-400',
    dot: '#14b8a6',
    gradient: 'from-teal-500 to-emerald-400',
  },
  work: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-400',
    dot: '#3b82f6',
    gradient: 'from-blue-500 to-indigo-400',
  },
  health: {
    bg: 'bg-green-50 dark:bg-green-950/30',
    text: 'text-green-700 dark:text-green-400',
    dot: '#22c55e',
    gradient: 'from-green-500 to-lime-400',
  },
  education: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    text: 'text-purple-700 dark:text-purple-400',
    dot: '#a855f7',
    gradient: 'from-purple-500 to-violet-400',
  },
  financial: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-400',
    dot: '#f59e0b',
    gradient: 'from-amber-500 to-yellow-400',
  },
  social: {
    bg: 'bg-pink-50 dark:bg-pink-950/30',
    text: 'text-pink-700 dark:text-pink-400',
    dot: '#ec4899',
    gradient: 'from-pink-500 to-rose-400',
  },
};

const CATEGORIES: GoalCategory[] = [
  'personal',
  'work',
  'health',
  'education',
  'financial',
  'social',
];

/* ------------------------------------------------------------------ */
/*  Helper Functions                                                   */
/* ------------------------------------------------------------------ */

function calculateProgress(goal: Goal): number {
  if (!goal.milestones || goal.milestones.length === 0) return 0;
  const completed = goal.milestones.filter((m) => m.isCompleted).length;
  return Math.round((completed / goal.milestones.length) * 100);
}

function formatGoalDate(dateStr?: string): string | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    return formatJalaaliDateShort(date);
  } catch {
    return dateStr;
  }
}

function generateId(): string {
  return `ms_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/* ------------------------------------------------------------------ */
/*  Goal Form Dialog State                                            */
/* ------------------------------------------------------------------ */

interface GoalFormData {
  title: string;
  description: string;
  category: GoalCategory;
  startDate: string;
  endDate: string;
}

const defaultGoalFormData: GoalFormData = {
  title: '',
  description: '',
  category: 'personal',
  startDate: '',
  endDate: '',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function GoalsPage() {
  const { goals, setGoals } = useAppStore();
  const queryClient = useQueryClient();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<Goal | null>(null);

  // Form state
  const [formData, setFormData] = useState<GoalFormData>(defaultGoalFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Milestone inline add state
  const [newMilestoneInputs, setNewMilestoneInputs] = useState<Record<string, string>>({});

  /* ---------------------------------------------------------------- */
  /*  Fetch goals on mount                                             */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    async function fetchGoals() {
      try {
        const res = await fetch('/api/goals');
        if (res.ok) {
          const data = await res.json();
          setGoals(data);
        }
      } catch (err) {
        console.error('Error fetching goals:', err);
      }
    }
    fetchGoals();
  }, [setGoals]);

  /* ---------------------------------------------------------------- */
  /*  Mutations                                                        */
  /* ---------------------------------------------------------------- */

  const createGoalMutation = useMutation({
    mutationFn: async (data: GoalFormData) => {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description || undefined,
          category: data.category,
          startDate: data.startDate || undefined,
          targetDate: data.endDate || undefined,
          progress: 0,
          userId: 'default',
          milestones: [],
        }),
      });
      if (!res.ok) throw new Error('خطا در ایجاد هدف');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      refetchGoals();
      closeDialog();
    },
  });

  interface UpdateGoalPayload {
    id: string;
    title: string;
    description?: string;
    category: GoalCategory;
    startDate?: string;
    endDate?: string;
    milestones?: Array<{ title: string; order: number; isCompleted: boolean }>;
  }

  const updateGoalMutation = useMutation({
    mutationFn: async (data: UpdateGoalPayload) => {
      const res = await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: data.id,
          title: data.title,
          description: data.description,
          category: data.category,
          startDate: data.startDate || null,
          targetDate: data.endDate || null,
          progress: data.milestones && data.milestones.length > 0
            ? Math.round((data.milestones.filter((m) => m.isCompleted).length / data.milestones.length) * 100)
            : 0,
          status: data.milestones && data.milestones.length > 0 && data.milestones.every((m) => m.isCompleted) ? 'completed' : 'in_progress',
          milestones: (data.milestones || []).map((m, i) => ({
            title: m.title,
            order: i,
            isCompleted: m.isCompleted,
          })),
        }),
      });
      if (!res.ok) throw new Error('خطا در بروزرسانی هدف');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      refetchGoals();
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/goals?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('خطا در حذف هدف');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      refetchGoals();
      setDeleteTarget(null);
    },
  });

  /* ---------------------------------------------------------------- */
  /*  Helpers                                                          */
  /* ---------------------------------------------------------------- */

  async function refetchGoals() {
    try {
      const res = await fetch('/api/goals');
      if (res.ok) {
        const data = await res.json();
        setGoals(data);
      }
    } catch (err) {
      console.error('Error refetching goals:', err);
    }
  }

  function openAddDialog() {
    setEditingGoal(null);
    setFormData(defaultGoalFormData);
    setFormErrors({});
    setShowAddDialog(true);
  }

  function openEditDialog(goal: Goal) {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || '',
      category: goal.category,
      startDate: goal.startDate || '',
      endDate: goal.endDate || '',
    });
    setFormErrors({});
    setShowAddDialog(true);
  }

  function closeDialog() {
    setShowAddDialog(false);
    setEditingGoal(null);
    setFormData(defaultGoalFormData);
    setFormErrors({});
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) {
      errors.title = 'عنوان هدف الزامی است';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit() {
    if (!validateForm()) return;
    if (editingGoal) {
      const milestonesPayload = (editingGoal.milestones || []).map((m, i) => ({
        title: m.title,
        order: i,
        isCompleted: m.isCompleted,
      }));
      updateGoalMutation.mutate({
        id: editingGoal.id,
        title: formData.title,
        description: formData.description || undefined,
        category: formData.category,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        milestones: milestonesPayload,
      });
      closeDialog();
    } else {
      createGoalMutation.mutate(formData);
    }
  }

  function toggleMilestone(goal: Goal, milestoneId: string) {
    if (!goal.milestones) return;
    const updatedMilestones = goal.milestones.map((m, i) => ({
      title: m.id === milestoneId ? m.title : m.title,
      order: i,
      isCompleted: m.id === milestoneId ? !m.isCompleted : m.isCompleted,
    }));
    updateGoalMutation.mutate({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      category: goal.category,
      startDate: goal.startDate,
      endDate: goal.endDate,
      milestones: updatedMilestones,
    });
  }

  function addMilestone(goalId: string) {
    const inputText = newMilestoneInputs[goalId]?.trim();
    if (!inputText) return;

    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    const existingMilestones = (goal.milestones || []).map((m) => ({
      title: m.title,
      order: m.order,
      isCompleted: m.isCompleted,
    }));

    const newMilestones = [
      ...existingMilestones,
      {
        title: inputText,
        order: existingMilestones.length,
        isCompleted: false,
      },
    ];

    updateGoalMutation.mutate({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      category: goal.category,
      startDate: goal.startDate,
      endDate: goal.endDate,
      milestones: newMilestones,
    });
    setNewMilestoneInputs((prev) => ({ ...prev, [goalId]: '' }));
  }

  function toggleExpand(goalId: string) {
    setExpandedGoalId((prev) => (prev === goalId ? null : goalId));
  }

  /* ---------------------------------------------------------------- */
  /*  Computed                                                         */
  /* ---------------------------------------------------------------- */

  const filteredGoals = useMemo(() => {
    if (activeCategory === 'all') return goals;
    return goals.filter((g) => g.category === activeCategory);
  }, [goals, activeCategory]);

  const goalsWithProgress = useMemo(() => {
    return filteredGoals.map((goal) => ({
      goal,
      progress: calculateProgress(goal),
    }));
  }, [filteredGoals]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">اهداف</h1>
          <p className="text-sm text-muted-foreground mt-1">
            اهداف بلندمدت خود را دنبال کنید
          </p>
        </div>

        <Button onClick={openAddDialog} className="gap-2 rounded-xl">
          <Plus className="h-4 w-4" />
          هدف جدید
        </Button>
      </div>

      {/* Category Filter */}
      <Tabs
        value={activeCategory}
        onValueChange={setActiveCategory}
        className="w-full"
      >
        <TabsList className="w-full justify-start overflow-x-auto rounded-xl bg-muted/60 p-1 h-auto">
          <TabsTrigger
            value="all"
            className="rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            همه
          </TabsTrigger>
          {CATEGORIES.map((cat) => (
            <TabsTrigger
              key={cat}
              value={cat}
              className="rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              {GOAL_CATEGORY_LABELS[cat]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Content */}
      {goalsWithProgress.length === 0 ? (
        <EmptyState
          icon={Target}
          title="هنوز هدفی تعیین نکرده‌اید"
          description="با تعیین اهداف بلندمدت و ایجاد گام‌های میانی، مسیر موفقیت خود را ترسیم کنید."
          action={{
            label: '+ هدف جدید',
            onClick: openAddDialog,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {goalsWithProgress.map(({ goal, progress }, index) => {
              const isExpanded = expandedGoalId === goal.id;
              const catStyle = CATEGORY_COLORS[goal.category];
              const completedCount = (goal.milestones || []).filter((m) => m.isCompleted).length;
              const totalCount = (goal.milestones || []).length;
              const isCompleted = progress >= 100;

              return (
                <motion.div
                  key={goal.id}
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
                  <Card
                    className={cn(
                      'group relative overflow-hidden border-border/50 backdrop-blur-sm transition-all duration-300 hover:shadow-lg',
                      isExpanded && 'ring-1 ring-border',
                      isCompleted && 'border-green-200 dark:border-green-800/50'
                    )}
                  >
                    {/* Color accent strip */}
                    <div
                      className={cn(
                        'absolute top-0 right-0 h-1 w-full bg-gradient-to-l',
                        catStyle.gradient
                      )}
                    />

                    {/* Header (always visible) */}
                    <CardHeader
                      className="cursor-pointer select-none pb-3"
                      onClick={() => toggleExpand(goal.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: catStyle.dot }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant="secondary"
                                className={cn(
                                  'text-[10px] px-2 py-0 h-5 font-medium border-0',
                                  catStyle.bg,
                                  catStyle.text
                                )}
                              >
                                {GOAL_CATEGORY_LABELS[goal.category]}
                              </Badge>
                              {isCompleted && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] px-2 py-0 h-5 font-medium bg-green-50 text-green-700 border-0 dark:bg-green-950/30 dark:text-green-400"
                                >
                                  تکمیل شده
                                </Badge>
                              )}
                            </div>
                            <CardTitle
                              className={cn(
                                'mt-1.5 text-sm font-semibold truncate',
                                isCompleted && 'line-through opacity-60'
                              )}
                            >
                              {goal.title}
                            </CardTitle>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Edit */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(goal);
                            }}
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                          {/* Delete */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(goal);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                          {/* Expand/Collapse */}
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          </motion.div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">
                            {totalCount > 0
                              ? `${toPersianNum(completedCount)} از ${toPersianNum(totalCount)} گام`
                              : 'بدون گام میانی'}
                          </span>
                          <span className="text-[11px] font-medium tabular-nums">
                            {toPersianNum(progress)}٪
                          </span>
                        </div>
                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                          <motion.div
                            className={cn(
                              'absolute inset-y-0 right-0 rounded-full bg-gradient-to-l',
                              catStyle.gradient
                            )}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                          />
                        </div>
                      </div>

                      {/* Due Date */}
                      {goal.endDate && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <CalendarDays className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[11px] text-muted-foreground">
                            مهلت: {formatGoalDate(goal.endDate)}
                          </span>
                        </div>
                      )}
                    </CardHeader>

                    {/* Body (expanded) */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                          className="overflow-hidden"
                        >
                          <Separator className="mx-6" />

                          <CardContent className="pt-4 space-y-4">
                            {/* Description */}
                            {goal.description && (
                              <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
                                {goal.description}
                              </p>
                            )}

                            {/* Milestones */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <MilestoneIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs font-medium text-foreground">
                                  گام‌های میانی
                                </span>
                                {totalCount > 0 && (
                                  <span className="text-[10px] text-muted-foreground">
                                    ({toPersianNum(completedCount)}/{toPersianNum(totalCount)})
                                  </span>
                                )}
                              </div>

                              {/* Milestones List */}
                              <div className="space-y-1">
                                {(goal.milestones || []).map((milestone) => (
                                  <div
                                    key={milestone.id}
                                    className={cn(
                                      'group/milestone flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors',
                                      'hover:bg-muted/50',
                                      milestone.isCompleted && 'opacity-60'
                                    )}
                                  >
                                    <Checkbox
                                      checked={milestone.isCompleted}
                                      onCheckedChange={() => toggleMilestone(goal, milestone.id)}
                                      className="shrink-0"
                                      dir="ltr"
                                    />
                                    <span
                                      className={cn(
                                        'flex-1 text-xs leading-relaxed',
                                        milestone.isCompleted && 'line-through text-muted-foreground'
                                      )}
                                    >
                                      {milestone.title}
                                    </span>
                                    {milestone.dueDate && (
                                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                        {formatGoalDate(milestone.dueDate)}
                                      </span>
                                    )}
                                  </div>
                                ))}

                                {(!goal.milestones || goal.milestones.length === 0) && (
                                  <p className="py-3 text-center text-[11px] text-muted-foreground">
                                    هنوز گام میانی تعیین نشده است
                                  </p>
                                )}
                              </div>

                              {/* Add Milestone (inline) */}
                              <div className="flex items-center gap-2 pt-1">
                                <div className="relative flex-1">
                                  <Input
                                    placeholder="گام میانی جدید... (Enter برای افزودن)"
                                    value={newMilestoneInputs[goal.id] || ''}
                                    onChange={(e) =>
                                      setNewMilestoneInputs((prev) => ({
                                        ...prev,
                                        [goal.id]: e.target.value,
                                      }))
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addMilestone(goal.id);
                                      }
                                    }}
                                    className="h-8 text-xs rounded-lg pr-8"
                                    dir="rtl"
                                  />
                                  <Plus className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 px-3 text-xs rounded-lg shrink-0"
                                  onClick={() => addMilestone(goal.id)}
                                  disabled={!newMilestoneInputs[goal.id]?.trim()}
                                >
                                  افزودن
                                </Button>
                              </div>
                            </div>

                            {/* Progress Visualization */}
                            {totalCount > 0 && (
                              <div className="flex items-center gap-1.5 pt-1">
                                {(goal.milestones || []).map((m, i) => (
                                  <div
                                    key={m.id}
                                    className={cn(
                                      'h-1.5 flex-1 rounded-full transition-all duration-300',
                                      m.isCompleted
                                        ? ''
                                        : 'bg-muted-foreground/15'
                                    )}
                                    style={
                                      m.isCompleted
                                        ? { backgroundColor: catStyle.dot }
                                        : undefined
                                    }
                                  />
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="sm:max-w-[460px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">
              {editingGoal ? 'ویرایش هدف' : 'هدف جدید'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                عنوان <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="مثلاً: یادگیری زبان انگلیسی، ورزش روزانه..."
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
                placeholder="توضیح مختصری درباره این هدف..."
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">دسته‌بندی</label>
              <Select
                value={formData.category}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, category: val as GoalCategory }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[cat].dot }}
                        />
                        {GOAL_CATEGORY_LABELS[cat]}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">تاریخ شروع</label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                  className="w-full"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">تاریخ پایان</label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                  className="w-full"
                  dir="ltr"
                />
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
              disabled={createGoalMutation.isPending || updateGoalMutation.isPending}
              className="rounded-xl"
            >
              {createGoalMutation.isPending || updateGoalMutation.isPending
                ? 'در حال ذخیره...'
                : editingGoal
                  ? 'بروزرسانی'
                  : 'ایجاد هدف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف هدف</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف هدف «{deleteTarget?.title}» اطمینان دارید؟ تمام گام‌های میانی مرتبط نیز حذف خواهد شد. این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl">انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  deleteGoalMutation.mutate(deleteTarget.id);
                }
              }}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteGoalMutation.isPending ? 'در حال حذف...' : 'حذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}