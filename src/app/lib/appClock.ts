import { format, parseISO, startOfDay, subDays } from "date-fns";

const ROLLOVER_HOUR = 6;

/** 展示用「今日」固定為 2026-07-15（與Demo／簡報日期對齊） */
export const APP_DEMO_TODAY = "2026-07-15";

export function getAppNow(_reference = new Date()): Date {
  const d = parseISO(`${APP_DEMO_TODAY}T12:00:00`);
  return d;
}

export function getAppBusinessDate(reference = new Date()): Date {
  const now = getAppNow(reference);
  if (now.getHours() < ROLLOVER_HOUR) {
    return startOfDay(subDays(now, 1));
  }
  return startOfDay(now);
}

export function getAppBusinessDateStr(reference = new Date()): string {
  return format(getAppBusinessDate(reference), "yyyy-MM-dd");
}

export function isAppToday(date: string, reference = new Date()): boolean {
  return date === getAppBusinessDateStr(reference);
}
