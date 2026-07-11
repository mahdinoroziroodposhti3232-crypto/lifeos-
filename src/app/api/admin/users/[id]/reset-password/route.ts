import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// ──────────────────────────────────────────────
// Admin auth helper
// ──────────────────────────────────────────────
function isAdmin(req: NextRequest): boolean {
  const secret = req.headers.get('x-admin-secret');
  return secret === process.env.ADMIN_SECRET;
}

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز. لطفاً کلید مدیریت معتبر وارد کنید.' },
        { status: 401 }
      );
    }

    const { id } = await ctx.params;
    const body = await req.json();
    const { newPassword } = body as { newPassword?: string };

    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json(
        { error: 'لطفاً رمز عبور جدید را وارد کنید.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json(
        { error: 'کاربر مورد نظر یافت نشد.' },
        { status: 404 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await db.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenEx: null,
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'ADMIN_RESET_PASSWORD',
        entity: 'User',
        entityId: id,
        details: `Admin reset password for user: ${user.email}`,
        ipAddress: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null,
        userAgent: req.headers.get('user-agent') ?? null,
      },
    });

    return NextResponse.json({
      message: 'رمز عبور کاربر با موفقیت بازنشانی شد.',
      userId: id,
    });
  } catch (error) {
    console.error('[ADMIN RESET PASSWORD ERROR]', error);
    return NextResponse.json(
      { error: 'خطا در بازنشانی رمز عبور. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    );
  }
}