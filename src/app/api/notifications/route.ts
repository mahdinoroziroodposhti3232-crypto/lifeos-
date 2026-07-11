import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as Record<string, unknown>)?.userId as string | undefined;

    if (!userId) {
      return NextResponse.json({ error: 'احراز هویت لازم است' }, { status: 401 });
    }

    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = notifications.filter((n) => !n.read).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'خطا در دریافت اعلان‌ها' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as Record<string, unknown>)?.userId as string | undefined;

    if (!userId) {
      return NextResponse.json({ error: 'احراز هویت لازم است' }, { status: 401 });
    }

    const body = await request.json();
    const { title, body: notificationBody, type, actionUrl, entityId, entityType, dueAt } = body;

    if (!title || !notificationBody) {
      return NextResponse.json({ error: 'عنوان و متن اعلان الزامی هستند' }, { status: 400 });
    }

    const notification = await db.notification.create({
      data: {
        title,
        body: notificationBody,
        type: type || 'info',
        userId,
        actionUrl: actionUrl || null,
        entityId: entityId || null,
        entityType: entityType || null,
        dueAt: dueAt ? new Date(dueAt) : null,
      },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'خطا در ایجاد اعلان' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as Record<string, unknown>)?.userId as string | undefined;

    if (!userId) {
      return NextResponse.json({ error: 'احراز هویت لازم است' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ids, all } = body;

    if (all) {
      await db.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });
      return NextResponse.json({ success: true });
    }

    if (ids && Array.isArray(ids) && ids.length > 0) {
      await db.notification.updateMany({
        where: { id: { in: ids }, userId },
        data: { read: true },
      });
      return NextResponse.json({ success: true });
    }

    if (id) {
      await db.notification.update({
        where: { id, userId },
        data: { read: true },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'شناسه اعلان الزامی است' }, { status: 400 });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی اعلان' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as Record<string, unknown>)?.userId as string | undefined;

    if (!userId) {
      return NextResponse.json({ error: 'احراز هویت لازم است' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'شناسه اعلان الزامی است' }, { status: 400 });
    }

    await db.notification.delete({ where: { id, userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ error: 'خطا در حذف اعلان' }, { status: 500 });
  }
}