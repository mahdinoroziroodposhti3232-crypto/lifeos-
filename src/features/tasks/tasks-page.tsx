'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  LayoutGrid,
  List,
  Trash2,
  Archive,
  Edit3,
  MoreHorizontal,
  Inbox,
  GripVertical,
  CircleCheckBig,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { useAppStore } from '@/lib/store';
import { formatJalaaliDateShort, formatJalaaliDate } from '@/lib/jalali';
import { cn } from '@/lib/utils';
import {
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  type Task,
  type TaskStatus,
  type TaskPriority,
} from '@/types';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogTrigger,
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
type FilterType = 'all' | 'today' | 'week' | 'important' | 'urgent';
type ViewMode = 'kanban' | 'list';

interface FilterOption {
  key: FilterType;
  label: string;
}

const FILTERS: FilterOption[] = [
  { key: 'all', label: 'همه' },
  { key: 'today', label: 'امروز' },
  { key: 'week', label: 'این هفته' },
  { key: 'important', label: 'مهم' },
  { key: 'urgent', label: 'فوری' },
];

const KANBAN_COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'todo', label: 'انجام نشده', color: '#6b7280' },
  { status: 'in-progress', label: 'در حال انجام', color: '#3b82f6' },
  { status: 'done', label: 'انجام شده', color: '#22c55e' },
];

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

const emptyTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId'> = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  isArchived: false,
  order: 0,
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

function getWeekStartStr(): string {
  const d = new Date();
  // Go back to Saturday (Persian week start)
  const dayOfWeek = d.getDay(); // 0=Sun
  const diff = (dayOfWeek + 1) % 7; // days since Saturday
  d.setDate(d.getDate() - diff);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDueDate(dateStr?: string, calendarType?: 'shamsi' | 'miladi'): string {
  if (!dateStr) return '';
  if (calendarType === 'shamsi') {
    const parts = dateStr.split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return formatJalaaliDateShort(d);
  }
  return dateStr;
}

/* ------------------------------------------------------------------ */
/*  Sortable Task Item (for list view DnD)                             */
/* ------------------------------------------------------------------ */
function SortableTaskItem({
  task,
  calendarType,
  onToggleDone,
  onEdit,
  onDelete,
  onArchive,
}: {
  task: Task;
  calendarType: 'shamsi' | 'miladi';
  onToggleDone: (id: string, done: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isDone = task.status === 'done';
  const priorityColor = PRIORITY_COLORS[task.priority];

  return (
    <div ref={setNodeRef} style={style} className="group">
      <div className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50">
        {/* Drag handle */}
        <button
          type="button"
          className="mt-0.5 cursor-grab text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 focus:opacity-100"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Checkbox */}
        <Checkbox
          checked={isDone}
          onCheckedChange={(checked) => onToggleDone(task.id, !!checked)}
          className="mt-0.5"
        />

        {/* Content */}
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
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: priorityColor }}
            />
            <span className="text-xs text-muted-foreground">
              {PRIORITY_LABELS[task.priority]}
            </span>
            {task.dueDate && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatDueDate(task.dueDate, calendarType)}
              </span>
            )}
            {task.project && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0"
              >
                <span
                  className="ml-1 inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: task.project.color }}
                />
                {task.project.title}
              </Badge>
            )}
            {task.label && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0"
              >
                {task.label.name}
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Edit3 className="ml-2 h-4 w-4" />
              ویرایش
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onArchive(task.id)}>
              <Archive className="ml-2 h-4 w-4" />
              بایگانی
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(task.id)}
            >
              <Trash2 className="ml-2 h-4 w-4" />
              حذف
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Kanban Task Card                                                   */
/* ------------------------------------------------------------------ */
function KanbanTaskCard({
  task,
  calendarType,
  onToggleDone,
  onEdit,
  onDelete,
  onArchive,
}: {
  task: Task;
  calendarType: 'shamsi' | 'miladi';
  onToggleDone: (id: string, done: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
}) {
  const isDone = task.status === 'done';
  const priorityColor = PRIORITY_COLORS[task.priority];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <div className="group rounded-lg border border-border/60 bg-card p-3 shadow-sm transition-all hover:shadow-md">
        {/* Priority indicator */}
        <div
          className="absolute right-0 top-3 h-8 w-1 rounded-l-full"
          style={{
            backgroundColor: priorityColor,
            position: 'relative',
            right: '-12px',
            top: '-4px',
            borderRadius: '0 4px 4px 0',
          }}
        />

        <div className="flex items-start gap-2">
          <Checkbox
            checked={isDone}
            onCheckedChange={(checked) => onToggleDone(task.id, !!checked)}
            className="mt-0.5 shrink-0"
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
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {task.description}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {task.dueDate && (
                <span className="flex items-center gap-1 rounded-md bg-accent/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  <Clock className="h-2.5 w-2.5" />
                  {formatDueDate(task.dueDate, calendarType)}
                </span>
              )}
              {task.project && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0"
                >
                  <span
                    className="ml-1 inline-block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: task.project.color }}
                  />
                  {task.project.title}
                </Badge>
              )}
              {task.label && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0"
                >
                  {task.label.name}
                </Badge>
              )}
            </div>
          </div>

          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onEdit(task)}>
                <Edit3 className="ml-2 h-4 w-4" />
                ویرایش
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onArchive(task.id)}>
                <Archive className="ml-2 h-4 w-4" />
                بایگانی
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(task.id)}
              >
                <Trash2 className="ml-2 h-4 w-4" />
                حذف
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Kanban Column                                                      */
/* ------------------------------------------------------------------ */
function KanbanColumn({
  status,
  label,
  color,
  tasks,
  calendarType,
  onToggleDone,
  onEdit,
  onDelete,
  onArchive,
}: {
  status: TaskStatus;
  label: string;
  color: string;
  tasks: Task[];
  calendarType: 'shamsi' | 'miladi';
  onToggleDone: (id: string, done: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
}) {
  return (
    <div className="flex min-w-[280px] flex-1 flex-col rounded-xl border bg-muted/30 p-3">
      {/* Column header */}
      <div className="mb-3 flex items-center gap-2 px-1">
        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        <h3 className="text-sm font-semibold">{label}</h3>
        <Badge variant="secondary" className="mr-auto text-[10px]">
          {tasks.length}
        </Badge>
      </div>

      {/* Tasks */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 px-1">
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <KanbanTaskCard
                key={task.id}
                task={task}
                calendarType={calendarType}
                onToggleDone={onToggleDone}
                onEdit={onEdit}
                onDelete={onDelete}
                onArchive={onArchive}
              />
            ))}
          </AnimatePresence>
          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Inbox className="mb-2 h-8 w-8 opacity-30" />
              <p className="text-xs">وظیفه‌ای نیست</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Task Dialog (Add / Edit)                                           */
/* ------------------------------------------------------------------ */
function TaskDialog({
  open,
  onOpenChange,
  editingTask,
  projects,
  labels,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTask: Task | null;
  projects: { id: string; title: string; color: string }[];
  labels: { id: string; name: string; color: string }[];
}) {
  const queryClient = useQueryClient();
  const isEditing = !!editingTask;

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    status: 'todo' as TaskStatus,
    dueDate: '',
    dueTime: '',
    projectId: '',
    labelId: '',
    estimatedMinutes: '',
  });

  // Reset form when dialog opens or editingTask changes
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen && editingTask) {
        setForm({
          title: editingTask.title,
          description: editingTask.description || '',
          priority: editingTask.priority,
          status: editingTask.status,
          dueDate: editingTask.dueDate || '',
          dueTime: editingTask.dueTime || '',
          projectId: editingTask.projectId || '',
          labelId: editingTask.labelId || '',
          estimatedMinutes: editingTask.estimatedMinutes
            ? String(editingTask.estimatedMinutes)
            : '',
        });
      } else if (nextOpen && !editingTask) {
        setForm({
          title: '',
          description: '',
          priority: 'medium',
          status: 'todo',
          dueDate: '',
          dueTime: '',
          projectId: '',
          labelId: '',
          estimatedMinutes: '',
        });
      }
      onOpenChange(nextOpen);
    },
    [editingTask, onOpenChange]
  );

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          estimatedMinutes: data.estimatedMinutes
            ? Number(data.estimatedMinutes)
            : null,
        }),
      });
      if (!res.ok) throw new Error('خطا در ایجاد وظیفه');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      handleOpenChange(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          id: editingTask!.id,
          estimatedMinutes: data.estimatedMinutes
            ? Number(data.estimatedMinutes)
            : null,
          projectId: data.projectId || null,
          labelId: data.labelId || null,
        }),
      });
      if (!res.ok) throw new Error('خطا در بروزرسانی وظیفه');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      handleOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      priority: form.priority,
      status: form.status,
      dueDate: form.dueDate || null,
      dueTime: form.dueTime || null,
      projectId: form.projectId || null,
      labelId: form.labelId || null,
      estimatedMinutes: form.estimatedMinutes || null,
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'ویرایش وظیفه' : 'وظیفه جدید'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              عنوان <span className="text-destructive">*</span>
            </label>
            <Input
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="عنوان وظیفه..."
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">توضیحات</label>
            <Textarea
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="توضیحات وظیفه..."
              rows={3}
            />
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">اولویت</label>
              <Select
                value={form.priority}
                onValueChange={(v) => updateField('priority', v as TaskPriority)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">وضعیت</label>
              <Select
                value={form.status}
                onValueChange={(v) => updateField('status', v as TaskStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">تاریخ سررسید</label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => updateField('dueDate', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">ساعت سررسید</label>
              <Input
                type="time"
                value={form.dueTime}
                onChange={(e) => updateField('dueTime', e.target.value)}
              />
            </div>
          </div>

          {/* Project & Label */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">پروژه</label>
              <Select
                value={form.projectId}
                onValueChange={(v) => updateField('projectId', v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="انتخاب پروژه" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                        {p.title}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">برچسب</label>
              <Select
                value={form.labelId}
                onValueChange={(v) => updateField('labelId', v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="انتخاب برچسب" />
                </SelectTrigger>
                <SelectContent>
                  {labels.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: l.color }}
                        />
                        {l.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Estimated Minutes */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">زمان تخمینی (دقیقه)</label>
            <Input
              type="number"
              min="0"
              value={form.estimatedMinutes}
              onChange={(e) => updateField('estimatedMinutes', e.target.value)}
              placeholder="مثلاً ۳۰"
            />
          </div>

          {/* Buttons */}
          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              انصراف
            </Button>
            <Button type="submit" disabled={isPending || !form.title.trim()}>
              {isPending ? 'در حال ذخیره...' : isEditing ? 'بروزرسانی' : 'ایجاد وظیفه'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Tasks Page                                                    */
/* ------------------------------------------------------------------ */
export function TasksPage() {
  const queryClient = useQueryClient();
  const { tasks, projects, labels, settings } = useAppStore();

  /* ---------- state ---------- */
  const [filter, setFilter] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [mobileTab, setMobileTab] = useState<string>('todo');

  /* ---------- sensors for DnD ---------- */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  /* ---------- filtered tasks ---------- */
  const filteredTasks = useMemo(() => {
    let result = tasks.filter((t) => !t.isArchived);

    const todayStr = getTodayStr();
    const weekStartStr = getWeekStartStr();

    switch (filter) {
      case 'today':
        result = result.filter((t) => t.dueDate === todayStr);
        break;
      case 'week':
        result = result.filter(
          (t) => t.dueDate && t.dueDate >= weekStartStr && t.dueDate <= todayStr
        );
        break;
      case 'important':
        result = result.filter((t) => t.priority === 'high' || t.priority === 'urgent');
        break;
      case 'urgent':
        result = result.filter((t) => t.priority === 'urgent');
        break;
    }

    return result;
  }, [tasks, filter]);

  /* ---------- tasks by status ---------- */
  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      todo: [],
      'in-progress': [],
      done: [],
      archived: [],
    };
    for (const t of filteredTasks) {
      map[t.status]?.push(t);
    }
    return map;
  }, [filteredTasks]);

  /* ---------- list view sorted IDs ---------- */
  const listTaskIds = useMemo(
    () => filteredTasks.map((t) => t.id),
    [filteredTasks]
  );

  /* ---------- mutations ---------- */
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
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('خطا در حذف');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isArchived: true }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (reorderedTasks: { id: string; order: number }[]) => {
      await Promise.all(
        reorderedTasks.map((t) =>
          fetch('/api/tasks', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: t.id, order: t.order }),
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  /* ---------- handlers ---------- */
  const handleToggleDone = (id: string, done: boolean) => {
    toggleDoneMutation.mutate({ id, status: done ? 'done' : 'todo' });
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleArchive = (id: string) => {
    archiveMutation.mutate(id);
  };

  const handleOpenAddDialog = () => {
    setEditingTask(null);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditingTask(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = listTaskIds.indexOf(active.id as string);
    const newIndex = listTaskIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    const moved = arrayMove(filteredTasks, oldIndex, newIndex);
    const reordered = moved.map((t, i) => ({ id: t.id, order: i }));
    reorderMutation.mutate(reordered);
  };

  /* ---------- kanban column task count badge color ---------- */
  const columnCounts = {
    todo: tasksByStatus.todo.length,
    'in-progress': tasksByStatus['in-progress'].length,
    done: tasksByStatus.done.length,
  };

  /* ---------- projects & labels for dialog ---------- */
  const projectOptions = useMemo(
    () => projects.map((p) => ({ id: p.id, title: p.title, color: p.color })),
    [projects]
  );
  const labelOptions = useMemo(
    () => labels.map((l) => ({ id: l.id, name: l.name, color: l.color })),
    [labels]
  );

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">وظایف</h1>
          <p className="text-sm text-muted-foreground">
            {filteredTasks.length} وظیفه
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border bg-muted p-0.5">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 gap-1.5 px-2.5"
              onClick={() => setViewMode('kanban')}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">کانبان</span>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 gap-1.5 px-2.5"
              onClick={() => setViewMode('list')}
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">فهرست</span>
            </Button>
          </div>

          {/* Add task button */}
          <Button onClick={handleOpenAddDialog} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            وظیفه جدید
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? 'default' : 'outline'}
            size="sm"
            className="h-8"
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Content */}
      {filteredTasks.length === 0 ? (
        /* Empty state */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20"
        >
          <Inbox className="mb-4 h-16 w-16 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold text-muted-foreground">
            هنوز وظیفه‌ای ندارید
          </h3>
          <p className="mt-1 text-sm text-muted-foreground/70">
            با کلیک روی دکمه زیر اولین وظیفه خود را ایجاد کنید
          </p>
          <Button className="mt-4 gap-1.5" onClick={handleOpenAddDialog}>
            <Plus className="h-4 w-4" />
            وظیفه جدید
          </Button>
        </motion.div>
      ) : viewMode === 'kanban' ? (
        /* ============================================================ */
        /*  Kanban View (desktop: 3 columns, mobile: tabs)             */
        /* ============================================================ */
        <>
          {/* Desktop: 3-column layout */}
          <div className="hidden gap-4 md:grid md:grid-cols-3">
            {KANBAN_COLUMNS.map((col) => (
              <KanbanColumn
                key={col.status}
                status={col.status}
                label={col.label}
                color={col.color}
                tasks={tasksByStatus[col.status]}
                calendarType={settings.calendarType}
                onToggleDone={handleToggleDone}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onArchive={handleArchive}
              />
            ))}
          </div>

          {/* Mobile: Tabs */}
          <div className="md:hidden">
            <Tabs
              value={mobileTab}
              onValueChange={setMobileTab}
              dir="rtl"
            >
              <TabsList className="w-full justify-stretch">
                {KANBAN_COLUMNS.map((col) => (
                  <TabsTrigger
                    key={col.status}
                    value={col.status}
                    className="flex-1 gap-1.5"
                  >
                    {col.label}
                    <Badge variant="secondary" className="text-[10px]">
                      {columnCounts[col.status]}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>

              {KANBAN_COLUMNS.map((col) => (
                <TabsContent key={col.status} value={col.status}>
                  <div className="space-y-2 pt-2">
                    <AnimatePresence mode="popLayout">
                      {tasksByStatus[col.status].map((task) => (
                        <KanbanTaskCard
                          key={task.id}
                          task={task}
                          calendarType={settings.calendarType}
                          onToggleDone={handleToggleDone}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onArchive={handleArchive}
                        />
                      ))}
                    </AnimatePresence>
                    {tasksByStatus[col.status].length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Inbox className="mb-2 h-8 w-8 opacity-30" />
                        <p className="text-xs">وظیفه‌ای نیست</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </>
      ) : (
        /* ============================================================ */
        /*  List View (with drag & drop)                                */
        /* ============================================================ */
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={listTaskIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {filteredTasks.map((task) => (
                <SortableTaskItem
                  key={task.id}
                  task={task}
                  calendarType={settings.calendarType}
                  onToggleDone={handleToggleDone}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onArchive={handleArchive}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Task Dialog */}
      <TaskDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        editingTask={editingTask}
        projects={projectOptions}
        labels={labelOptions}
      />
    </div>
  );
}