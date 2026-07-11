import { NextRequest, NextResponse } from 'next/server';

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

/* ------------------------------------------------------------------ */
/*  Local fallback when z-ai-web-dev-sdk is unavailable               */
/* ------------------------------------------------------------------ */

function getLocalResponse(userMessage: string): string {
  const msg = userMessage.trim().toLowerCase();

  if (msg.includes('برنامه‌ریزی') || msg.includes('برنامه ریزي') || msg.includes('امروز')) {
    return `📋 **برنامه‌ریزی پیشنهادی برای امروز:**

۱. **صبح (۸:۰۰ - ۱۰:۰۰)** — مهم‌ترین وظیفه‌ات رو انجام بده
   تکنیک «خوراکی قورباغه» رو امتحان کن: سخت‌ترین کار رو اول صبح بکن!

۲. **ظهر (۱۰:۰۰ - ۱۲:۰۰)** — کارهای متوسط اهمیت
   ۳ تا ۵ تسک با اولویت متوسط رو تموم کن.

۳. **بعدازظهر (۱۴:۰۰ - ۱۶:۰۰)** — جلسات و ارتباطات
   ایمیل‌ها رو چک کن و جلسات رو برگزار کن.

۴. **عصر (۱۶:۰۰ - ۱۷:۰۰)** — کارهای سبک
   یادداشت‌ها رو مرتب کن و فردا رو برنامه‌ریزی کن.

💡 **نکته:** هر ۹۰ دقیقه ۱۰ دقیقه استراحت کن! (تکنیک پومودورو)`;
  }

  if (msg.includes('تحلیل') || msg.includes('عملکرد') || msg.includes('بهره‌وری')) {
    return `📊 **تحلیل بهره‌وری شما:**

برای تحلیل دقیق‌تر، به این معیارها دقت کن:

**نشانگرهای کلیدی:**
- 🔥 **نرخ تکمیل وظایف:** بررسی کن چند درصد از تسک‌هات رو تموم می‌کنی
- ⏱️ **جلسات تمرکز:** روزی حداقل ۲ جلسه ۲۵ دقیقه‌ای داشته باش
- 📅 **ثبات عادت‌ها:** عادت‌هایی که ۷ روز متوالی انجام دادی رو ببین
- 🎯 **پیشرفت اهداف:** چک کن آیا در مسیر اهدافت هستی

**پیشنهاد بهبود:**
1. هر شب ۵ دقیقه مرور روز داشته باش
2. اولویت‌بندی روزانه انجام بده
3. عادت‌های کوچک ولی مستمر بساز
4. هفته‌ای یک بار آنالیز کامل انجام بده`;
  }

  if (msg.includes('اولویت') || msg.includes('اولويت')) {
    return `🎯 **روش اولویت‌بندی پیشنهادی:**

از ماتریس آیزنهاور استفاده کن:

| | عاجل | غیرعاجل |
|---|---|---|
| **مهم** | ✅ الان انجام بده | 📅 زمان‌بندی کن |
| **غیرمهم** | 👤 واگذار کن | 🗑️ حذف کن |

**۳ قدم عملی:**
1. همه کارهات رو لیست کن
2. هر کدوم رو دسته‌بندی کن (مهم/عاجل)
3. فقط روی خانه «مهم + عاجل» تمرکز کن

💡 نکته: بیشتر موفقیت‌ها از انجام کارهای «مهم ولی غیرعاجل» میاد!`;
  }

  if (msg.includes('عادت') || msg.includes('habit')) {
    return `🔄 **راهنمای ساخت عادت جدید:**

قانون ۲۱ روز + ۳ قانون طلایی جیمز کلیر:

۱. **واضح باشه** — «ورزش کنم» ❌ → «هر صبح ۱۰ دقیقه پیاده‌روی» ✅
۲. **کوچک شروع کن** — از ۲ دقیقه شروع کن، نه ۲ ساعت!
۳. **به چیزی وصلش کن** — بعد از مسواک زدن، فلان کار رو بکن

**عادت‌های پیشنهادی:**
- 🌅 صبح: ۵ دقیقه مدیتیشن
- 📖 روز: ۱۵ دقیقه مطالعه
- 🏃 عصر: ۱۰ دقیقه ورزش
- 📝 شب: ۳ دقیقه یادداشت روزانه

مثبت بودن از ۷۰٪ مسیر موفقیته! 💪`;
  }

  if (msg.includes('هدف') || msg.includes('goal')) {
    return `🎯 **تعیین اهداف هوشمند (SMART):**

هدف‌ت رو با این فرمول بنویس:

**S** — خاص (Specific): دقیقاً چی می‌خوای؟
**M** — قابل اندازه‌گیری (Measurable): چطور اندازه می‌گیری؟
**A** — قابل دستیابی (Achievable): واقع‌بینانه‌ست؟
**R** — مرتبط (Relevant): چرا مهمه؟
**T** — زمان‌بندی (Time-bound): کی باید تموم بشه؟

**مثال:**
❌ «زبان انگلیسی یاد بگیرم»
✅ «تا ۳ ماه آینده، روزی ۲۰ دقیقه انگلیسی بخونم و بتونم مکالمه ساده داشته باشم»

در اپ لایف‌او‌اس، اهداف رو با مایل‌استون‌ها (مراحل) تقسیم کن تا پیشرفتت مشخص بشه!`;
  }

  if (msg.includes('سلام') || msg.includes('درود') || msg.includes('هی') || msg.includes('خوبی')) {
    return `سلام! 😊 من دستیار هوشمند لایف‌او‌اس هستم.

می‌تونم تو این موارد کمکت کنم:
- 📋 برنامه‌ریزی روزانه و هفتگی
- 🎯 تعیین و پیگیری اهداف
- 📊 تحلیل عملکرد و بهره‌وری
- 🔄 ساخت عادت‌های جدید
- ✅ اولویت‌بندی وظایف

چه کمکی از دستم برمیاد؟`;
  }

  if (msg.includes('ممنون') || msg.includes('مرسی') || msg.includes('تشکر')) {
    return `خواهش می‌کنم! 😊 اگه سوال دیگه‌ای داشتی، در خدمتم. موفق باشی! 🌟`;
  }

  return `ممنون از پیامت! 🤔

من در حال حاضر به صورت آفلاین کار می‌کنم و می‌تونم در این موارد کمکت کنم:
- 📋 **برنامه‌ریزی** — بگو «برنامه‌ریزی امروز»
- 📊 **تحلیل عملکرد** — بگو «تحلیل عملکرد»
- 🎯 **اولویت‌بندی** — بگو «پیشنهاد اولویت»
- 🔄 **ساخت عادت** — بگو درباره عادت‌ها
- 🎯 **تعیین هدف** — بگو درباره اهداف

هر کدوم رو بگی راهنماییت می‌کنم!`;
}

/* ------------------------------------------------------------------ */
/*  API Route                                                          */
/* ------------------------------------------------------------------ */

let zaiInstance: any = null;
let zaiAvailable = false;

async function tryInitZAI() {
  if (zaiAvailable && zaiInstance) return zaiInstance;
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    zaiInstance = await ZAI.create();
    zaiAvailable = true;
    return zaiInstance;
  } catch {
    zaiAvailable = false;
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
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

    /* Try real AI first, fallback to local */
    const zai = await tryInitZAI();

    if (zai) {
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

      if (content && content.trim().length > 0) {
        return NextResponse.json({ content });
      }
    }

    /* Fallback: local smart responses */
    const content = getLocalResponse(lastUserMessage.content);
    return NextResponse.json({ content });
  } catch (error) {
    console.error('AI Chat API error:', error);

    /* On any error, try local fallback */
    try {
      const body = await request.clone().json();
      const messages = body.messages as Array<{ role: string; content: string }>;
      const lastUserMessage = messages?.findLast((m: any) => m.role === 'user');
      if (lastUserMessage) {
        const content = getLocalResponse(lastUserMessage.content);
        return NextResponse.json({ content });
      }
    } catch { /* ignore */ }

    return NextResponse.json(
      { error: 'خطا در ارتباط با دستیار هوشمند.' },
      { status: 500 }
    );
  }
}