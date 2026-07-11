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
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const search = searchParams.get('search') ?? '';
    const role = searchParams.get('role') ?? '';
    const isActiveParam = searchParams.get('isActive');
    const sort = searchParams.get('sort') ?? 'createdAt';
    const order = searchParams.get('order') ?? 'desc';

    // Build where clause
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isActiveParam !== null && isActiveParam !== '') {
      where.isActive = isActiveParam === 'true';
    }

    // Build orderBy — whitelist allowed fields
    const allowedSortFields = ['createdAt', 'updatedAt', 'name', 'email', 'lastLoginAt', 'role'];
    const sortField = allowedSortFields.includes(sort) ? sort : 'createdAt';
    const orderDir = order === 'asc' ? 'asc' : 'desc';

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
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
        orderBy: { [sortField]: orderDir },
        skip,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      users,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    console.error('[ADMIN USERS LIST ERROR]', error);
    return NextResponse.json(
      { error: 'خطا در دریافت لیست کاربران. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    );
  }
}