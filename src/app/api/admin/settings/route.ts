import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ──────────────────────────────────────────────
// Admin auth helper
// ──────────────────────────────────────────────
function isAdmin(req: NextRequest): boolean {
  const secret = req.headers.get('x-admin-secret');
  return secret === process.env.ADMIN_SECRET;
}

// ──────────────────────────────────────────────
// GET — return all system settings as key-value map
// ──────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز. لطفاً کلید مدیریت معتبر وارد کنید.' },
        { status: 401 }
      );
    }

    const settings = await db.systemSetting.findMany({
      select: {
        key: true,
        value: true,
      },
    });

    // Convert array to key-value object
    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    return NextResponse.json(settingsMap);
  } catch (error) {
    console.error('[ADMIN SETTINGS GET ERROR]', error);
    return NextResponse.json(
      { error: 'خطا در دریافت تنظیمات سیستم. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    );
  }
}

// ──────────────────────────────────────────────
// PUT — upsert a system setting
// ──────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز. لطفاً کلید مدیریت معتبر وارد کنید.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { key, value } = body as { key?: string; value?: string };

    if (!key || typeof key !== 'string' || !key.trim()) {
      return NextResponse.json(
        { error: 'نام تنظیم (key) الزامی است.' },
        { status: 400 }
      );
    }

    if (value === undefined || value === null) {
      return NextResponse.json(
        { error: 'مقدار تنظیم (value) الزامی است.' },
        { status: 400 }
      );
    }

    const setting = await db.systemSetting.upsert({
      where: { key: key.trim() },
      update: { value: String(value) },
      create: { key: key.trim(), value: String(value) },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'ADMIN_UPDATE_SETTING',
        entity: 'SystemSetting',
        entityId: setting.id,
        details: `Updated setting: ${key} = ${value}`,
        ipAddress: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null,
        userAgent: req.headers.get('user-agent') ?? null,
      },
    });

    return NextResponse.json({
      message: 'تنظیم با موفقیت ذخیره شد.',
      setting: {
        key: setting.key,
        value: setting.value,
      },
    });
  } catch (error) {
    console.error('[ADMIN SETTINGS PUT ERROR]', error);
    return NextResponse.json(
      { error: 'خطا در ذخیره تنظیمات. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    );
  }
}