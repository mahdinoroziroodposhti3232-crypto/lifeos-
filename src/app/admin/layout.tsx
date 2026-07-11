import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from 'sonner';
import { AdminPanelShell } from './admin-panel-shell';

export const metadata: Metadata = {
  title: 'پنل مدیریت | LifeOS',
  description: 'پنل مدیریت سیستم LifeOS',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body
        className="min-h-screen bg-background font-sans antialiased"
        style={{ fontFamily: 'Vazirmatn, system-ui, sans-serif' }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AdminPanelShell>{children}</AdminPanelShell>
          <Toaster
            position="top-left"
            richColors
            rtl
            toastOptions={{
              className: 'font-sans',
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}