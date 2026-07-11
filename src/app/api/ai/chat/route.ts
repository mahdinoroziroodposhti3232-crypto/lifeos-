import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import ZAI from 'z-ai-web-dev-sdk';

const SYSTEM_PROMPT = `تو دستیار هوشمند لایف‌او‌اس هستی — یک سیستم مدیریت زندگی جامع.
تو به کاربران کمک می‌کنی در:
- برنامه‌ریزی روزانه و هفتگی
- اولویت‌بندی وظایف
- تحلیل عملکرد و بهره‌وری
- پیشنهاد برای بهبود عادت‌ها
- مدیریت اهداف و پروژه‌ها

اپلیکیشن لایف‌او‌اس این امکانات را دارد:
- مدیریت وظایف (Tasks)
- مدیریت پروژه‌ها (Projects)
- پیگیری عادت‌ها (Habits)
- تعیین اهداف (Goals)
- جلسات تمرکز (Focus Sessions)
- یادداشت‌ها (Notes)
- رویدادهای تقویم (Calendar Events)

همه پاسخ‌ها باید به زبان فارسی باشد. لحن دوستانه و حرفه‌ای.
اگر اطلاعات کافی نداری، صادقانه بگو.`;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'لطفاً ابتدا وارد حساب کاربری خود شوید.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { messages } = body as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'پیام‌ها باید به صورت آرایه‌ای از پیام‌ها ارسال شوند.' },
        { status: 400 }
      );
    }

    const lastUserMessage = messages.findLast((m) => m.role === 'user');
    if (!lastUserMessage) {
      return NextResponse.json(
        { error: 'حداقل یک پیام از کاربر نیاز است.' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    const chatMessages = [
      { role: 'assistant' as const, content: SYSTEM_PROMPT },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const completion = await zai.chat.completions.create({
      messages: chatMessages,
      thinking: { type: 'disabled' },
    });

    const content = completion.choices?.[0]?.message?.content;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'خطا در دریافت پاسخ از هوش مصنوعی. لطفاً دوباره تلاش کنید.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error('AI Chat API error:', error);

    const message =
      error instanceof Error ? error.message : 'خطای ناشناخته‌ای رخ داد.';

    return NextResponse.json(
      { error: `خطا در ارتباط با دستیار هوشمند: ${message}` },
      { status: 500 }
    );
  }
}