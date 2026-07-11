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

    const labels = await db.label.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(labels);
  } catch (error) {
    console.error('Error fetching labels:', error);
    return NextResponse.json({ error: 'خطا در دریافت برچسب‌ها' }, { status: 500 });
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
    const label = await db.label.create({
      data: {
        name: body.name,
        color: body.color,
        userId,
      },
    });
    return NextResponse.json(label, { status: 201 });
  } catch (error) {
    console.error('Error creating label:', error);
    return NextResponse.json({ error: 'خطا در ایجاد برچسب' }, { status: 500 });
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
    if (!id) return NextResponse.json({ error: 'شناسه برچسب الزامی است' }, { status: 400 });

    const existing = await db.label.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: 'یافت نشد' }, { status: 404 });
    }

    const label = await db.label.update({
      where: { id },
      data,
    });
    return NextResponse.json(label);
  } catch (error) {
    console.error('Error updating label:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی برچسب' }, { status: 500 });
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
    if (!id) return NextResponse.json({ error: 'شناسه برچسب الزامی است' }, { status: 400 });

    const existing = await db.label.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: 'یافت نشد' }, { status: 404 });
    }

    await db.label.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting label:', error);
    return NextResponse.json({ error: 'خطا در حذف برچسب' }, { status: 500 });
  }
}