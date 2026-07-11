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

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // Run all queries in parallel
    const [
      totalUsers,
      activeUsersToday,
      totalProjects,
      totalTasks,
      totalGoals,
      totalHabits,
      totalNotes,
      focusResult,
      recentSignups,
      previousSignups,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({
        where: { lastLoginAt: { gte: todayStart } },
      }),
      db.project.count(),
      db.task.count(),
      db.goal.count(),
      db.habit.count(),
      db.note.count(),
      db.focusSession.aggregate({ _sum: { duration: true } }),
      db.user.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      db.user.count({
        where: {
          createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
        },
      }),
    ]);

    const totalFocusMinutes = focusResult._sum.duration ?? 0;

    const userGrowthPercent =
      previousSignups > 0
        ? Number((((recentSignups - previousSignups) / previousSignups) * 100).toFixed(1))
        : recentSignups > 0
          ? 100
          : 0;

    return NextResponse.json({
      totalUsers,
      activeUsersToday,
      totalProjects,
      totalTasks,
      totalGoals,
      totalHabits,
      totalNotes,
      totalFocusMinutes,
      recentSignups,
      userGrowthPercent,
    });
  } catch (error) {
    console.error('[ADMIN STATS ERROR]', error);
    return NextResponse.json(
      { error: 'خطا در دریافت آمار سیستم. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    );
  }
}