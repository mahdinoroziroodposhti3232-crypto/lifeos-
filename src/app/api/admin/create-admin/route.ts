import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, secret } = body as {
      email?: string;
      password?: string;
      name?: string;
      secret?: string;
    };

    // Validate secret
    if (!secret || secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'کلید مدیریت نامعتبر است.' },
        { status: 401 }
      );
    }

    // Validate required fields
    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { error: 'ایمیل الزامی است.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'نام الزامی است.' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();
    const hashedPassword = await bcrypt.hash(password, 12);

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser) {
      // Update existing user to admin role
      const updatedUser = await db.user.update({
        where: { email: trimmedEmail },
        data: {
          role: 'admin',
          name: trimmedName,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      // Audit log
      await db.auditLog.create({
        data: {
          action: 'ADMIN_CREATED',
          entity: 'User',
          entityId: updatedUser.id,
          details: `Promoted existing user to admin: ${trimmedEmail}`,
          ipAddress: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null,
          userAgent: req.headers.get('user-agent') ?? null,
        },
      });

      return NextResponse.json({
        message: 'نقش کاربر موجود به مدیر ارتقا یافت.',
        user: updatedUser,
      });
    }

    // Create new admin user
    const newUser = await db.user.create({
      data: {
        email: trimmedEmail,
        password: hashedPassword,
        name: trimmedName,
        role: 'admin',
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'ADMIN_CREATED',
        entity: 'User',
        entityId: newUser.id,
        details: `Created new admin user: ${trimmedEmail}`,
        ipAddress: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null,
        userAgent: req.headers.get('user-agent') ?? null,
      },
    });

    return NextResponse.json({
      message: 'حساب مدیر با موفقیت ایجاد شد.',
      user: newUser,
    });
  } catch (error) {
    console.error('[ADMIN CREATE ERROR]', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد حساب مدیر. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    );
  }
}