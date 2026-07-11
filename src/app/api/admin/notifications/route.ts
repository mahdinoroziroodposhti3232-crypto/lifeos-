import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ──────────────────────────────────────────────
// Admin auth helper
// ──────────────────────────────────────────────
function isAdmin(req: NextRequest): boolean {
  const secret = req.headers.get('x-admin-secret');
  return secret === process.env.ADMIN_SECRET;
}

export async function POST(req: NextRequest) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز. لطفاً کلید مدیریت معتبر وارد کنید.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { title, body: notifBody, type, userId } = body as {
      title?: string;
      body?: string;
      type?: string;
      userId?: string | null;
    };

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { error: 'عنوان اعلان الزامی است.' },
        { status: 400 }
      );
    }

    if (!notifBody || typeof notifBody !== 'string' || !notifBody.trim()) {
      return NextResponse.json(
        { error: 'متن اعلان الزامی است.' },
        { status: 400 }
      );
    }

    const allowedTypes = ['info', 'success', 'warning', 'error'];
    const notificationType = allowedTypes.includes(type ?? '') ? type! : 'info';

    // If userId is provided, send to single user; otherwise broadcast to all active users
    if (userId) {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, isActive: true },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'کاربر مورد نظر یافت نشد.' },
          { status: 404 }
        );
      }

      if (!user.isActive) {
        return NextResponse.json(
          { error: 'کاربر مورد نظر غیرفعال است و امکان ارسال اعلان وجود ندارد.' },
          { status: 400 }
        );
      }

      await db.notification.create({
        data: {
          title: title.trim(),
          body: notifBody.trim(),
          type: notificationType,
          userId,
        },
      });

      return NextResponse.json({
        message: 'اعلان با موفقیت برای کاربر ارسال شد.',
        userId,
      });
    }

    // Broadcast to all active users
    const activeUsers = await db.user.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    if (activeUsers.length === 0) {
      return NextResponse.json(
        { error: 'هیچ کاربر فعالی برای ارسال اعلان وجود ندارد.' },
        { status: 400 }
      );
    }

    const notifications = activeUsers.map((u) => ({
      title: title.trim(),
      body: notifBody.trim(),
      type: notificationType,
      userId: u.id,
    }));

    const result = await db.notification.createMany({
      data: notifications,
    });

    return NextResponse.json({
      message: `اعلان با موفقیت برای ${result.count} کاربر فعال ارسال شد.`,
      sentCount: result.count,
    });
  } catch (error) {
    console.error('[ADMIN NOTIFICATIONS ERROR]', error);
    return NextResponse.json(
      { error: 'خطا در ارسال اعلان. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    );
  }
}