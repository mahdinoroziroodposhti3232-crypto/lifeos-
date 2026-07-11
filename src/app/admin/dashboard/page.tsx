'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  ListTodo,
  FolderKanban,
  Target,
  Repeat,
  StickyNote,
  Clock,
  TrendingUp,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { adminFetch } from '@/lib/admin-fetch';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Stats {
  totalUsers: number;
  activeUsersToday: number;
  totalProjects: number;
  totalTasks: number;
  totalGoals: number;
  totalHabits: number;
  totalNotes: number;
  totalFocusMinutes: number;
  recentSignups: number;
  userGrowthPercent: number;
}

interface RecentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const statCards = [
  { key: 'totalUsers', label: 'کل کاربران', icon: Users, color: 'from-violet-500 to-indigo-500', bgColor: 'bg-violet-50 dark:bg-violet-950/50', textColor: 'text-violet-600 dark:text-violet-400' },
  { key: 'activeUsersToday', label: 'کاربران فعال امروز', icon: UserCheck, color: 'from-emerald-500 to-teal-500', bgColor: 'bg-emerald-50 dark:bg-emerald-950/50', textColor: 'text-emerald-600 dark:text-emerald-400' },
  { key: 'totalTasks', label: 'کل وظایف', icon: ListTodo, color: 'from-amber-500 to-orange-500', bgColor: 'bg-amber-50 dark:bg-amber-950/50', textColor: 'text-amber-600 dark:text-amber-400' },
  { key: 'totalProjects', label: 'کل پروژه‌ها', icon: FolderKanban, color: 'from-sky-500 to-blue-500', bgColor: 'bg-sky-50 dark:bg-sky-950/50', textColor: 'text-sky-600 dark:text-sky-400' },
  { key: 'totalGoals', label: 'کل اهداف', icon: Target, color: 'from-rose-500 to-pink-500', bgColor: 'bg-rose-50 dark:bg-rose-950/50', textColor: 'text-rose-600 dark:text-rose-400' },
  { key: 'totalHabits', label: 'کل عادت‌ها', icon: Repeat, color: 'from-purple-500 to-fuchsia-500', bgColor: 'bg-purple-50 dark:bg-purple-950/50', textColor: 'text-purple-600 dark:text-purple-400' },
  { key: 'totalNotes', label: 'کل یادداشت‌ها', icon: StickyNote, color: 'from-lime-500 to-green-500', bgColor: 'bg-lime-50 dark:bg-lime-950/50', textColor: 'text-lime-600 dark:text-lime-400' },
  { key: 'totalFocusMinutes', label: 'دقیقه تمرکز', icon: Clock, color: 'from-cyan-500 to-teal-500', bgColor: 'bg-cyan-50 dark:bg-cyan-950/50', textColor: 'text-cyan-600 dark:text-cyan-400' },
];

const persianMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

function generateGrowthData(recentSignups: number, growthPercent: number) {
  const base = Math.max(10, recentSignups);
  const data = [];
  for (let i = 11; i >= 0; i--) {
    const growth = 1 - (growthPercent / 100) * (i / 12);
    const users = Math.round(base * growth + Math.random() * 5);
    data.push({
      month: persianMonths[(new Date().getMonth() - i + 12) % 12],
      کاربران: users,
    });
  }
  return data;
}

function generateActivityData(tasks: number, projects: number, goals: number) {
  const days = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
  return days.map((day) => ({
    day,
    وظایف: Math.round((tasks / 30) * (0.5 + Math.random())),
    پروژه‌ها: Math.round((projects / 30) * (0.3 + Math.random() * 0.5)),
    اهداف: Math.round((goals / 30) * (0.2 + Math.random() * 0.4)),
  }));
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function formatNumber(n: number) {
  return new Intl.NumberFormat('fa-IR').format(n);
}

function formatDate(dateStr: string) {
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const data = await adminFetch<Stats>('/api/admin/stats');
      setStats(data);
    } catch {
      // handled by adminFetch
    }
    try {
      const data = await adminFetch<{ users: RecentUser[] }>('/api/admin/users?page=1&limit=5');
      setRecentUsers(data.users || []);
    } catch {
      // handled by adminFetch
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const growthData = generateGrowthData(stats.recentSignups, stats.userGrowthPercent);
  const activityData = generateActivityData(stats.totalTasks, stats.totalProjects, stats.totalGoals);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const value = stats[card.key as keyof Stats] as number;
          return (
            <motion.div key={card.key} variants={item}>
              <Card className="border-border/50 transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className={`rounded-xl ${card.bgColor} p-2.5`}>
                      <Icon className={`h-5 w-5 ${card.textColor}`} />
                    </div>
                    {card.key === 'totalUsers' && (
                      <Badge variant="secondary" className="gap-1 text-[10px]">
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                        {formatNumber(stats.userGrowthPercent)}٪
                      </Badge>
                    )}
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold text-foreground">
                      {formatNumber(value)}
                    </p>
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <motion.div variants={item}>
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">رشد کاربران</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthData}>
                    <defs>
                      <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        fontSize: '12px',
                        direction: 'rtl',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="کاربران"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      fill="url(#userGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">فعالیت هفتگی</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        fontSize: '12px',
                        direction: 'rtl',
                      }}
                    />
                    <Bar dataKey="وظایف" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="پروژه‌ها" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="اهداف" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Users */}
      <motion.div variants={item}>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">آخرین کاربران</CardTitle>
            <Link href="/admin/users">
              <Badge variant="outline" className="cursor-pointer gap-1 transition-colors hover:bg-accent">
                مشاهده همه
                <ArrowLeft className="h-3 w-3" />
              </Badge>
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>نام</TableHead>
                  <TableHead>ایمیل</TableHead>
                  <TableHead>نقش</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>تاریخ عضویت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name || '—'}</TableCell>
                    <TableCell className="text-muted-foreground" dir="ltr">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                        {user.role === 'ADMIN' ? 'مدیر' : 'کاربر'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'default' : 'outline'} className={user.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : ''}>
                        {user.isActive ? 'فعال' : 'غیرفعال'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
                {recentUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      هنوز کاربری ثبت‌نام نکرده است
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}