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

    const goals = await db.goal.findMany({
      where: { userId },
      include: {
        milestones: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json({ error: 'خطا در دریافت اهداف' }, { status: 500 });
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
    const { milestones, ...goalData } = body;

    const goal = await db.goal.create({
      data: {
        title: goalData.title,
        description: goalData.description,
        status: goalData.status || 'in_progress',
        category: goalData.category,
        startDate: goalData.startDate,
        targetDate: goalData.targetDate,
        progress: goalData.progress || 0,
        userId,
        milestones: milestones
          ? {
              create: milestones.map((m: { title: string; order: number; isCompleted?: boolean }) => ({
                title: m.title,
                order: m.order,
                isCompleted: m.isCompleted || false,
              })),
            }
          : undefined,
      },
      include: {
        milestones: {
          orderBy: { order: 'asc' },
        },
      },
    });
    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json({ error: 'خطا در ایجاد هدف' }, { status: 500 });
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
    const { id, milestones, ...data } = body;
    if (!id) return NextResponse.json({ error: 'شناسه هدف الزامی است' }, { status: 400 });

    const existing = await db.goal.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: 'یافت نشد' }, { status: 404 });
    }

    // If milestones are provided, delete existing ones and create new ones
    if (milestones) {
      await db.milestone.deleteMany({ where: { goalId: id } });
    }

    const goal = await db.goal.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
        milestones: milestones
          ? {
              create: milestones.map((m: { title: string; order: number; isCompleted?: boolean }) => ({
                title: m.title,
                order: m.order,
                isCompleted: m.isCompleted || false,
              })),
            }
          : undefined,
      },
      include: {
        milestones: {
          orderBy: { order: 'asc' },
        },
      },
    });
    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی هدف' }, { status: 500 });
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
    if (!id) return NextResponse.json({ error: 'شناسه هدف الزامی است' }, { status: 400 });

    const existing = await db.goal.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: 'یافت نشد' }, { status: 404 });
    }

    // Delete milestones first, then the goal
    await db.milestone.deleteMany({ where: { goalId: id } });
    await db.goal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json({ error: 'خطا در حذف هدف' }, { status: 500 });
  }
}