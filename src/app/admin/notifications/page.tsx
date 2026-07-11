'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Bell, Info, CheckCircle2, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { adminFetch } from '@/lib/admin-fetch';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  createdAt: string;
}

const typeOptions = [
  { value: 'info', label: 'اطلاع‌رسانی', icon: Info, color: 'text-sky-500', badgeClass: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300' },
  { value: 'success', label: 'موفقیت', icon: CheckCircle2, color: 'text-emerald-500', badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
  { value: 'warning', label: 'هشدار', icon: AlertTriangle, color: 'text-amber-500', badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  { value: 'error', label: 'خطا', icon: XCircle, color: 'text-red-500', badgeClass: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
];

function formatDateTime(dateStr: string) {
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

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('info');
  const [target, setTarget] = useState<'all' | 'specific'>('all');
  const [userEmail, setUserEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [recent, setRecent] = useState<Notification[]>([]);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('لطفاً عنوان و متن اعلان را وارد کنید');
      return;
    }
    if (target === 'specific' && !userEmail.trim()) {
      toast.error('لطفاً ایمیل کاربر را وارد کنید');
      return;
    }

    setSending(true);
    try {
      const payload: Record<string, string> = { title, body, type };
      if (target === 'specific') payload.userId = userEmail;

      await adminFetch('/api/admin/notifications', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      toast.success('اعلان با موفقیت ارسال شد');
      setTitle('');
      setBody('');
      setType('info');
      setUserEmail('');
      setTarget('all');
      fetchRecent();
    } catch {
      toast.error('خطا در ارسال اعلان');
    }
    setSending(false);
  };

  const fetchRecent = async () => {
    try {
      const data = await adminFetch<{ notifications: Notification[] }>(
        '/api/admin/notifications?limit=10'
      );
      setRecent(data.notifications || []);
    } catch {
      // ignore
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/50">
          <Bell className="h-5 w-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold">اعلان‌ها</h2>
          <p className="text-sm text-muted-foreground">ارسال اعلان به کاربران</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Send Form */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">ارسال اعلان جدید</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>عنوان</Label>
              <Input
                placeholder="عنوان اعلان..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>متن اعلان</Label>
              <Textarea
                placeholder="متن اعلان را وارد کنید..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>نوع اعلان</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <span className="flex items-center gap-2">
                          <t.icon className={`h-4 w-4 ${t.color}`} />
                          {t.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>مخاطب</Label>
                <Select value={target} onValueChange={(v) => setTarget(v as 'all' | 'specific')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه کاربران</SelectItem>
                    <SelectItem value="specific">کاربر خاص</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {target === 'specific' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <Label>ایمیل کاربر</Label>
                <Input
                  placeholder="user@example.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  dir="ltr"
                />
              </motion.div>
            )}

            <Button
              onClick={handleSend}
              disabled={sending}
              className="w-full bg-gradient-to-l from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20 hover:from-violet-700 hover:to-indigo-700"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="ml-2 h-4 w-4" />
                  ارسال اعلان
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">اعلان‌های اخیر</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {recent.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  اعلانی ارسال نشده است
                </p>
              ) : (
                recent.map((notif) => {
                  const typeInfo = typeOptions.find((t) => t.value === notif.type);
                  return (
                    <div
                      key={notif.id}
                      className="flex items-start gap-3 rounded-xl border border-border/50 p-3 transition-colors hover:bg-accent/50"
                    >
                      <div className="mt-0.5">
                        {typeInfo ? (
                          <typeInfo.icon className={`h-5 w-5 ${typeInfo.color}`} />
                        ) : (
                          <Bell className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{notif.title}</p>
                          <Badge variant="secondary" className={`text-[10px] shrink-0 ${typeInfo?.badgeClass}`}>
                            {typeInfo?.label || notif.type}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                          {notif.body}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground/60">
                          {formatDateTime(notif.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}