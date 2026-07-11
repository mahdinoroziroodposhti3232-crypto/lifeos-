import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'ایمیل الزامی است' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'اگر این ایمیل ثبت شده باشد، لینک ریست ارسال می‌شود.' },
        { status: 200 }
      );
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenEx = new Date(Date.now() + 3600000);

    await db.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenEx },
    });

    await db.auditLog.create({
      data: {
        action: 'PASSWORD_RESET_REQUEST',
        entity: 'User',
        entityId: user.id,
        details: `درخواست ریست رمز عبور`,
        userId: user.id,
      },
    });

    return NextResponse.json({
      message: 'لینک ریست رمز عبور آماده شد.',
      token: resetToken,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'خطا در درخواست' }, { status: 500 });
  }
}