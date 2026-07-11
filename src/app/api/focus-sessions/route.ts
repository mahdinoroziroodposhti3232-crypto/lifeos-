import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'لطفاً ابتدا وارد شوید' }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (action === 'stats') {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const todaySessions = await db.focusSession.findMany({
        where: { userId, completedAt: { gte: todayStart } },
      });
      const weekSessions = await db.focusSession.findMany({
        where: { userId, completedAt: { gte: weekStart } },
      });

      const todayMinutes = todaySessions.reduce((sum, s) => sum + s.duration, 0);
      const weekMinutes = weekSessions.reduce((sum, s) => sum + s.duration, 0);

      return NextResponse.json({
        today: { totalSessions: todaySessions.length, totalMinutes: todayMinutes, sessions: todaySessions },
        thisWeek: { totalSessions: weekSessions.length, totalMinutes: weekMinutes, sessions: weekSessions },
      });
    }

    const where: Record<string, unknown> = { userId };
    if (from || to) {
      where.completedAt = {};
      if (from) (where.completedAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.completedAt as Record<string, unknown>).lte = new Date(to);
    }

    const sessions = await db.focusSession.findMany({
      where,
      orderBy: { completedAt: 'desc' },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching focus sessions:', error);
    return NextResponse.json({ error: 'خطا در دریافت جلسات تمرکز' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'لطفاً ابتدا وارد شوید' }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const focusSession = await db.focusSession.create({
      data: {
        type: body.type || 'pomodoro',
        duration: body.duration || 25,
        taskId: body.taskId,
        userId,
      },
    });
    return NextResponse.json(focusSession, { status: 201 });
  } catch (error) {
    console.error('Error creating focus session:', error);
    return NextResponse.json({ error: 'خطا در ایجاد جلسه تمرکز' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'لطفاً ابتدا وارد شوید' }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'شناسه جلسه الزامی است' }, { status: 400 });

    const existing = await db.focusSession.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: 'یافت نشد' }, { status: 404 });
    }

    await db.focusSession.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting focus session:', error);
    return NextResponse.json({ error: 'خطا در حذف جلسه تمرکز' }, { status: 500 });
  }
}