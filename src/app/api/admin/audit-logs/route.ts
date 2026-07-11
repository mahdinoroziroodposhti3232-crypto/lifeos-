import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ──────────────────────────────────────────────
// Admin auth helper
// ──────────────────────────────────────────────
function isAdmin(req: NextRequest): boolean {
  const secret = req.headers.get('x-admin-secret');
  return secret === process.env.ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز. لطفاً کلید مدیریت معتبر وارد کنید.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)));
    const action = searchParams.get('action') ?? '';
    const userId = searchParams.get('userId') ?? '';

    // Build where clause
    const where: Record<string, unknown> = {};

    if (action) {
      where.action = action;
    }

    if (userId) {
      where.userId = userId;
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.auditLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    const formattedLogs = logs.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      details: log.details,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
      userId: log.userId,
      userName: log.user?.name ?? null,
      userEmail: log.user?.email ?? null,
    }));

    return NextResponse.json({
      logs: formattedLogs,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    console.error('[ADMIN AUDIT LOGS ERROR]', error);
    return NextResponse.json(
      { error: 'خطا در دریافت گزارش‌های نظارتی. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    );
  }
}