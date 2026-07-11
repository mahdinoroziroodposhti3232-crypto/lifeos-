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

// ──────────────────────────────────────────────
// GET — single user with content counts
// ──────────────────────────────────────────────
export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز. لطفاً کلید مدیریت معتبر وارد کنید.' },
        { status: 401 }
      );
    }

    const { id } = await ctx.params;

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        bio: true,
        role: true,
        isActive: true,
        resetToken: true,
        resetTokenEx: true,
        lastLoginAt: true,
        timezone: true,
        calendarType: true,
        theme: true,
        language: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            tasks: true,
            projects: true,
            habits: true,
            goals: true,
            notes: true,
            focusSessions: true,
            calendarEvents: true,
            labels: true,
            notifications: true,
            auditLogs: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'کاربر مورد نظر یافت نشد.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...user,
      taskCount: user._count.tasks,
      projectCount: user._count.projects,
      habitCount: user._count.habits,
      goalCount: user._count.goals,
      noteCount: user._count.notes,
      focusSessionCount: user._count.focusSessions,
      calendarEventCount: user._count.calendarEvents,
      labelCount: user._count.labels,
    });
  } catch (error) {
    console.error('[ADMIN USER GET ERROR]', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات کاربر. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    );
  }
}

// ──────────────────────────────────────────────
// PATCH — update user fields / reset password
// ──────────────────────────────────────────────
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز. لطفاً کلید مدیریت معتبر وارد کنید.' },
        { status: 401 }
      );
    }

    const { id } = await ctx.params;
    const body = await req.json();

    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json(
        { error: 'کاربر مورد نظر یافت نشد.' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (typeof body.name === 'string' && body.name.trim()) {
      updateData.name = body.name.trim();
    }

    if (typeof body.role === 'string' && ['user', 'admin'].includes(body.role)) {
      updateData.role = body.role;
    }

    if (typeof body.isActive === 'boolean') {
      updateData.isActive = body.isActive;
    }

    if (typeof body.newPassword === 'string' && body.newPassword.length >= 6) {
      const hashed = await bcrypt.hash(body.newPassword, 12);
      updateData.password = hashed;
      // Clear reset token when admin sets a new password
      updateData.resetToken = null;
      updateData.resetTokenEx = null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'هیچ فیلدی برای به‌روزرسانی ارسال نشده است.' },
        { status: 400 }
      );
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        bio: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        timezone: true,
        calendarType: true,
        theme: true,
        language: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'ADMIN_UPDATE_USER',
        entity: 'User',
        entityId: id,
        details: `Updated fields: ${Object.keys(updateData).join(', ')}`,
        ipAddress: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null,
        userAgent: req.headers.get('user-agent') ?? null,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('[ADMIN USER PATCH ERROR]', error);
    return NextResponse.json(
      { error: 'خطا در به‌روزرسانی اطلاعات کاربر. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    );
  }
}

// ──────────────────────────────────────────────
// DELETE — soft-delete (set isActive = false)
// ──────────────────────────────────────────────
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز. لطفاً کلید مدیریت معتبر وارد کنید.' },
        { status: 401 }
      );
    }

    const { id } = await ctx.params;

    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json(
        { error: 'کاربر مورد نظر یافت نشد.' },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'این کاربر قبلاً غیرفعال شده است.' },
        { status: 400 }
      );
    }

    await db.user.update({
      where: { id },
      data: { isActive: false },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'ADMIN_DEACTIVATE_USER',
        entity: 'User',
        entityId: id,
        details: `Deactivated user: ${user.email}`,
        ipAddress: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null,
        userAgent: req.headers.get('user-agent') ?? null,
      },
    });

    return NextResponse.json({
      message: 'کاربر با موفقیت غیرفعال شد.',
      userId: id,
    });
  } catch (error) {
    console.error('[ADMIN USER DELETE ERROR]', error);
    return NextResponse.json(
      { error: 'خطا در غیرفعال‌سازی کاربر. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    );
  }
}