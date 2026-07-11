import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

function dateStr(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

function jalaaliDateStr(daysOffset: number): string {
  // Simple format for date field: YYYY-MM-DD
  return dateStr(daysOffset);
}

export async function POST(request: NextRequest) {
  try {
    // Clear existing data
    await db.habitRecord.deleteMany({});
    await db.milestone.deleteMany({});
    await db.task.deleteMany({});
    await db.focusSession.deleteMany({});
    await db.calendarEvent.deleteMany({});
    await db.note.deleteMany({});
    await db.habit.deleteMany({});
    await db.goal.deleteMany({});
    await db.project.deleteMany({});
    await db.label.deleteMany({});
    await db.dashboardLayout.deleteMany({});
    await db.userSetting.deleteMany({});
    await db.user.deleteMany({});

    // --- User ---
    await db.user.create({
      data: { id: 'default', name: 'کاربر تست', email: 'test@lifeos.ir' },
    });

    // --- Labels ---
    const labelWork = await db.label.create({ data: { name: 'کار', color: '#3B82F6', userId: 'default' } });
    const labelPersonal = await db.label.create({ data: { name: 'شخصی', color: '#10B981', userId: 'default' } });
    const labelHealth = await db.label.create({ data: { name: 'سلامتی', color: '#EF4444', userId: 'default' } });
    const labelLearning = await db.label.create({ data: { name: 'یادگیری', color: '#F59E0B', userId: 'default' } });
    const labelShopping = await db.label.create({ data: { name: 'خرید', color: '#8B5CF6', userId: 'default' } });

    // --- Projects ---
    const projectWeb = await db.project.create({
      data: {
        title: 'طراحی وبسایت', description: 'طراحی و توسعه وبسایت شخصی جدید',
        color: '#3B82F6', icon: '🌐', status: 'active',
        startDate: dateStr(-5), endDate: dateStr(14), userId: 'default',
      },
    });
    const projectLanguage = await db.project.create({
      data: {
        title: 'یادگیری زبان', description: 'یادگیری زبان انگلیسی روزانه',
        color: '#10B981', icon: '📚', status: 'active',
        startDate: dateStr(-10), userId: 'default',
      },
    });
    const projectExercise = await db.project.create({
      data: {
        title: 'برنامه ورزشی', description: 'برنامه ورزشی هفتگی',
        color: '#EF4444', icon: '💪', status: 'active',
        startDate: dateStr(-7), userId: 'default',
      },
    });

    // --- Tasks (15) ---
    await db.task.createMany({
      data: [
        { id: 'task-1', title: 'طراحی صفحه اصلی وبسایت', description: 'طراحی UI/UX صفحه اصلی شامل هدر، فوتر و بخش‌های اصلی', status: 'in-progress', priority: 'high', dueDate: dateStr(1), order: 0, projectId: projectWeb.id, labelId: labelWork.id, userId: 'default' },
        { id: 'task-2', title: 'نوشتن محتوای صفحه درباره ما', description: 'تولید محتوای فارسی برای صفحه درباره ما', status: 'todo', priority: 'medium', dueDate: dateStr(3), order: 1, projectId: projectWeb.id, labelId: labelWork.id, userId: 'default' },
        { id: 'task-3', title: 'بهینه‌سازی سئو', description: 'بررسی و بهینه‌سازی سئوی صفحات', status: 'todo', priority: 'low', dueDate: dateStr(7), order: 2, projectId: projectWeb.id, labelId: labelWork.id, userId: 'default' },
        { id: 'task-4', title: 'تست ریسپانسیو', description: 'بررسی سازگاری با موبایل و تبلت', status: 'todo', priority: 'medium', dueDate: dateStr(5), order: 3, projectId: projectWeb.id, labelId: labelWork.id, userId: 'default' },
        { id: 'task-5', title: 'تمرین لغات جدید انگلیسی', description: 'یادگیری ۲۰ لغت جدید انگلیسی', status: 'done', priority: 'medium', dueDate: dateStr(-1), order: 0, projectId: projectLanguage.id, labelId: labelLearning.id, userId: 'default' },
        { id: 'task-6', title: 'دیدن ویدیوی آموزشی انگلیسی', description: 'تماشای ویدیو با زیرنویس انگلیسی', status: 'done', priority: 'low', dueDate: dateStr(-2), order: 1, projectId: projectLanguage.id, labelId: labelLearning.id, userId: 'default' },
        { id: 'task-7', title: 'خواندن فصل کتاب انگلیسی', description: 'خواندن فصل سوم کتاب Grammar in Use', status: 'in-progress', priority: 'medium', dueDate: dateStr(0), order: 2, projectId: projectLanguage.id, labelId: labelLearning.id, userId: 'default' },
        { id: 'task-8', title: 'تمرین ورزش صبحگاهی', description: '۳۰ دقیقه دویدن و حرکات کششی', status: 'done', priority: 'high', dueDate: dateStr(0), order: 0, projectId: projectExercise.id, labelId: labelHealth.id, userId: 'default' },
        { id: 'task-9', title: 'برنامه‌ریزی تمرین هفته آینده', description: 'تنظیم برنامه ورزشی هفته آینده', status: 'todo', priority: 'medium', dueDate: dateStr(2), order: 1, projectId: projectExercise.id, labelId: labelHealth.id, userId: 'default' },
        { id: 'task-10', title: 'خرید مواد غذایی', description: 'خرید میوه، سبزیجات و لبنیات', status: 'todo', priority: 'high', dueDate: dateStr(0), order: 3, labelId: labelShopping.id, userId: 'default' },
        { id: 'task-11', title: 'خرید هدیه تولد', description: 'خرید هدیه برای دوست', status: 'todo', priority: 'medium', dueDate: dateStr(3), order: 4, labelId: labelShopping.id, userId: 'default' },
        { id: 'task-12', title: 'پاسخ به ایمیل‌های کاری', description: 'پاسخگویی به ۵ ایمیل پاسخ‌داده‌نشده', status: 'in-progress', priority: 'high', dueDate: dateStr(0), order: 5, labelId: labelWork.id, userId: 'default' },
        { id: 'task-13', title: 'تمیز کردن اتاق کار', description: 'مرتب‌سازی و نظافت اتاق کار', status: 'todo', priority: 'low', dueDate: dateStr(7), order: 6, labelId: labelPersonal.id, userId: 'default' },
        { id: 'task-14', title: 'آماده‌سازی ارائه', description: 'ساخت پاورپوینت برای جلسه هفته آینده', status: 'todo', priority: 'high', dueDate: dateStr(2), order: 7, labelId: labelWork.id, userId: 'default' },
        { id: 'task-15', title: 'تمدید اشتراک نرم‌افزار', description: 'تمدید لایسنس IDE و ابزارهای توسعه', status: 'todo', priority: 'medium', dueDate: dateStr(-2), order: 8, labelId: labelWork.id, userId: 'default' },
      ],
    });

    // --- Goals ---
    await db.goal.create({
      data: {
        id: 'goal-1', title: 'توسعه مهارت‌های برنامه‌نویسی',
        description: 'یادگیری فریمورک‌های جدید و بهبود مهارت‌های فنی',
        category: 'work', progress: 35,
        startDate: dateStr(-30), endDate: dateStr(60), userId: 'default',
        milestones: {
          create: [
            { id: 'ms-1', title: 'تکمیل دوره Next.js', order: 0, isCompleted: true, userId: 'default' },
            { id: 'ms-2', title: 'ساخت ۳ پروژه تمرینی', order: 1, isCompleted: true, userId: 'default' },
            { id: 'ms-3', title: 'یادگیری TypeScript پیشرفته', order: 2, isCompleted: false, userId: 'default' },
            { id: 'ms-4', title: 'شرکت در یک پروژه متن‌باز', order: 3, isCompleted: false, userId: 'default' },
          ],
        },
      },
    });
    await db.goal.create({
      data: {
        id: 'goal-2', title: 'بهبود وضعیت سلامت',
        description: 'رسیدن به وزن ایده‌آل و بهبود فیتنس عمومی',
        category: 'health', progress: 50,
        startDate: dateStr(-20), endDate: dateStr(90), userId: 'default',
        milestones: {
          create: [
            { id: 'ms-5', title: 'کاهش ۲ کیلوگرم وزن', order: 0, isCompleted: true, userId: 'default' },
            { id: 'ms-6', title: 'دویدن ۵ کیلومتر بدون توقف', order: 1, isCompleted: false, userId: 'default' },
            { id: 'ms-7', title: 'عضویت در کلاس یوگا', order: 2, isCompleted: true, userId: 'default' },
          ],
        },
      },
    });
    await db.goal.create({
      data: {
        id: 'goal-3', title: 'خواندن ۱۲ کتاب در سال',
        description: 'خواندن ماهانه یک کتاب از لیست مطالعاتی',
        category: 'education', progress: 25,
        startDate: dateStr(-60), endDate: dateStr(180), userId: 'default',
        milestones: {
          create: [
            { id: 'ms-8', title: 'خواندن اتمی عادت‌ها', order: 0, isCompleted: true, userId: 'default' },
            { id: 'ms-9', title: 'خواندن قدرت عادت', order: 1, isCompleted: true, userId: 'default' },
            { id: 'ms-10', title: 'خواندن تفکر سریع و کند', order: 2, isCompleted: false, userId: 'default' },
            { id: 'ms-11', title: 'خواندن هنر شفاف اندیشیدن', order: 3, isCompleted: false, userId: 'default' },
            { id: 'ms-12', title: 'خواندن سواد مالی', order: 4, isCompleted: false, userId: 'default' },
          ],
        },
      },
    });

    // --- Habits ---
    const habitStudy = await db.habit.create({ data: { id: 'habit-1', title: 'مطالعه', description: 'حداقل ۳۰ دقیقه مطالعه روزانه', icon: '📖', color: '#3B82F6', frequency: 'daily', targetCount: 1, userId: 'default' } });
    const habitExercise = await db.habit.create({ data: { id: 'habit-2', title: 'ورزش', description: 'حداقل ۲۰ دقیقه ورزش روزانه', icon: '🏃', color: '#EF4444', frequency: 'daily', targetCount: 1, userId: 'default' } });
    const habitMeditation = await db.habit.create({ data: { id: 'habit-3', title: 'مدیتیشن', description: '۱۰ دقیقه مدیتیشن صبحگاهی', icon: '🧘', color: '#10B981', frequency: 'daily', targetCount: 1, userId: 'default' } });
    const habitWriting = await db.habit.create({ data: { id: 'habit-4', title: 'نوشتن روزانه', description: 'نوشتن خاطرات یا ایده‌های روزانه', icon: '✍️', color: '#F59E0B', frequency: 'daily', targetCount: 1, userId: 'default' } });

    // --- Habit Records (last 5 days) ---
    const habitRecords = [
      { habitId: habitStudy.id, date: dateStr(-4), count: 1, userId: 'default' },
      { habitId: habitExercise.id, date: dateStr(-4), count: 1, userId: 'default' },
      { habitId: habitMeditation.id, date: dateStr(-4), count: 1, userId: 'default' },
      { habitId: habitStudy.id, date: dateStr(-3), count: 1, userId: 'default' },
      { habitId: habitExercise.id, date: dateStr(-3), count: 1, userId: 'default' },
      { habitId: habitWriting.id, date: dateStr(-3), count: 1, userId: 'default' },
      { habitId: habitStudy.id, date: dateStr(-2), count: 1, userId: 'default' },
      { habitId: habitMeditation.id, date: dateStr(-2), count: 1, userId: 'default' },
      { habitId: habitWriting.id, date: dateStr(-2), count: 1, userId: 'default' },
      { habitId: habitStudy.id, date: dateStr(-1), count: 1, userId: 'default' },
      { habitId: habitExercise.id, date: dateStr(-1), count: 1, userId: 'default' },
      { habitId: habitMeditation.id, date: dateStr(-1), count: 1, userId: 'default' },
      { habitId: habitWriting.id, date: dateStr(-1), count: 1, userId: 'default' },
      { habitId: habitStudy.id, date: dateStr(0), count: 1, userId: 'default' },
      { habitId: habitExercise.id, date: dateStr(0), count: 1, userId: 'default' },
    ];
    for (const r of habitRecords) {
      await db.habitRecord.create({ data: r });
    }

    // --- Notes ---
    await db.note.createMany({
      data: [
        { id: 'note-1', title: 'ایده‌های پروژه جدید', content: '۱. ساخت اپلیکیشن مدیریت زمان\n۲. طراحی سیستم یادداشت‌برداری هوشمند\n۳. توسعه ربات تلگرام برای یادآوری وظایف', color: '#FEF3C7', isPinned: true, userId: 'default' },
        { id: 'note-2', title: 'نکات جلسه تیم', content: 'بررسی پیشرفت پروژه وبسایت\nتعیین مسئولیت‌های جدید\nجلسه بعدی: سه‌شنبه ساعت ۱۰ صبح', color: '#DBEAFE', isPinned: false, userId: 'default' },
        { id: 'note-3', title: 'لیست خرید هفته', content: '- شیر و ماست\n- میوه فصل\n- مرغ\n- برنج\n- روغن زیتون\n- سبزیجات تازه', color: '#D1FAE5', isPinned: false, userId: 'default' },
        { id: 'note-4', title: 'نقل‌قول‌های الهام‌بخش', content: '"تنها راه انجام کار بزرگ، عشق به کاری است که انجام می‌دهی."\n\n"موفقیت نتیجه تلاش مداوم است."', color: '#FCE7F3', isPinned: true, userId: 'default' },
        { id: 'note-5', title: 'برنامه سفر', content: 'مقصد: شیراز\nتاریخ: دو هفته آینده\nاقدامات:\n- رزرو هتل\n- خرید بلیط قطار\n- تهیه لیست مکان‌های دیدنی', color: '#EDE9FE', isPinned: false, userId: 'default' },
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
        data: { id: `fs-${i + 1}`, type: s.type, duration: s.duration, completedAt, userId: 'default' },
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
          id: `evt-${i + 1}`, title: e.title, description: e.description,
          date: dateStr(e.daysOffset), startTime: e.startTime, endTime: e.endTime,
          color: e.color, isAllDay: false, userId: 'default',
        },
      });
    }

    return NextResponse.json({ seeded: true, message: 'داده‌های آزمایشی با موفقیت ایجاد شد' });
  } catch (error) {
    console.error('Error seeding data:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد داده‌های آزمایشی', details: String(error) },
      { status: 500 }
    );
  }
}