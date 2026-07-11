'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Plus,
  FolderKanban,
  ArrowRight,
  Clock,
  CheckCircle2,
  PauseCircle,
  Trash2,
  Calendar,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAppStore } from '@/lib/store';
import { formatJalaaliDateShort, toJalaali } from '@/lib/jalali';
import { cn } from '@/lib/utils';
import {
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  type Project,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from '@/types';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
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

const PROJECT_STATUS_LABELS: Record<string, string> = {
  active: 'فعال',
  completed: 'تمام شده',
  paused: 'متوقف',
};

const PROJECT_STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  completed: 'secondary',
  paused: 'destructive',
};

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'کم' },
  { value: 'medium', label: 'متوسط' },
  { value: 'high', label: 'زیاد' },
  { value: 'urgent', label: 'فوری' },
];

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'انجام نشده' },
  { value: 'in-progress', label: 'در حال انجام' },
  { value: 'done', label: 'انجام شده' },
];

/* ------------------------------------------------------------------ */
/*  Container animation variants                                       */
/* ------------------------------------------------------------------ */

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

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

/* ------------------------------------------------------------------ */
/*  Project Card                                                       */
/* ------------------------------------------------------------------ */

function ProjectCard({
  project,
  taskCount,
  completedCount,
  progress,
  onClick,
}: {
  project: Project;
  taskCount: number;
  completedCount: number;
  progress: number;
  onClick: () => void;
}) {
  const statusLabel = PROJECT_STATUS_LABELS[project.status] || project.status;
  const statusVariant = PROJECT_STATUS_VARIANTS[project.status] || 'outline';
  const firstLetter = project.title.charAt(0);

  return (
    <motion.div variants={itemVariants} className="h-full">
      <Card
        className="group relative h-full cursor-pointer overflow-hidden py-0 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
        onClick={onClick}
      >
        {/* Color accent bar */}
        <div
          className="h-1.5 w-full"
          style={{ backgroundColor: project.color }}
        />

        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {project.icon ? (
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-lg"
                  style={{ backgroundColor: project.color + '20', color: project.color }}
                >
                  {project.icon}
                </div>
              ) : (
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold"
                  style={{
                    backgroundColor: project.color + '20',
                    color: project.color,
                  }}
                >
                  {firstLetter}
                </div>
              )}
              <div className="min-w-0">
                <CardTitle className="truncate text-base">{project.title}</CardTitle>
                {project.description && (
                  <CardDescription className="line-clamp-2 mt-1 text-xs leading-relaxed">
                    {project.description}
                  </CardDescription>
                )}
              </div>
            </div>
            <Badge variant={statusVariant} className="shrink-0 text-[10px]">
              {statusLabel}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>پیشرفت</span>
              <span>{toPersianDigits(Math.round(progress))}٪</span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
              <motion.div
                className="absolute inset-y-0 right-0 rounded-full"
                style={{ backgroundColor: project.color }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Task count */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {toPersianDigits(completedCount)} از {toPersianDigits(taskCount)} وظیفه
            </span>
            {project.endDate && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatJalaaliDateShort(new Date(project.endDate))}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Project Detail View                                                */
/* ------------------------------------------------------------------ */

function ProjectDetailView({
  project,
  projectTasks,
  onBack,
}: {
  project: Project;
  projectTasks: Task[];
  onBack: () => void;
}) {
  const queryClient = useQueryClient();

  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    status: 'todo' as TaskStatus,
    dueDate: '',
  });

  const completedCount = projectTasks.filter((t) => t.status === 'done').length;
  const totalCount = projectTasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const createTaskMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('خطا در ایجاد وظیفه');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowAddTaskDialog(false);
      setNewTask({ title: '', description: '', priority: 'medium', status: 'todo', dueDate: '' });
    },
  });

  const toggleDoneMutation = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    createTaskMutation.mutate({
      title: newTask.title.trim(),
      description: newTask.description.trim() || null,
      priority: newTask.priority,
      status: newTask.status,
      dueDate: newTask.dueDate || null,
      projectId: project.id,
    });
  };

  const handleToggleDone = (task: Task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    toggleDoneMutation.mutate({ id: task.id, status: newStatus });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Back button & header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-1.5 text-sm"
        >
          <ArrowRight className="h-4 w-4" />
          بازگشت
        </Button>
      </div>

      {/* Project info */}
      <Card className="py-0 overflow-hidden">
        <div className="h-1.5 w-full" style={{ backgroundColor: project.color }} />
        <CardHeader>
          <div className="flex items-start gap-4">
            {project.icon ? (
              <div
                className="flex h-14 w-14 items-center justify-center rounded-xl text-2xl"
                style={{ backgroundColor: project.color + '20', color: project.color }}
              >
                {project.icon}
              </div>
            ) : (
              <div
                className="flex h-14 w-14 items-center justify-center rounded-xl text-xl font-bold"
                style={{
                  backgroundColor: project.color + '20',
                  color: project.color,
                }}
              >
                {project.title.charAt(0)}
              </div>
            )}
            <div className="flex-1 space-y-1">
              <CardTitle className="text-xl">{project.title}</CardTitle>
              {project.description && (
                <CardDescription className="text-sm">
                  {project.description}
                </CardDescription>
              )}
            </div>
            <Badge variant={PROJECT_STATUS_VARIANTS[project.status] || 'outline'}>
              {PROJECT_STATUS_LABELS[project.status] || project.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">پیشرفت پروژه</span>
              <span className="font-medium">
                {toPersianDigits(completedCount)} از {toPersianDigits(totalCount)} وظیفه — {toPersianDigits(Math.round(progress))}٪
              </span>
            </div>
            <Progress value={progress} className="h-2.5" />
          </div>

          <Separator />

          {/* Add task button */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">وظایف پروژه</h3>
            <Button
              size="sm"
              onClick={() => setShowAddTaskDialog(true)}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              افزودن وظیفه
            </Button>
          </div>

          {/* Task list */}
          {projectTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">
                هنوز وظیفه‌ای برای این پروژه تعریف نشده است
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 gap-1.5"
                onClick={() => setShowAddTaskDialog(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                اولین وظیفه را اضافه کنید
              </Button>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2">
                {projectTasks.map((task) => {
                  const isDone = task.status === 'done';
                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
                    >
                      <Checkbox
                        checked={isDone}
                        onCheckedChange={() => handleToggleDone(task)}
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
                        {task.description && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                            {task.description}
                          </p>
                        )}
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className="gap-1 text-[10px]"
                          >
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
                            />
                            {PRIORITY_LABELS[task.priority]}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {STATUS_LABELS[task.status]}
                          </Badge>
                          {task.dueDate && (
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatJalaaliDateShort(new Date(task.dueDate))}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Add task dialog */}
      <Dialog open={showAddTaskDialog} onOpenChange={setShowAddTaskDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>افزودن وظیفه جدید</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddTask} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">عنوان وظیفه *</label>
              <Input
                value={newTask.title}
                onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))}
                placeholder="عنوان وظیفه را وارد کنید"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">توضیحات</label>
              <Textarea
                value={newTask.description}
                onChange={(e) => setNewTask((p) => ({ ...p, description: e.target.value }))}
                placeholder="توضیحات اختیاری"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">اولویت</label>
                <div className="flex flex-wrap gap-1.5">
                  {PRIORITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setNewTask((p) => ({ ...p, priority: opt.value }))}
                      className={cn(
                        'rounded-md border px-2.5 py-1 text-xs transition-colors',
                        newTask.priority === opt.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-muted text-muted-foreground hover:border-foreground/30'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">وضعیت</label>
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setNewTask((p) => ({ ...p, status: opt.value }))}
                      className={cn(
                        'rounded-md border px-2.5 py-1 text-xs transition-colors',
                        newTask.status === opt.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-muted text-muted-foreground hover:border-foreground/30'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">تاریخ سررسید</label>
              <Input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask((p) => ({ ...p, dueDate: e.target.value }))}
              />
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddTaskDialog(false)}
              >
                انصراف
              </Button>
              <Button
                type="submit"
                disabled={!newTask.title.trim() || createTaskMutation.isPending}
              >
                {createTaskMutation.isPending ? 'در حال ایجاد...' : 'ایجاد وظیفه'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Projects Page                                                 */
/* ------------------------------------------------------------------ */

export default function ProjectsPage() {
  const {
    projects,
    tasks,
    setSelectedProjectId,
    selectedProjectId,
  } = useAppStore();

  const queryClient = useQueryClient();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    color: COLOR_PRESETS[0],
    icon: '',
  });

  /* ---------- computed ---------- */

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  const projectTaskStats = useMemo(() => {
    const stats: Record<
      string,
      { total: number; completed: number; progress: number }
    > = {};
    for (const p of projects) {
      const projectTasks = tasks.filter((t) => t.projectId === p.id);
      const total = projectTasks.length;
      const completed = projectTasks.filter((t) => t.status === 'done').length;
      const progress = total > 0 ? (completed / total) * 100 : 0;
      stats[p.id] = { total, completed, progress };
    }
    return stats;
  }, [projects, tasks]);

  const selectedProjectTasks = useMemo(
    () => (selectedProjectId ? tasks.filter((t) => t.projectId === selectedProjectId) : []),
    [tasks, selectedProjectId]
  );

  /* ---------- mutations ---------- */

  const createProjectMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('خطا در ایجاد پروژه');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowAddDialog(false);
      setNewProject({ title: '', description: '', color: COLOR_PRESETS[0], icon: '' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.title.trim()) return;
    createProjectMutation.mutate({
      title: newProject.title.trim(),
      description: newProject.description.trim() || null,
      color: newProject.color,
      icon: newProject.icon.trim() || null,
    });
  };

  /* ---------- handlers ---------- */

  const handleProjectClick = useCallback(
    (projectId: string) => {
      setSelectedProjectId(projectId);
    },
    [setSelectedProjectId]
  );

  const handleBack = useCallback(() => {
    setSelectedProjectId(null);
  }, [setSelectedProjectId]);

  /* ---------- render ---------- */

  // If a project is selected, show detail view
  if (selectedProjectId && selectedProject) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        <ProjectDetailView
          project={selectedProject}
          projectTasks={selectedProjectTasks}
          onBack={handleBack}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            پروژه‌ها
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            مدیریت و پیگیری پروژه‌های خود
          </p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="gap-2 self-start"
        >
          <Plus className="h-4 w-4" />
          پروژه جدید
        </Button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <FolderKanban className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">هنوز پروژه‌ای ندارید</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            برای شروع، اولین پروژه خود را ایجاد کنید و وظایف آن را مدیریت کنید.
          </p>
          <Button
            variant="outline"
            className="mt-4 gap-2"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="h-4 w-4" />
            ایجاد پروژه اول
          </Button>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence>
            {projects.map((project) => {
              const stats = projectTaskStats[project.id] || {
                total: 0,
                completed: 0,
                progress: 0,
              };
              return (
                <ProjectCard
                  key={project.id}
                  project={project}
                  taskCount={stats.total}
                  completedCount={stats.completed}
                  progress={stats.progress}
                  onClick={() => handleProjectClick(project.id)}
                />
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Add Project Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>پروژه جدید</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">نام پروژه *</label>
              <Input
                value={newProject.title}
                onChange={(e) =>
                  setNewProject((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="مثلاً: بازطراحی وبسایت"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">توضیحات</label>
              <Textarea
                value={newProject.description}
                onChange={(e) =>
                  setNewProject((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="توضیحات اختیاری درباره پروژه"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">آیکون (اختیاری)</label>
              <Input
                value={newProject.icon}
                onChange={(e) =>
                  setNewProject((p) => ({ ...p, icon: e.target.value }))
                }
                placeholder="یک ایموجی وارد کنید مثلاً 🚀"
                className="text-lg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">رنگ</label>
              <div className="flex flex-wrap gap-2.5">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() =>
                      setNewProject((p) => ({ ...p, color }))
                    }
                    className={cn(
                      'h-8 w-8 rounded-full transition-all duration-200',
                      newProject.color === color
                        ? 'ring-2 ring-offset-2 ring-offset-background scale-110'
                        : 'hover:scale-110'
                    )}
                    style={{
                      backgroundColor: color,
                      ...(newProject.color === color ? { ringColor: color } : {}),
                    }}
                  />
                ))}
              </div>
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
              >
                انصراف
              </Button>
              <Button
                type="submit"
                disabled={!newProject.title.trim() || createProjectMutation.isPending}
              >
                {createProjectMutation.isPending ? 'در حال ایجاد...' : 'ایجاد پروژه'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}