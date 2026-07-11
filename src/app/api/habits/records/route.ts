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
    const habitId = searchParams.get('habitId');

    const where: Record<string, unknown> = { userId };
    if (habitId) where.habitId = habitId;

    const records = await db.habitRecord.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching habit records:', error);
    return NextResponse.json({ error: 'خطا در دریافت رکوردهای عادت' }, { status: 500 });
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
    const { habitId, date, count } = body;

    if (!habitId || !date) {
      return NextResponse.json({ error: 'شناسه عادت و تاریخ الزامی هستند' }, { status: 400 });
    }

    // Verify the habit belongs to the user
    const habit = await db.habit.findFirst({ where: { id: habitId, userId } });
    if (!habit) {
      return NextResponse.json({ error: 'یافت نشد' }, { status: 404 });
    }

    const record = await db.habitRecord.create({
      data: {
        habitId,
        date: String(date),
        count: count ?? 1,
        userId,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating habit record:', error);
    return NextResponse.json({ error: 'خطا در ثبت رکورد عادت' }, { status: 500 });
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
    const habitId = searchParams.get('habitId');
    const date = searchParams.get('date');
    if (!habitId || !date) return NextResponse.json({ error: 'شناسه عادت و تاریخ الزامی هستند' }, { status: 400 });

    // Verify the habit belongs to the user
    const habit = await db.habit.findFirst({ where: { id: habitId, userId } });
    if (!habit) {
      return NextResponse.json({ error: 'یافت نشد' }, { status: 404 });
    }

    await db.habitRecord.deleteMany({ where: { habitId, date } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting habit record:', error);
    return NextResponse.json({ error: 'خطا در حذف رکورد عادت' }, { status: 500 });
  }
}