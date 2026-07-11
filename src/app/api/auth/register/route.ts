import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

const DEFAULT_LABELS = [
  { name: 'کار', color: '#3B82F6' },
  { name: 'شخصی', color: '#10B981' },
  { name: 'سلامتی', color: '#EF4444' },
  { name: 'یادگیری', color: '#F59E0B' },
  { name: 'خرید', color: '#8B5CF6' },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'ایمیل الزامی است' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'رمز عبور باید حداقل ۶ کاراکتر باشد' },
        { status: 400 }
      );
    }

    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'این ایمیل قبلاً ثبت شده است' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        name: name?.trim() || 'کاربر',
        email: email.toLowerCase().trim(),
        password: hashedPassword,
      },
    });

    await db.label.createMany({
      data: DEFAULT_LABELS.map((label) => ({
        ...label,
        userId: user.id,
      })),
    });

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json(
      { error: 'خطا در ثبت‌نام' },
      { status: 500 }
    );
  }
}