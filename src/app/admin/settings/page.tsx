'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, Loader2, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { adminFetch } from '@/lib/admin-fetch';
import { toast } from 'sonner';

interface SettingField {
  key: string;
  label: string;
  description: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  value: string | boolean;
  options?: { label: string; value: string }[];
}

const defaultSettings: SettingField[] = [
  {
    key: 'siteName',
    label: 'نام سایت',
    description: 'نام نمایشی سایت که در عنوان مرورگر نمایش داده می‌شود',
    type: 'text',
    value: 'LifeOS',
  },
  {
    key: 'maintenanceMode',
    label: 'حالت تعمیرات',
    description: 'در صورت فعال بودن، سایت برای کاربران غیرفعال می‌شود',
    type: 'boolean',
    value: false,
  },
  {
    key: 'maxUsers',
    label: 'حداکثر تعداد کاربران',
    description: 'حداکثر تعداد کاربران مجاز برای ثبت‌نام (صفر = نامحدود)',
    type: 'number',
    value: '0',
  },
  {
    key: 'defaultTheme',
    label: 'پوسته پیش‌فرض',
    description: 'پوسته پیش‌فرض برای کاربران جدید',
    type: 'select',
    value: 'light',
    options: [
      { label: 'روشن', value: 'light' },
      { label: 'تاریک', value: 'dark' },
      { label: 'سیستم', value: 'system' },
    ],
  },
  {
    key: 'aiEnabled',
    label: 'فعال بودن هوش مصنوعی',
    description: 'فعال یا غیرفعال کردن قابلیت‌های هوش مصنوعی برای کاربران',
    type: 'boolean',
    value: true,
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingField[]>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await adminFetch<Record<string, string | boolean>>('/api/admin/settings');
      setSettings((prev) =>
        prev.map((s) => {
          if (data[s.key] !== undefined) {
            return { ...s, value: data[s.key] };
          }
          return s;
        })
      );
    } catch {
      // use defaults
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchSettings();
  }, [fetchSettings]);

  const updateSetting = (key: string, value: string | boolean) => {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value } : s))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, string | boolean> = {};
      settings.forEach((s) => {
        payload[s.key] = s.value;
      });
      await adminFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      toast.success('تنظیمات با موفقیت ذخیره شد');
    } catch {
      toast.error('خطا در ذخیره تنظیمات');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-60" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/50">
            <Settings className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold">تنظیمات سیستم</h2>
            <p className="text-sm text-muted-foreground">پیکربندی و تنظیمات عمومی سیستم</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchSettings} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            بازنشانی
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="gap-2 bg-gradient-to-l from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20 hover:from-violet-700 hover:to-indigo-700"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Save className="h-4 w-4" />
                ذخیره تنظیمات
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Settings Cards */}
      <div className="space-y-4">
        {settings.map((setting, index) => (
          <motion.div
            key={setting.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="border-border/50 transition-shadow hover:shadow-sm">
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <Label className="text-sm font-semibold">{setting.label}</Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {setting.description}
                  </p>
                </div>
                <div className="min-w-[180px]">
                  {setting.type === 'boolean' ? (
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs text-muted-foreground">
                        {setting.value ? 'فعال' : 'غیرفعال'}
                      </span>
                      <Switch
                        checked={setting.value as boolean}
                        onCheckedChange={(v) => updateSetting(setting.key, v)}
                      />
                    </div>
                  ) : setting.type === 'select' ? (
                    <select
                      value={setting.value as string}
                      onChange={(e) => updateSetting(setting.key, e.target.value)}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                    >
                      {setting.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      type={setting.type === 'number' ? 'number' : 'text'}
                      value={setting.value as string}
                      onChange={(e) => updateSetting(setting.key, e.target.value)}
                      className="h-9 text-left"
                      dir="ltr"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}