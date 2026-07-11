'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
import { adminFetch } from '@/lib/admin-fetch';
import { toast } from 'sonner';

interface ContentItem {
  id: string;
  title: string;
  userId: string;
  userName?: string;
  status?: string;
  createdAt: string;
}

interface ContentResponse {
  items: ContentItem[];
  total: number;
  page: number;
  totalPages: number;
}

const contentTypes = [
  { key: 'tasks', label: 'وظایف', color: 'text-violet-600 dark:text-violet-400' },
  { key: 'projects', label: 'پروژه‌ها', color: 'text-indigo-600 dark:text-indigo-400' },
  { key: 'habits', label: 'عادت‌ها', color: 'text-amber-600 dark:text-amber-400' },
  { key: 'goals', label: 'اهداف', color: 'text-rose-600 dark:text-rose-400' },
  { key: 'notes', label: 'یادداشت‌ها', color: 'text-emerald-600 dark:text-emerald-400' },
  { key: 'events', label: 'رویدادها', color: 'text-sky-600 dark:text-sky-400' },
] as const;

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

export default function ContentManagementPage() {
  const [activeTab, setActiveTab] = useState('tasks');
  const [items, setItems] = useState<ContentItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ContentItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: activeTab,
        page: String(page),
        limit: '20',
      });
      if (search) params.set('search', search);

      const data = await adminFetch<ContentResponse>(`/api/admin/content?${params}`);
      setItems(data.items || []);
      setTotalPages(data.totalPages);
    } catch {
      // handled
    }
    setLoading(false);
  }, [activeTab, page, search]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchContent();
  }, [fetchContent]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminFetch(`/api/admin/content`, {
        method: 'DELETE',
        body: JSON.stringify({ id: deleteTarget.id, type: activeTab }),
      });
      toast.success('مورد با موفقیت حذف شد');
      setDeleteTarget(null);
      fetchContent();
    } catch {
      toast.error('خطا در حذف مورد');
    }
    setDeleting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/50">
          <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold">مدیریت محتوا</h2>
          <p className="text-sm text-muted-foreground">مشاهده و مدیریت تمام محتوای سیستم</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setPage(1); setSearch(''); }}>
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
          {contentTypes.map((ct) => (
            <TabsTrigger key={ct.key} value={ct.key} className="text-xs sm:text-sm">
              {ct.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {contentTypes.map((ct) => (
          <TabsContent key={ct.key} value={ct.key} className="space-y-4">
            {/* Search */}
            <div className="relative max-w-sm">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="جستجو بر اساس عنوان..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pr-10"
              />
            </div>

            {/* Table */}
            <Card className="border-border/50 overflow-hidden">
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="sticky top-0 bg-card z-10">
                      <TableHead>عنوان</TableHead>
                      <TableHead className="hidden sm:table-cell">کاربر</TableHead>
                      <TableHead className="hidden md:table-cell">وضعیت</TableHead>
                      <TableHead>تاریخ</TableHead>
                      <TableHead className="w-[50px]">حذف</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 5 }).map((_, j) => (
                            <TableCell key={j}>
                              <Skeleton className="h-5 w-full max-w-[120px]" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                          موردی یافت نشد
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.title || 'بدون عنوان'}
                          </TableCell>
                          <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                            {item.userName || '—'}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {item.status ? (
                              <Badge variant="secondary">{item.status}</Badge>
                            ) : '—'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {formatDate(item.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget(item)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border/50 px-4 py-3">
                  <span className="text-sm text-muted-foreground">
                    صفحه {new Intl.NumberFormat('fa-IR').format(page)} از{' '}
                    {new Intl.NumberFormat('fa-IR').format(totalPages)}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                      <ChevronRight className="h-4 w-4" />
                      قبلی
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                      بعدی
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف مورد</AlertDialogTitle>
            <AlertDialogDescription>
              آیا مطمئن هستید که می‌خواهید &laquo;{deleteTarget?.title || 'این مورد'}&raquo; را حذف کنید؟ این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}