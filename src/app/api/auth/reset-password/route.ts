import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || !newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'توکن و رمز عبور جدید (حداقل ۶ کاراکتر) الزامی است' },
        { status: 400 }
      );
    }

    const user = await db.user.findFirst({
      where: {
        resetToken: token,
        resetTokenEx: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'لینک ریست منقضی شده یا نامعتبر است' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenEx: null,
      },
    });

    await db.auditLog.create({
      data: {
        action: 'PASSWORD_RESET',
        entity: 'User',
        entityId: user.id,
        userId: user.id,
      },
    });

    return NextResponse.json({ message: 'رمز عبور با موفقیت تغییر کرد' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'خطا در تغییر رمز عبور' }, { status: 500 });
  }
}