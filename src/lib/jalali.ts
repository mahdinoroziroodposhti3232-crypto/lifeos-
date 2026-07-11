import * as jalaali from 'jalaali-js';

export interface JalaaliDate {
  jy: number;
  jm: number;
  jd: number;
}

export function toJalaali(date: Date): JalaaliDate {
  const gYear = date.getFullYear();
  const gMonth = date.getMonth() + 1;
  const gDay = date.getDate();
  return jalaali.toJalaali(gYear, gMonth, gDay);
}

export function toGregorian(jy: number, jm: number, jd: number): Date {
  const { gy, gm, gd } = jalaali.toGregorian(jy, jm, jd);
  return new Date(gy, gm - 1, gd);
}

export function formatJalaaliDate(date: Date): string {
  const { jy, jm, jd } = toJalaali(date);
  const months = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
  return `${jd} ${months[jm - 1]} ${jy}`;
}

export function formatJalaaliDateShort(date: Date): string {
  const { jy, jm, jd } = toJalaali(date);
  return `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
}

export function getJalaaliMonthName(month: number): string {
  const months = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
  return months[month - 1];
}

export function getJalaaliWeekDay(date: Date): number {
  // 0 = Saturday, 1 = Sunday, ..., 6 = Friday (Persian week)
  const day = date.getDay(); // 0 = Sunday in JS
  return (day + 1) % 7;
}

export function isTodayJalaali(jy: number, jm: number, jd: number): boolean {
  const today = toJalaali(new Date());
  return today.jy === jy && today.jm === jm && today.jd === jd;
}

export function getDaysInJalaaliMonth(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  // Esfand - check leap year
  return jalaali.isLeapJalaaliYear(jy) ? 30 : 29;
}

export function getFirstDayOfJalaaliMonth(jy: number, jm: number): number {
  const firstDayGregorian = toGregorian(jy, jm, 1);
  return getJalaaliWeekDay(firstDayGregorian);
}

export function getJalaaliMonthDays(jy: number, jm: number): Array<{ day: number; isCurrentMonth: boolean; date: Date; isToday: boolean }> {
  const daysInMonth = getDaysInJalaaliMonth(jy, jm);
  const firstDay = getFirstDayOfJalaaliMonth(jy, jm);
  const today = toJalaali(new Date());
  const days: Array<{ day: number; isCurrentMonth: boolean; date: Date; isToday: boolean }> = [];

  // Previous month days
  const prevMonth = jm === 1 ? 12 : jm - 1;
  const prevYear = jm === 1 ? jy - 1 : jy;
  const daysInPrevMonth = getDaysInJalaaliMonth(prevYear, prevMonth);

  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const date = toGregorian(prevYear, prevMonth, day);
    days.push({ day, isCurrentMonth: false, date, isToday: false });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = toGregorian(jy, jm, day);
    const isToday = today.jy === jy && today.jm === jm && today.jd === day;
    days.push({ day, isCurrentMonth: true, date, isToday });
  }

  // Next month days
  const remainingDays = 42 - days.length;
  const nextMonth = jm === 12 ? 1 : jm + 1;
  const nextYear = jm === 12 ? jy + 1 : jy;
  for (let day = 1; day <= remainingDays; day++) {
    const date = toGregorian(nextYear, nextMonth, day);
    days.push({ day, isCurrentMonth: false, date, isToday: false });
  }

  return days;
}

export function getJalaaliWeekDaysHeader(): string[] {
  return ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
}