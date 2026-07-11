import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Special action: return focus stats
    if (action === 'stats') {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const todaySessions = await db.focusSession.findMany({
        where: {
          startTime: {
            gte: todayStart,
          },
        },
      });

      const weekSessions = await db.focusSession.findMany({
        where: {
          startTime: {
            gte: weekStart,
          },
        },
      });

      const todayMinutes = todaySessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
      const weekMinutes = weekSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

      return NextResponse.json({
        today: {
          totalSessions: todaySessions.length,
          totalMinutes: todayMinutes,
          sessions: todaySessions,
        },
        thisWeek: {
          totalSessions: weekSessions.length,
          totalMinutes: weekMinutes,
          sessions: weekSessions,
        },
      });
    }

    const where: Record<string, unknown> = {};

    if (from || to) {
      where.startTime = {};
      if (from) (where.startTime as Record<string, unknown>).gte = new Date(from);
      if (to) (where.startTime as Record<string, unknown>).lte = new Date(to);
    }

    const sessions = await db.focusSession.findMany({
      where,
      orderBy: { startTime: 'desc' },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching focus sessions:', error);
    return NextResponse.json({ error: 'خطا در دریافت جلسات تمرکز' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const session = await db.focusSession.create({
      data: {
        title: body.title,
        description: body.description,
        startTime: body.startTime,
        endTime: body.endTime,
        durationMinutes: body.durationMinutes,
        taskId: body.taskId,
        userId: body.userId || 'default',
      },
    });
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Error creating focus session:', error);
    return NextResponse.json({ error: 'خطا در ایجاد جلسه تمرکز' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'شناسه جلسه الزامی است' }, { status: 400 });

    const session = await db.focusSession.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
    return NextResponse.json(session);
  } catch (error) {
    console.error('Error updating focus session:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی جلسه تمرکز' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'شناسه جلسه الزامی است' }, { status: 400 });

    await db.focusSession.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting focus session:', error);
    return NextResponse.json({ error: 'خطا در حذف جلسه تمرکز' }, { status: 500 });
  }
}