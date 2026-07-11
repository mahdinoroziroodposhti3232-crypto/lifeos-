'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AdminSidebar } from '@/features/admin/admin-sidebar';
import { AdminHeader } from '@/features/admin/admin-header';

export function AdminPanelShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === '/admin/login';
  const mounted = useSyncExternalStore(
    (onStoreChange) => { onStoreChange(); return () => {}; },
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!isLoginPage) {
      const secret = localStorage.getItem('admin_secret');
      if (!secret) {
        router.replace('/admin/login');
      }
    }
  }, [isLoginPage, router]);

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pr-64">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}