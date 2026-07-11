import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Special action: return today's habit records
    if (action === 'today-records') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const habits = await db.habit.findMany({
        where: {},
        include: {
          records: {
            where: {
              date: {
                gte: today,
                lt: tomorrow,
              },
            },
            orderBy: { date: 'desc' },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      return NextResponse.json(habits);
    }

    const habits = await db.habit.findMany({
      where: {},
      include: {
        records: {
          orderBy: { date: 'desc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(habits);
  } catch (error) {
    console.error('Error fetching habits:', error);
    return NextResponse.json({ error: 'خطا در دریافت عادت‌ها' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const habit = await db.habit.create({
      data: {
        title: body.title,
        description: body.description,
        icon: body.icon,
        color: body.color,
        frequency: body.frequency || 'daily',
        targetCount: body.targetCount || 1,
        unit: body.unit,
        startDate: body.startDate,
        userId: body.userId || 'default',
      },
    });
    return NextResponse.json(habit, { status: 201 });
  } catch (error) {
    console.error('Error creating habit:', error);
    return NextResponse.json({ error: 'خطا در ایجاد عادت' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'شناسه عادت الزامی است' }, { status: 400 });

    const habit = await db.habit.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
    return NextResponse.json(habit);
  } catch (error) {
    console.error('Error updating habit:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی عادت' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'شناسه عادت الزامی است' }, { status: 400 });

    // Delete records first, then the habit
    await db.habitRecord.deleteMany({ where: { habitId: id } });
    await db.habit.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting habit:', error);
    return NextResponse.json({ error: 'خطا در حذف عادت' }, { status: 500 });
  }
}