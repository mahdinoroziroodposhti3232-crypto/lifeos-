import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

function dateStr(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    let userId = body.userId;

    // If no userId provided, create a demo user
    if (!userId) {
      const hashedPassword = await bcrypt.hash('demo1234', 10);
      const demoUser = await db.user.create({
        data: {
          name: 'کاربر دمو',
          email: `demo-${Date.now()}@lifeos.ir`,
          password: hashedPassword,
        },
      });
      userId = demoUser.id;
    }

    // Clear existing data for this user only
    await db.habitRecord.deleteMany({ where: { userId } });
    await db.milestone.deleteMany({ where: { userId } });
    await db.task.deleteMany({ where: { userId } });
    await db.focusSession.deleteMany({ where: { userId } });
    await db.calendarEvent.deleteMany({ where: { userId } });
    await db.note.deleteMany({ where: { userId } });
    await db.habit.deleteMany({ where: { userId } });
    await db.goal.deleteMany({ where: { userId } });
    await db.project.deleteMany({ where: { userId } });
    await db.label.deleteMany({ where: { userId } });
    await db.dashboardLayout.deleteMany({ where: { userId } });
    await db.userSetting.deleteMany({ where: { userId } });

    // --- Labels ---
    const labelWork = await db.label.create({ data: { name: 'کار', color: '#3B82F6', userId } });
    const labelPersonal = await db.label.create({ data: { name: 'شخصی', color: '#10B981', userId } });
    const labelHealth = await db.label.create({ data: { name: 'سلامتی', color: '#EF4444', userId } });
    const labelLearning = await db.label.create({ data: { name: 'یادگیری', color: '#F59E0B', userId } });
    const labelShopping = await db.label.create({ data: { name: 'خرید', color: '#8B5CF6', userId } });

    // --- Projects ---
    const projectWeb = await db.project.create({
      data: {
        title: 'طراحی وبسایت', description: 'طراحی و توسعه وبسایت شخصی جدید',
        color: '#3B82F6', icon: '🌐', status: 'active',
        startDate: dateStr(-5), endDate: dateStr(14), userId,
      },
    });
    const projectLanguage = await db.project.create({
      data: {
        title: 'یادگیری زبان', description: 'یادگیری زبان انگلیسی روزانه',
        color: '#10B981', icon: '📚', status: 'active',
        startDate: dateStr(-10), userId,
      },
    });
    const projectExercise = await db.project.create({
      data: {
        title: 'برنامه ورزشی', description: 'برنامه ورزشی هفتگی',
        color: '#EF4444', icon: '💪', status: 'active',
        startDate: dateStr(-7), userId,
      },
    });

    // --- Tasks (15) ---
    await db.task.createMany({
      data: [
        { id: `${userId}-task-1`, title: 'طراحی صفحه اصلی وبسایت', description: 'طراحی UI/UX صفحه اصلی شامل هدر، فوتر و بخش‌های اصلی', status: 'in-progress', priority: 'high', dueDate: dateStr(1), order: 0, projectId: projectWeb.id, labelId: labelWork.id, userId },
        { id: `${userId}-task-2`, title: 'نوشتن محتوای صفحه درباره ما', description: 'تولید محتوای فارسی برای صفحه درباره ما', status: 'todo', priority: 'medium', dueDate: dateStr(3), order: 1, projectId: projectWeb.id, labelId: labelWork.id, userId },
        { id: `${userId}-task-3`, title: 'بهینه‌سازی سئو', description: 'بررسی و بهینه‌سازی سئوی صفحات', status: 'todo', priority: 'low', dueDate: dateStr(7), order: 2, projectId: projectWeb.id, labelId: labelWork.id, userId },
        { id: `${userId}-task-4`, title: 'تست ریسپانسیو', description: 'بررسی سازگاری با موبایل و تبلت', status: 'todo', priority: 'medium', dueDate: dateStr(5), order: 3, projectId: projectWeb.id, labelId: labelWork.id, userId },
        { id: `${userId}-task-5`, title: 'تمرین لغات جدید انگلیسی', description: 'یادگیری ۲۰ لغت جدید انگلیسی', status: 'done', priority: 'medium', dueDate: dateStr(-1), order: 0, projectId: projectLanguage.id, labelId: labelLearning.id, userId },
        { id: `${userId}-task-6`, title: 'دیدن ویدیوی آموزشی انگلیسی', description: 'تماشای ویدیو با زیرنویس انگلیسی', status: 'done', priority: 'low', dueDate: dateStr(-2), order: 1, projectId: projectLanguage.id, labelId: labelLearning.id, userId },
        { id: `${userId}-task-7`, title: 'خواندن فصل کتاب انگلیسی', description: 'خواندن فصل سوم کتاب Grammar in Use', status: 'in-progress', priority: 'medium', dueDate: dateStr(0), order: 2, projectId: projectLanguage.id, labelId: labelLearning.id, userId },
        { id: `${userId}-task-8`, title: 'تمرین ورزش صبحگاهی', description: '۳۰ دقیقه دویدن و حرکات کششی', status: 'done', priority: 'high', dueDate: dateStr(0), order: 0, projectId: projectExercise.id, labelId: labelHealth.id, userId },
        { id: `${userId}-task-9`, title: 'برنامه‌ریزی تمرین هفته آینده', description: 'تنظیم برنامه ورزشی هفته آینده', status: 'todo', priority: 'medium', dueDate: dateStr(2), order: 1, projectId: projectExercise.id, labelId: labelHealth.id, userId },
        { id: `${userId}-task-10`, title: 'خرید مواد غذایی', description: 'خرید میوه، سبزیجات و لبنیات', status: 'todo', priority: 'high', dueDate: dateStr(0), order: 3, labelId: labelShopping.id, userId },
        { id: `${userId}-task-11`, title: 'خرید هدیه تولد', description: 'خرید هدیه برای دوست', status: 'todo', priority: 'medium', dueDate: dateStr(3), order: 4, labelId: labelShopping.id, userId },
        { id: `${userId}-task-12`, title: 'پاسخ به ایمیل‌های کاری', description: 'پاسخگویی به ۵ ایمیل پاسخ‌داده‌نشده', status: 'in-progress', priority: 'high', dueDate: dateStr(0), order: 5, labelId: labelWork.id, userId },
        { id: `${userId}-task-13`, title: 'تمیز کردن اتاق کار', description: 'مرتب‌سازی و نظافت اتاق کار', status: 'todo', priority: 'low', dueDate: dateStr(7), order: 6, labelId: labelPersonal.id, userId },
        { id: `${userId}-task-14`, title: 'آماده‌سازی ارائه', description: 'ساخت پاورپوینت برای جلسه هفته آینده', status: 'todo', priority: 'high', dueDate: dateStr(2), order: 7, labelId: labelWork.id, userId },
        { id: `${userId}-task-15`, title: 'تمدید اشتراک نرم‌افزار', description: 'تمدید لایسنس IDE و ابزارهای توسعه', status: 'todo', priority: 'medium', dueDate: dateStr(-2), order: 8, labelId: labelWork.id, userId },
      ],
    });

    // --- Goals ---
    await db.goal.create({
      data: {
        id: `${userId}-goal-1`, title: 'توسعه مهارت‌های برنامه‌نویسی',
        description: 'یادگیری فریمورک‌های جدید و بهبود مهارت‌های فنی',
        category: 'work', progress: 35,
        startDate: dateStr(-30), endDate: dateStr(60), userId,
        milestones: {
          create: [
            { id: `${userId}-ms-1`, title: 'تکمیل دوره Next.js', order: 0, isCompleted: true, userId },
            { id: `${userId}-ms-2`, title: 'ساخت ۳ پروژه تمرینی', order: 1, isCompleted: true, userId },
            { id: `${userId}-ms-3`, title: 'یادگیری TypeScript پیشرفته', order: 2, isCompleted: false, userId },
            { id: `${userId}-ms-4`, title: 'شرکت در یک پروژه متن‌باز', order: 3, isCompleted: false, userId },
          ],
        },
      },
    });
    await db.goal.create({
      data: {
        id: `${userId}-goal-2`, title: 'بهبود وضعیت سلامت',
        description: 'رسیدن به وزن ایده‌آل و بهبود فیتنس عمومی',
        category: 'health', progress: 50,
        startDate: dateStr(-20), endDate: dateStr(90), userId,
        milestones: {
          create: [
            { id: `${userId}-ms-5`, title: 'کاهش ۲ کیلوگرم وزن', order: 0, isCompleted: true, userId },
            { id: `${userId}-ms-6`, title: 'دویدن ۵ کیلومتر بدون توقف', order: 1, isCompleted: false, userId },
            { id: `${userId}-ms-7`, title: 'عضویت در کلاس یوگا', order: 2, isCompleted: true, userId },
          ],
        },
      },
    });
    await db.goal.create({
      data: {
        id: `${userId}-goal-3`, title: 'خواندن ۱۲ کتاب در سال',
        description: 'خواندن ماهانه یک کتاب از لیست مطالعاتی',
        category: 'education', progress: 25,
        startDate: dateStr(-60), endDate: dateStr(180), userId,
        milestones: {
          create: [
            { id: `${userId}-ms-8`, title: 'خواندن اتمی عادت‌ها', order: 0, isCompleted: true, userId },
            { id: `${userId}-ms-9`, title: 'خواندن قدرت عادت', order: 1, isCompleted: true, userId },
            { id: `${userId}-ms-10`, title: 'خواندن تفکر سریع و کند', order: 2, isCompleted: false, userId },
            { id: `${userId}-ms-11`, title: 'خواندن هنر شفاف اندیشیدن', order: 3, isCompleted: false, userId },
            { id: `${userId}-ms-12`, title: 'خواندن سواد مالی', order: 4, isCompleted: false, userId },
          ],
        },
      },
    });

    // --- Habits ---
    const habitStudy = await db.habit.create({ data: { id: `${userId}-habit-1`, title: 'مطالعه', description: 'حداقل ۳۰ دقیقه مطالعه روزانه', icon: '📖', color: '#3B82F6', frequency: 'daily', targetCount: 1, userId } });
    const habitExercise = await db.habit.create({ data: { id: `${userId}-habit-2`, title: 'ورزش', description: 'حداقل ۲۰ دقیقه ورزش روزانه', icon: '🏃', color: '#EF4444', frequency: 'daily', targetCount: 1, userId } });
    const habitMeditation = await db.habit.create({ data: { id: `${userId}-habit-3`, title: 'مدیتیشن', description: '۱۰ دقیقه مدیتیشن صبحگاهی', icon: '🧘', color: '#10B981', frequency: 'daily', targetCount: 1, userId } });
    const habitWriting = await db.habit.create({ data: { id: `${userId}-habit-4`, title: 'نوشتن روزانه', description: 'نوشتن خاطرات یا ایده‌های روزانه', icon: '✍️', color: '#F59E0B', frequency: 'daily', targetCount: 1, userId } });

    // --- Habit Records (last 5 days) ---
    const habitRecords = [
      { habitId: habitStudy.id, date: dateStr(-4), count: 1, userId },
      { habitId: habitExercise.id, date: dateStr(-4), count: 1, userId },
      { habitId: habitMeditation.id, date: dateStr(-4), count: 1, userId },
      { habitId: habitStudy.id, date: dateStr(-3), count: 1, userId },
      { habitId: habitExercise.id, date: dateStr(-3), count: 1, userId },
      { habitId: habitWriting.id, date: dateStr(-3), count: 1, userId },
      { habitId: habitStudy.id, date: dateStr(-2), count: 1, userId },
      { habitId: habitMeditation.id, date: dateStr(-2), count: 1, userId },
      { habitId: habitWriting.id, date: dateStr(-2), count: 1, userId },
      { habitId: habitStudy.id, date: dateStr(-1), count: 1, userId },
      { habitId: habitExercise.id, date: dateStr(-1), count: 1, userId },
      { habitId: habitMeditation.id, date: dateStr(-1), count: 1, userId },
      { habitId: habitWriting.id, date: dateStr(-1), count: 1, userId },
      { habitId: habitStudy.id, date: dateStr(0), count: 1, userId },
      { habitId: habitExercise.id, date: dateStr(0), count: 1, userId },
    ];
    for (const r of habitRecords) {
      await db.habitRecord.create({ data: r });
    }

    // --- Notes ---
    await db.note.createMany({
      data: [
        { id: `${userId}-note-1`, title: 'ایده‌های پروژه جدید', content: '۱. ساخت اپلیکیشن مدیریت زمان\n۲. طراحی سیستم یادداشت‌برداری هوشمند\n۳. توسعه ربات تلگرام برای یادآوری وظایف', color: '#FEF3C7', isPinned: true, userId },
        { id: `${userId}-note-2`, title: 'نکات جلسه تیم', content: 'بررسی پیشرفت پروژه وبسایت\nتعیین مسئولیت‌های جدید\nجلسه بعدی: سه‌شنبه ساعت ۱۰ صبح', color: '#DBEAFE', isPinned: false, userId },
        { id: `${userId}-note-3`, title: 'لیست خرید هفته', content: '- شیر و ماست\n- میوه فصل\n- مرغ\n- برنج\n- روغن زیتون\n- سبزیجات تازه', color: '#D1FAE5', isPinned: false, userId },
        { id: `${userId}-note-4`, title: 'نقل‌قول‌های الهام‌بخش', content: '"تنها راه انجام کار بزرگ، عشق به کاری است که انجام می‌دهی."\n\n"موفقیت نتیجه تلاش مداوم است."', color: '#FCE7F3', isPinned: true, userId },
        { id: `${userId}-note-5`, title: 'برنامه سفر', content: 'مقصد: شیراز\nتاریخ: دو هفته آینده\nاقدامات:\n- رزرو هتل\n- خرید بلیط قطار\n- تهیه لیست مکان‌های دیدنی', color: '#EDE9FE', isPinned: false, userId },
      ],
    });

    // --- Focus Sessions (10 for the past week) ---
    const sessions = [
      { type: 'pomodoro', duration: 45, daysAgo: 6 },
      { type: 'pomodoro', duration: 30, daysAgo: 5 },
      { type: 'pomodoro', duration: 60, daysAgo: 5 },
      { type: 'pomodoro', duration: 25, daysAgo: 4 },
      { type: 'pomodoro', duration: 50, daysAgo: 3 },
      { type: 'short-break', duration: 5, daysAgo: 3 },
      { type: 'pomodoro', duration: 35, daysAgo: 2 },
      { type: 'pomodoro', duration: 40, daysAgo: 2 },
      { type: 'pomodoro', duration: 55, daysAgo: 1 },
      { type: 'pomodoro', duration: 45, daysAgo: 1 },
      { type: 'short-break', duration: 5, daysAgo: 1 },
      { type: 'pomodoro', duration: 30, daysAgo: 0 },
    ];
    for (let i = 0; i < sessions.length; i++) {
      const s = sessions[i];
      const completedAt = new Date();
      completedAt.setDate(completedAt.getDate() - s.daysAgo);
      await db.focusSession.create({
        data: { id: `${userId}-fs-${i + 1}`, type: s.type, duration: s.duration, completedAt, userId },
      });
    }

    // --- Calendar Events (5 for this week) ---
    const events = [
      { title: 'جلسه تیم طراحی', description: 'بررسی وایرفریم‌های جدید', daysOffset: 0, startTime: '10:00', endTime: '11:00', color: '#3B82F6' },
      { title: 'کلاس زبان انگلیسی', description: 'جلسه هفتگی کلاس زبان', daysOffset: 1, startTime: '17:00', endTime: '18:30', color: '#10B981' },
      { title: 'تمرین ورزشی گروهی', description: 'فوتبال در باشگاه ورزشی', daysOffset: 2, startTime: '18:00', endTime: '20:00', color: '#EF4444' },
      { title: 'ملاقات با مشتری', description: 'ارائه پیشنهاد پروژه', daysOffset: 3, startTime: '11:00', endTime: '11:45', color: '#F59E0B' },
      { title: 'جلسه بررسی پروژه', description: 'بررسی پیشرفت پروژه وبسایت', daysOffset: 5, startTime: '14:00', endTime: '15:00', color: '#8B5CF6' },
    ];
    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      await db.calendarEvent.create({
        data: {
          id: `${userId}-evt-${i + 1}`, title: e.title, description: e.description,
          date: dateStr(e.daysOffset), startTime: e.startTime, endTime: e.endTime,
          color: e.color, isAllDay: false, userId,
        },
      });
    }

    return NextResponse.json({ seeded: true, userId, message: 'داده‌های آزمایشی با موفقیت ایجاد شد' });
  } catch (error) {
    console.error('Error seeding data:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد داده‌های آزمایشی', details: String(error) },
      { status: 500 }
    );
  }
}