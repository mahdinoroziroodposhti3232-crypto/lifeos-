import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const habitId = searchParams.get('habitId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const where: Record<string, unknown> = {};

    if (habitId) {
      where.habitId = habitId;
    }

    if (from || to) {
      where.date = {};
      if (from) (where.date as Record<string, unknown>).gte = new Date(from);
      if (to) (where.date as Record<string, unknown>).lte = new Date(to);
    }

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
    const body = await request.json();
    const { habitId, date, ...data } = body;

    if (!habitId || !date) {
      return NextResponse.json(
        { error: 'شناسه عادت و تاریخ الزامی هستند' },
        { status: 400 }
      );
    }

    // Upsert: create or update a habit record for the given habitId + date
    const record = await db.habitRecord.upsert({
      where: {
        habitId_date: {
          habitId,
          date: new Date(date),
        },
      },
      update: {
        ...data,
        updatedAt: new Date(),
      },
      create: {
        habitId,
        date: new Date(date),
        value: data.value ?? true,
        note: data.note,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating/updating habit record:', error);
    return NextResponse.json({ error: 'خطا در ثبت رکورد عادت' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'شناسه رکورد الزامی است' }, { status: 400 });

    const record = await db.habitRecord.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
    return NextResponse.json(record);
  } catch (error) {
    console.error('Error updating habit record:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی رکورد عادت' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'شناسه رکورد الزامی است' }, { status: 400 });

    await db.habitRecord.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting habit record:', error);
    return NextResponse.json({ error: 'خطا در حذف رکورد عادت' }, { status: 500 });
  }
}