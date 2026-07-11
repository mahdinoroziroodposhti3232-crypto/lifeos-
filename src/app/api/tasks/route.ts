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
    const status = searchParams.get('status');
    const projectId = searchParams.get('projectId');
    const priority = searchParams.get('priority');
    const labelId = searchParams.get('labelId');
    const isArchived = searchParams.get('isArchived');
    const parentId = searchParams.get('parentId');

    const where: Record<string, unknown> = { userId };
    if (status) where.status = status;
    if (projectId) where.projectId = projectId;
    if (priority) where.priority = priority;
    if (labelId) where.labelId = labelId;
    if (isArchived !== null) where.isArchived = isArchived === 'true';
    if (parentId === 'null') where.parentId = null;
    else if (parentId) where.parentId = parentId;

    const tasks = await db.task.findMany({
      where,
      include: {
        project: { select: { id: true, title: true, color: true } },
        label: { select: { id: true, name: true, color: true } },
        children: { orderBy: { order: 'asc' } },
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'خطا در دریافت وظایف' }, { status: 500 });
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
    const task = await db.task.create({
      data: {
        title: body.title,
        description: body.description,
        status: body.status || 'todo',
        priority: body.priority || 'medium',
        dueDate: body.dueDate,
        dueTime: body.dueTime,
        reminderAt: body.reminderAt,
        repeatRule: body.repeatRule,
        projectId: body.projectId,
        labelId: body.labelId,
        parentId: body.parentId,
        estimatedMinutes: body.estimatedMinutes,
        userId,
      },
      include: {
        project: { select: { id: true, title: true, color: true } },
        label: { select: { id: true, name: true, color: true } },
      },
    });
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'خطا در ایجاد وظیفه' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'لطفاً ابتدا وارد شوید' }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'شناسه وظیفه الزامی است' }, { status: 400 });

    const existing = await db.task.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: 'یافت نشد' }, { status: 404 });
    }

    const task = await db.task.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        project: { select: { id: true, title: true, color: true } },
        label: { select: { id: true, name: true, color: true } },
      },
    });
    return NextResponse.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی وظیفه' }, { status: 500 });
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
    if (!id) return NextResponse.json({ error: 'شناسه وظیفه الزامی است' }, { status: 400 });

    const existing = await db.task.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: 'یافت نشد' }, { status: 404 });
    }

    await db.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'خطا در حذف وظیفه' }, { status: 500 });
  }
}