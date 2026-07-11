import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Clear existing data first (to allow re-seeding)
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
    await db.user.deleteMany({});

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const fourDaysAgo = new Date(today);
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
    const fiveDaysAgo = new Date(today);
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const inThreeDays = new Date(today);
    inThreeDays.setDate(inThreeDays.getDate() + 3);
    const inOneWeek = new Date(today);
    inOneWeek.setDate(inOneWeek.getDate() + 7);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 3);

    const inTwoDays = new Date(today);
    inTwoDays.setDate(inTwoDays.getDate() + 2);

    // --- User ---
    await db.user.create({
      data: {
        id: 'default',
        name: 'کاربر تست',
        email: 'test@lifeos.ir',
      },
    });

    // --- Labels ---
    const labelWork = await db.label.create({
      data: { name: 'کار', color: '#3B82F6', userId: 'default' },
    });
    const labelPersonal = await db.label.create({
      data: { name: 'شخصی', color: '#10B981', userId: 'default' },
    });
    const labelHealth = await db.label.create({
      data: { name: 'سلامتی', color: '#EF4444', userId: 'default' },
    });
    const labelLearning = await db.label.create({
      data: { name: 'یادگیری', color: '#F59E0B', userId: 'default' },
    });
    const labelShopping = await db.label.create({
      data: { name: 'خرید', color: '#8B5CF6', userId: 'default' },
    });

    // --- Projects ---
    const projectWeb = await db.project.create({
      data: {
        title: 'طراحی وبسایت',
        description: 'طراحی و توسعه وبسایت شخصی جدید',
        color: '#3B82F6',
        icon: '🌐',
        status: 'active',
        startDate: twoDaysAgo,
        endDate: inOneWeek,
        userId: 'default',
      },
    });
    const projectLanguage = await db.project.create({
      data: {
        title: 'یادگیری زبان',
        description: 'یادگیری زبان انگلیسی روزانه',
        color: '#10B981',
        icon: '📚',
        status: 'active',
        startDate: fiveDaysAgo,
        userId: 'default',
      },
    });
    const projectExercise = await db.project.create({
      data: {
        title: 'برنامه ورزشی',
        description: 'برنامه ورزشی هفتگی',
        color: '#EF4444',
        icon: '💪',
        status: 'active',
        startDate: threeDaysAgo,
        userId: 'default',
      },
    });

    // --- Tasks (15) ---
    await db.task.createMany({
      data: [
        {
          id: 'task-1',
          title: 'طراحی صفحه اصلی وبسایت',
          description: 'طراحی UI/UX صفحه اصلی شامل هدر، فوتر و بخش‌های اصلی',
          status: 'in_progress',
          priority: 'high',
          dueDate: tomorrow,
          order: 0,
          projectId: projectWeb.id,
          labelId: labelWork.id,
          userId: 'default',
        },
        {
          id: 'task-2',
          title: 'نوشتن محتوای صفحه درباره ما',
          description: 'تولید محتوای فارسی برای صفحه درباره ما',
          status: 'todo',
          priority: 'medium',
          dueDate: inThreeDays,
          order: 1,
          projectId: projectWeb.id,
          labelId: labelWork.id,
          userId: 'default',
        },
        {
          id: 'task-3',
          title: 'بهینه‌سازی سئو',
          description: 'بررسی و بهینه‌سازی سئوی صفحات',
          status: 'todo',
          priority: 'low',
          dueDate: inOneWeek,
          order: 2,
          projectId: projectWeb.id,
          labelId: labelWork.id,
          userId: 'default',
        },
        {
          id: 'task-4',
          title: 'تمرین لغات جدید انگلیسی',
          description: 'یادگیری ۲۰ لغت جدید انگلیسی',
          status: 'done',
          priority: 'medium',
          dueDate: yesterday,
          completedAt: yesterday,
          order: 0,
          projectId: projectLanguage.id,
          labelId: labelLearning.id,
          userId: 'default',
        },
        {
          id: 'task-5',
          title: 'دیدن یک ویدیوی آموزشی انگلیسی',
          description: 'تماشای ویدیو با زیرنویس انگلیسی',
          status: 'done',
          priority: 'low',
          dueDate: twoDaysAgo,
          completedAt: twoDaysAgo,
          order: 1,
          projectId: projectLanguage.id,
          labelId: labelLearning.id,
          userId: 'default',
        },
        {
          id: 'task-6',
          title: 'خواندن یک فصل کتاب انگلیسی',
          description: 'خواندن فصل سوم کتاب Grammar in Use',
          status: 'in_progress',
          priority: 'medium',
          dueDate: today,
          order: 2,
          projectId: projectLanguage.id,
          labelId: labelLearning.id,
          userId: 'default',
        },
        {
          id: 'task-7',
          title: 'تمرین ورزش صبحگاهی',
          description: '۳۰ دقیقه دویدن و حرکات کششی',
          status: 'done',
          priority: 'high',
          dueDate: today,
          completedAt: today,
          order: 0,
          projectId: projectExercise.id,
          labelId: labelHealth.id,
          userId: 'default',
        },
        {
          id: 'task-8',
          title: 'برنامه‌ریزی تمرین هفته آینده',
          description: 'تنظیم برنامه ورزشی هفته آینده',
          status: 'todo',
          priority: 'medium',
          dueDate: inTwoDays,
          order: 1,
          projectId: projectExercise.id,
          labelId: labelHealth.id,
          userId: 'default',
        },
        {
          id: 'task-9',
          title: 'خرید مواد غذایی',
          description: 'خرید میوه، سبزیجات و لبنیات از سوپرمارکت',
          status: 'todo',
          priority: 'high',
          dueDate: today,
          order: 3,
          labelId: labelShopping.id,
          userId: 'default',
        },
        {
          id: 'task-10',
          title: 'خرید هدیه تولد',
          description: 'خرید هدیه برای دوست',
          status: 'todo',
          priority: 'medium',
          dueDate: inThreeDays,
          order: 4,
          labelId: labelShopping.id,
          userId: 'default',
        },
        {
          id: 'task-11',
          title: 'مراجعه به پزشک',
          description: 'نوبت چکاپ دوره‌ای',
          status: 'overdue',
          priority: 'high',
          dueDate: yesterday,
          order: 5,
          labelId: labelHealth.id,
          userId: 'default',
        },
        {
          id: 'task-12',
          title: 'پاسخ به ایمیل‌های کاری',
          description: 'پاسخگویی به ۵ ایمیل پاسخ‌داده‌نشده',
          status: 'in_progress',
          priority: 'high',
          dueDate: today,
          order: 6,
          labelId: labelWork.id,
          userId: 'default',
        },
        {
          id: 'task-13',
          title: 'تمیز کردن اتاق',
          description: 'مرتب‌سازی و نظافت اتاق کار',
          status: 'todo',
          priority: 'low',
          dueDate: inOneWeek,
          order: 7,
          labelId: labelPersonal.id,
          userId: 'default',
        },
        {
          id: 'task-14',
          title: 'آماده‌سازی ارائه',
          description: 'ساخت پاورپوینت برای جلسه هفته آینده',
          status: 'todo',
          priority: 'high',
          dueDate: inTwoDays,
          order: 8,
          labelId: labelWork.id,
          userId: 'default',
        },
        {
          id: 'task-15',
          title: 'تمدید اشتراک نرم‌افزار',
          description: 'تمدید لایسنس IDE و ابزارهای توسعه',
          status: 'overdue',
          priority: 'medium',
          dueDate: twoDaysAgo,
          order: 9,
          labelId: labelWork.id,
          userId: 'default',
        },
      ],
    });

    // --- Goals (3) with milestones ---
    await db.goal.create({
      data: {
        id: 'goal-1',
        title: 'توسعه مهارت‌های برنامه‌نویسی',
        description: 'یادگیری فریمورک‌های جدید و بهبود مهارت‌های فنی',
        status: 'in_progress',
        category: 'حرفه‌ای',
        startDate: fiveDaysAgo,
        targetDate: inOneWeek,
        progress: 35,
        userId: 'default',
        milestones: {
          create: [
            { title: 'تکمیل دوره Next.js', order: 0, isCompleted: true },
            { title: 'ساخت ۳ پروژه تمرینی', order: 1, isCompleted: true },
            { title: 'یادگیری TypeScript', order: 2, isCompleted: false },
            { title: 'شرکت در یک پروژه متن‌باز', order: 3, isCompleted: false },
          ],
        },
      },
    });

    await db.goal.create({
      data: {
        id: 'goal-2',
        title: 'بهبود وضعیت سلامت',
        description: 'رسیدن به وزن ایده‌آل و بهبود فیتنس عمومی',
        status: 'in_progress',
        category: 'شخصی',
        startDate: threeDaysAgo,
        targetDate: inOneWeek,
        progress: 50,
        userId: 'default',
        milestones: {
          create: [
            { title: 'کاهش ۲ کیلوگرم وزن', order: 0, isCompleted: true },
            { title: 'دویدن ۵ کیلومتر بدون توقف', order: 1, isCompleted: false },
            { title: 'عضویت در کلاس یوگا', order: 2, isCompleted: true },
          ],
        },
      },
    });

    await db.goal.create({
      data: {
        id: 'goal-3',
        title: 'خواندن ۱۲ کتاب در سال',
        description: 'خواندن ماهانه یک کتاب از لیست مطالعاتی',
        status: 'in_progress',
        category: 'یادگیری',
        startDate: fiveDaysAgo,
        targetDate: inOneWeek,
        progress: 25,
        userId: 'default',
        milestones: {
          create: [
            { title: 'خواندن کتاب اتمی عادت‌ها', order: 0, isCompleted: true },
            { title: 'خواندن کتاب قدرت عادت', order: 1, isCompleted: true },
            { title: 'خواندن کتاب تفکر سریع و کند', order: 2, isCompleted: false },
            { title: 'خواندن کتاب هنر شفاف اندیشیدن', order: 3, isCompleted: false },
            { title: 'خواندن کتاب سواد مالی', order: 4, isCompleted: false },
          ],
        },
      },
    });

    // --- Habits (4) ---
    const habitStudy = await db.habit.create({
      data: {
        id: 'habit-1',
        title: 'مطالعه',
        description: 'حداقل ۳۰ دقیقه مطالعه روزانه',
        icon: '📖',
        color: '#3B82F6',
        frequency: 'daily',
        targetCount: 1,
        userId: 'default',
      },
    });
    const habitExercise = await db.habit.create({
      data: {
        id: 'habit-2',
        title: 'ورزش',
        description: 'حداقل ۲۰ دقیقه ورزش روزانه',
        icon: '🏃',
        color: '#EF4444',
        frequency: 'daily',
        targetCount: 1,
        userId: 'default',
      },
    });
    const habitMeditation = await db.habit.create({
      data: {
        id: 'habit-3',
        title: 'مدیتیشن',
        description: '۱۰ دقیقه مدیتیشن صبحگاهی',
        icon: '🧘',
        color: '#10B981',
        frequency: 'daily',
        targetCount: 1,
        userId: 'default',
      },
    });
    const habitWriting = await db.habit.create({
      data: {
        id: 'habit-4',
        title: 'نوشتن روزانه',
        description: 'نوشتن خاطرات یا ایده‌های روزانه',
        icon: '✍️',
        color: '#F59E0B',
        frequency: 'daily',
        targetCount: 1,
        userId: 'default',
      },
    });

    // --- Habit Records (5 days x multiple habits) ---
    await db.habitRecord.createMany({
      data: [
        { id: 'hr-1', habitId: habitStudy.id, date: fourDaysAgo, value: true },
        { id: 'hr-2', habitId: habitExercise.id, date: fourDaysAgo, value: true },
        { id: 'hr-3', habitId: habitMeditation.id, date: fourDaysAgo, value: true },
        { id: 'hr-4', habitId: habitStudy.id, date: threeDaysAgo, value: true },
        { id: 'hr-5', habitId: habitExercise.id, date: threeDaysAgo, value: true },
        { id: 'hr-6', habitId: habitWriting.id, date: threeDaysAgo, value: true },
        { id: 'hr-7', habitId: habitStudy.id, date: twoDaysAgo, value: true },
        { id: 'hr-8', habitId: habitMeditation.id, date: twoDaysAgo, value: true },
        { id: 'hr-9', habitId: habitWriting.id, date: twoDaysAgo, value: true },
        { id: 'hr-10', habitId: habitStudy.id, date: yesterday, value: true },
        { id: 'hr-11', habitId: habitExercise.id, date: yesterday, value: true },
        { id: 'hr-12', habitId: habitMeditation.id, date: yesterday, value: true },
        { id: 'hr-13', habitId: habitWriting.id, date: yesterday, value: true },
        { id: 'hr-14', habitId: habitStudy.id, date: today, value: true },
        { id: 'hr-15', habitId: habitExercise.id, date: today, value: true },
      ],
    });

    // --- Notes (5) ---
    await db.note.createMany({
      data: [
        {
          id: 'note-1',
          title: 'ایده‌های پروژه جدید',
          content: '۱. ساخت اپلیکیشن مدیریت زمان\n۲. طراحی سیستم یادداشت‌برداری هوشمند\n۳. توسعه ربات تلگرام برای یادآوری وظایف',
          color: '#FEF3C7',
          isPinned: true,
          userId: 'default',
        },
        {
          id: 'note-2',
          title: 'نکات جلسه تیم',
          content: 'بررسی پیشرفت پروژه وبسایت\nتعیین مسئولیت‌های جدید\nجلسه بعدی: سه‌شنبه ساعت ۱۰ صبح',
          color: '#DBEAFE',
          isPinned: false,
          userId: 'default',
        },
        {
          id: 'note-3',
          title: 'لیست خرید هفته',
          content: '- شیر و ماست\n- میوه فصل\n- مرغ\n- برنج\n- روغن زیتون\n- سبزیجات تازه',
          color: '#D1FAE5',
          isPinned: false,
          userId: 'default',
        },
        {
          id: 'note-4',
          title: 'نقل‌قول‌های الهام‌بخش',
          content: '"تنها راه انجام کار بزرگ، عشق به کاری است که انجام می‌دهی." - استیو جابز\n\n"موفقیت نتیجه تلاش مداوم است."',
          color: '#FCE7F3',
          isPinned: true,
          userId: 'default',
        },
        {
          id: 'note-5',
          title: 'برنامه سفر',
          content: 'مقصد: شیراز\nتاریخ: دو هفته آینده\nاقدامات:\n- رزرو هتل\n- خرید بلیط قطار\n- تهیه لیست مکان‌های دیدنی',
          color: '#EDE9FE',
          isPinned: false,
          userId: 'default',
        },
      ],
    });

    // --- Focus Sessions (10 for the past week) ---
    const sessions = [
      { id: 'fs-1', title: 'کدنویسی وبسایت', minutes: 45, daysAgo: 6, hour: 9 },
      { id: 'fs-2', title: 'مطالعه کتاب انگلیسی', minutes: 30, daysAgo: 5, hour: 8 },
      { id: 'fs-3', title: 'توسعه فرانت‌اند', minutes: 60, daysAgo: 5, hour: 14 },
      { id: 'fs-4', title: 'نوشتن مقاله', minutes: 25, daysAgo: 4, hour: 10 },
      { id: 'fs-5', title: 'برنامه‌نویسی بک‌اند', minutes: 50, daysAgo: 3, hour: 11 },
      { id: 'fs-6', title: 'مطالعه مستندات', minutes: 35, daysAgo: 2, hour: 9 },
      { id: 'fs-7', title: 'دیباگ پروژه', minutes: 40, daysAgo: 2, hour: 15 },
      { id: 'fs-8', title: 'طراحی رابط کاربری', minutes: 55, daysAgo: 1, hour: 10 },
      { id: 'fs-9', title: 'کدنویسی API', minutes: 45, daysAgo: 1, hour: 14 },
      { id: 'fs-10', title: 'بازبینی کد', minutes: 30, daysAgo: 0, hour: 9 },
    ];

    for (const s of sessions) {
      const sessionDate = new Date(today);
      sessionDate.setDate(sessionDate.getDate() - s.daysAgo);
      sessionDate.setHours(s.hour, 0, 0, 0);
      const endTime = new Date(sessionDate);
      endTime.setMinutes(endTime.getMinutes() + s.minutes);

      await db.focusSession.create({
        data: {
          id: s.id,
          title: s.title,
          startTime: sessionDate,
          endTime: endTime,
          durationMinutes: s.minutes,
          userId: 'default',
        },
      });
    }

    // --- Calendar Events (5 for this week) ---
    const events = [
      {
        id: 'evt-1',
        title: 'جلسه تیم طراحی',
        description: 'بررسی وایرفریم‌های جدید',
        daysOffset: 0,
        hour: 10,
        duration: 60,
        color: '#3B82F6',
      },
      {
        id: 'evt-2',
        title: 'کلاس زبان انگلیسی',
        description: 'جلسه هفتگی کلاس زبان',
        daysOffset: 1,
        hour: 17,
        duration: 90,
        color: '#10B981',
      },
      {
        id: 'evt-3',
        title: 'تمرین ورزشی گروهی',
        description: 'فوتبال در باشگاه ورزشی',
        daysOffset: 2,
        hour: 18,
        duration: 120,
        color: '#EF4444',
      },
      {
        id: 'evt-4',
        title: 'ملاقات با مشتری',
        description: 'ارائه پیشنهاد پروژه',
        daysOffset: 3,
        hour: 11,
        duration: 45,
        color: '#F59E0B',
      },
      {
        id: 'evt-5',
        title: 'جلسه بررسی پروژه',
        description: 'بررسی پیشرفت پروژه وبسایت',
        daysOffset: 5,
        hour: 14,
        duration: 60,
        color: '#8B5CF6',
      },
    ];

    for (const e of events) {
      const eventDate = new Date(today);
      eventDate.setDate(eventDate.getDate() + e.daysOffset);
      eventDate.setHours(e.hour, 0, 0, 0);
      const endEventDate = new Date(eventDate);
      endEventDate.setMinutes(endEventDate.getMinutes() + e.duration);

      await db.calendarEvent.create({
        data: {
          id: e.id,
          title: e.title,
          description: e.description,
          startTime: eventDate,
          endTime: endEventDate,
          allDay: false,
          color: e.color,
          userId: 'default',
        },
      });
    }

    return NextResponse.json({
      seeded: true,
      message: 'داده‌های آزمایشی با موفقیت ایجاد شد',
    });
  } catch (error) {
    console.error('Error seeding data:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد داده‌های آزمایشی', details: String(error) },
      { status: 500 }
    );
  }
}