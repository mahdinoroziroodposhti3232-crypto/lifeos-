'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Search,
  Eye,
  KeyRound,
  Power,
  ShieldCheck,
  Shield,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { adminFetch } from '@/lib/admin-fetch';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
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

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [isActive, setIsActive] = useState('all');
  const [loading, setLoading] = useState(true);
  const [resetDialog, setResetDialog] = useState<User | null>(null);
  const [resetting, setResetting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        sort: 'createdAt',
        order: 'desc',
      });
      if (search) params.set('search', search);
      if (role !== 'all') params.set('role', role);
      if (isActive !== 'all') params.set('isActive', isActive);

      const data = await adminFetch<UsersResponse>(`/api/admin/users?${params}`);
      setUsers(data.users || []);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      // handled by adminFetch
    }
    setLoading(false);
  }, [page, search, role, isActive]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchUsers();
  }, [fetchUsers]);

  const handleToggleActive = async (user: User) => {
    try {
      await adminFetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      toast.success(user.isActive ? 'کاربر غیرفعال شد' : 'کاربر فعال شد');
      fetchUsers();
    } catch {
      toast.error('خطا در تغییر وضعیت کاربر');
    }
  };

  const handleToggleRole = async (user: User) => {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      await adminFetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      toast.success(`نقش کاربر به ${newRole === 'ADMIN' ? 'مدیر' : 'کاربر'} تغییر کرد`);
      fetchUsers();
    } catch {
      toast.error('خطا در تغییر نقش کاربر');
    }
  };

  const handleResetPassword = async () => {
    if (!resetDialog) return;
    setResetting(true);
    try {
      const data = await adminFetch<{ password: string }>(
        `/api/admin/users/${resetDialog.id}/reset-password`,
        { method: 'POST' }
      );
      toast.success(`رمز عبور جدید: ${data.password}`);
      setResetDialog(null);
    } catch {
      toast.error('خطا در بازنشانی رمز عبور');
    }
    setResetting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="flex flex-wrap items-center gap-4 p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="جستجوی نام یا ایمیل..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pr-10"
            />
          </div>

          <Select
            value={role}
            onValueChange={(v) => {
              setRole(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="نقش" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه نقش‌ها</SelectItem>
              <SelectItem value="ADMIN">مدیر</SelectItem>
              <SelectItem value="USER">کاربر</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={isActive}
            onValueChange={(v) => {
              setIsActive(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="وضعیت" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه</SelectItem>
              <SelectItem value="true">فعال</SelectItem>
              <SelectItem value="false">غیرفعال</SelectItem>
            </SelectContent>
          </Select>

          <div className="text-sm text-muted-foreground">
            {new Intl.NumberFormat('fa-IR').format(total)} کاربر
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/50 overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="sticky top-0 bg-card z-10">
                <TableHead>نام</TableHead>
                <TableHead>ایمیل</TableHead>
                <TableHead>نقش</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>آخرین ورود</TableHead>
                <TableHead>تاریخ عضویت</TableHead>
                <TableHead className="w-[50px]">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full max-w-[120px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    کاربری یافت نشد
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="group">
                    <TableCell className="font-medium">
                      {user.name || 'بدون نام'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm" dir="ltr">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.role === 'ADMIN' ? 'default' : 'secondary'}
                        className={
                          user.role === 'ADMIN'
                            ? 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300'
                            : ''
                        }
                      >
                        {user.role === 'ADMIN' ? 'مدیر' : 'کاربر'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          user.isActive
                            ? 'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300'
                            : 'border-destructive/30 text-destructive'
                        }
                      >
                        {user.isActive ? 'فعال' : 'غیرفعال'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(user.lastLoginAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
                            </svg>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => router.push(`/admin/users/${user.id}`)}>
                            <Eye className="ml-2 h-4 w-4" />
                            مشاهده جزئیات
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setResetDialog(user)}>
                            <KeyRound className="ml-2 h-4 w-4" />
                            بازنشانی رمز عبور
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(user)}>
                            <Power className="ml-2 h-4 w-4" />
                            {user.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleRole(user)}>
                            {user.role === 'ADMIN' ? (
                              <Shield className="ml-2 h-4 w-4" />
                            ) : (
                              <ShieldCheck className="ml-2 h-4 w-4" />
                            )}
                            {user.role === 'ADMIN' ? 'تبدیل به کاربر' : 'تبدیل به مدیر'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/50 px-4 py-3">
            <span className="text-sm text-muted-foreground">
              صفحه {new Intl.NumberFormat('fa-IR').format(page)} از{' '}
              {new Intl.NumberFormat('fa-IR').format(totalPages)}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronRight className="h-4 w-4" />
                قبلی
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                بعدی
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetDialog} onOpenChange={() => setResetDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>بازنشانی رمز عبور</DialogTitle>
            <DialogDescription>
              آیا مطمئن هستید که می‌خواهید رمز عبور {resetDialog?.name || resetDialog?.email} را بازنشانی کنید؟ رمز جدید نمایش داده خواهد شد.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setResetDialog(null)}>
              انصراف
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={resetting}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {resetting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <RotateCcw className="ml-2 h-4 w-4" />
                  بازنشانی رمز
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}