import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ──────────────────────────────────────────────
// Admin auth helper
// ──────────────────────────────────────────────
function isAdmin(req: NextRequest): boolean {
  const secret = req.headers.get('x-admin-secret');
  return secret === process.env.ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز. لطفاً کلید مدیریت معتبر وارد کنید.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') ?? '';
    const userId = searchParams.get('userId') ?? '';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));

    if (!type) {
      return NextResponse.json(
        { error: 'لطفاً نوع محتوا را مشخص کنید. (tasks, projects, habits, goals, notes, events)' },
        { status: 400 }
      );
    }

    const allowedTypes = ['tasks', 'projects', 'habits', 'goals', 'notes', 'events'];
    if (!allowedTypes.includes(type)) {
      return NextResponse.json(
        { error: 'نوع محتوا نامعتبر است. مقادیر مجاز: tasks, projects, habits, goals, notes, events' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = {};
    if (userId) {
      where.userId = userId;
    }

    const skip = (page - 1) * limit;

    let items: unknown[] = [];
    let total = 0;

    switch (type) {
      case 'tasks': {
        [items, total] = await Promise.all([
          db.task.findMany({
            where,
            include: {
              user: { select: { id: true, name: true, email: true } },
              project: { select: { id: true, title: true } },
              label: { select: { id: true, name: true, color: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          db.task.count({ where }),
        ]);
        break;
      }

      case 'projects': {
        [items, total] = await Promise.all([
          db.project.findMany({
            where,
            include: {
              user: { select: { id: true, name: true, email: true } },
              _count: { select: { tasks: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          db.project.count({ where }),
        ]);
        break;
      }

      case 'habits': {
        [items, total] = await Promise.all([
          db.habit.findMany({
            where,
            include: {
              user: { select: { id: true, name: true, email: true } },
              _count: { select: { records: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          db.habit.count({ where }),
        ]);
        break;
      }

      case 'goals': {
        [items, total] = await Promise.all([
          db.goal.findMany({
            where,
            include: {
              user: { select: { id: true, name: true, email: true } },
              _count: { select: { milestones: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          db.goal.count({ where }),
        ]);
        break;
      }

      case 'notes': {
        [items, total] = await Promise.all([
          db.note.findMany({
            where,
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          db.note.count({ where }),
        ]);
        break;
      }

      case 'events': {
        [items, total] = await Promise.all([
          db.calendarEvent.findMany({
            where,
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          db.calendarEvent.count({ where }),
        ]);
        break;
      }
    }

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      items,
      total,
      page,
      totalPages,
      type,
    });
  } catch (error) {
    console.error('[ADMIN CONTENT ERROR]', error);
    return NextResponse.json(
      { error: 'خطا در دریافت محتوا. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    );
  }
}