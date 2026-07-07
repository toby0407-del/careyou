import { format, startOfDay, subDays } from "date-fns";

const ROLLOVER_HOUR = 6;

export function getAppNow(reference = new Date()): Date {
  return reference;
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
