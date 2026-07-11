'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ScrollText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { adminFetch } from '@/lib/admin-fetch';

interface AuditLog {
  id: string;
  action: string;
  userId: string;
  userName?: string;
  entity: string;
  details: string;
  createdAt: string;
}

interface LogsResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  totalPages: number;
}

const actionColors: Record<string, string> = {
  CREATE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  UPDATE: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  LOGIN: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  LOGOUT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  SIGNUP: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
};

const actionLabels: Record<string, string> = {
  CREATE: 'ایجاد',
  UPDATE: 'ویرایش',
  DELETE: 'حذف',
  LOGIN: 'ورود',
  LOGOUT: 'خروج',
  SIGNUP: 'ثبت‌نام',
};

function formatDateTime(dateStr: string) {
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '50',
      });
      if (action !== 'all') params.set('action', action);

      const data = await adminFetch<LogsResponse>(`/api/admin/audit-logs?${params}`);
      setLogs(data.logs || []);
      setTotalPages(data.totalPages);
    } catch {
      // handled
    }
    setLoading(false);
  }, [page, action]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchLogs();
  }, [fetchLogs]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header + Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/50">
            <ScrollText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold">گزارش‌های سیستمی</h2>
            <p className="text-sm text-muted-foreground">لاگ فعالیت‌ها و تغییرات سیستم</p>
          </div>
        </div>

        <Select
          value={action}
          onValueChange={(v) => {
            setAction(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="نوع عملیات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه عملیات‌ها</SelectItem>
            <SelectItem value="CREATE">ایجاد</SelectItem>
            <SelectItem value="UPDATE">ویرایش</SelectItem>
            <SelectItem value="DELETE">حذف</SelectItem>
            <SelectItem value="LOGIN">ورود</SelectItem>
            <SelectItem value="LOGOUT">خروج</SelectItem>
            <SelectItem value="SIGNUP">ثبت‌نام</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-border/50 overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="sticky top-0 bg-card z-10">
                <TableHead>تاریخ و ساعت</TableHead>
                <TableHead>کاربر</TableHead>
                <TableHead>عملیات</TableHead>
                <TableHead>موجودیت</TableHead>
                <TableHead className="hidden sm:table-cell">جزئیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full max-w-[150px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    گزارشی یافت نشد
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {log.userName || 'سیستم'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={actionColors[log.action] || 'bg-slate-100 text-slate-700'}
                      >
                        {actionLabels[log.action] || log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.entity || '—'}
                    </TableCell>
                    <TableCell className="hidden max-w-[300px] truncate text-sm text-muted-foreground sm:table-cell">
                      {log.details || '—'}
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
    </motion.div>
  );
}