'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Mail,
  Calendar,
  Shield,
  UserCheck,
  ListTodo,
  FolderKanban,
  Target,
  Repeat,
  StickyNote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { adminFetch } from '@/lib/admin-fetch';
import { toast } from 'sonner';

interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ContentItem {
  id: string;
  title: string;
  status?: string;
  createdAt: string;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [tasks, setTasks] = useState<ContentItem[]>([]);
  const [projects, setProjects] = useState<ContentItem[]>([]);
  const [notes, setNotes] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [userRes, tasksRes, projectsRes, notesRes] = await Promise.allSettled([
        adminFetch<UserInfo>(`/api/admin/users/${id}`),
        adminFetch<{ items: ContentItem[] }>(`/api/admin/content?type=tasks&userId=${id}&limit=10`),
        adminFetch<{ items: ContentItem[] }>(`/api/admin/content?type=projects&userId=${id}&limit=10`),
        adminFetch<{ items: ContentItem[] }>(`/api/admin/content?type=notes&userId=${id}&limit=10`),
      ]);
      if (userRes.status === 'fulfilled') setUser(userRes.value);
      else toast.error('خطا در دریافت اطلاعات کاربر');
      if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value.items || []);
      if (projectsRes.status === 'fulfilled') setProjects(projectsRes.value.items || []);
      if (notesRes.status === 'fulfilled') setNotes(notesRes.value.items || []);
    } catch {
      // handled by adminFetch
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!user) return null;

  const statItems = [
    { label: 'وظایف', value: tasks.length, icon: ListTodo, color: 'text-violet-600 dark:text-violet-400' },
    { label: 'پروژه‌ها', value: projects.length, icon: FolderKanban, color: 'text-indigo-600 dark:text-indigo-400' },
    { label: 'اهداف', value: 0, icon: Target, color: 'text-rose-600 dark:text-rose-400' },
    { label: 'عادت‌ها', value: 0, icon: Repeat, color: 'text-amber-600 dark:text-amber-400' },
    { label: 'یادداشت‌ها', value: notes.length, icon: StickyNote, color: 'text-emerald-600 dark:text-emerald-400' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
        <ArrowRight className="h-4 w-4" />
        بازگشت
      </Button>

      {/* User Info Card */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 text-2xl font-bold text-violet-700 dark:from-violet-950 dark:to-indigo-950 dark:text-violet-300">
                {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold">{user.name || 'بدون نام'}</h2>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground" dir="ltr">
                  <Mail className="h-3.5 w-3.5" />
                  {user.email}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={user.role === 'ADMIN' ? 'default' : 'secondary'}
                className={user.role === 'ADMIN' ? 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300' : ''}
              >
                {user.role === 'ADMIN' ? 'مدیر' : 'کاربر'}
              </Badge>
              <Badge
                variant="outline"
                className={user.isActive ? 'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300' : 'border-destructive/30 text-destructive'}
              >
                {user.isActive ? 'فعال' : 'غیرفعال'}
              </Badge>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border/50 pt-6 sm:grid-cols-4">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">نقش:</span>
              <span className="font-medium">{user.role === 'ADMIN' ? 'مدیر' : 'کاربر عادی'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">وضعیت:</span>
              <span className="font-medium">{user.isActive ? 'فعال' : 'غیرفعال'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">عضویت:</span>
              <span className="font-medium">{formatDate(user.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">آخرین ورود:</span>
              <span className="font-medium">{formatDate(user.lastLoginAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {statItems.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border-border/50">
              <CardContent className="flex flex-col items-center p-4 text-center">
                <Icon className={`h-6 w-6 ${s.color}`} />
                <p className="mt-2 text-xl font-bold">{new Intl.NumberFormat('fa-IR').format(s.value)}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Content Tabs */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">محتوای کاربر</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tasks" dir="rtl">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="tasks">وظایف</TabsTrigger>
              <TabsTrigger value="projects">پروژه‌ها</TabsTrigger>
              <TabsTrigger value="notes">یادداشت‌ها</TabsTrigger>
            </TabsList>

            {([
              { key: 'tasks', data: tasks },
              { key: 'projects', data: projects },
              { key: 'notes', data: notes },
            ] as const).map(({ key, data }) => (
              <TabsContent key={key} value={key}>
                {data.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    موردی یافت نشد
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>عنوان</TableHead>
                        <TableHead>تاریخ ایجاد</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((item: ContentItem) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.title || 'بدون عنوان'}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDate(item.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}