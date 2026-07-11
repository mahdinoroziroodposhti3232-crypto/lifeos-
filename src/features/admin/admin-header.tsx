'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Menu, LogOut, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

const pageTitles: Record<string, string> = {
  '/admin/dashboard': 'داشبورد',
  '/admin/users': 'مدیریت کاربران',
  '/admin/content': 'مدیریت محتوا',
  '/admin/notifications': 'اعلان‌ها',
  '/admin/audit-logs': 'گزارش‌های سیستمی',
  '/admin/settings': 'تنظیمات سیستم',
};

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const title =
    pageTitles[pathname] ||
    (pathname.startsWith('/admin/users/') ? 'جزئیات کاربر' : 'پنل مدیریت');

  const handleLogout = () => {
    localStorage.removeItem('admin_secret');
    router.push('/admin/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-md sm:px-6 lg:pr-72">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground">
          <Link href="/">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">بازگشت به اپلیکیشن</span>
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="gap-2 text-destructive hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">خروج</span>
        </Button>
      </div>
    </header>
  );
}