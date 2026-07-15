import { addDays, addMilliseconds, differenceInCalendarDays, format, parseISO, startOfDay } from "date-fns";
import { zhTW } from "date-fns/locale";
import { getAppBusinessDate } from "./appClock";

const DEFAULT_ANCHOR_DATE = "2026-07-15";

export function shiftIsoDate(date: string, anchorDate = DEFAULT_ANCHOR_DATE): string {
  const anchor = startOfDay(parseISO(anchorDate));
  const source = parseISO(date);
  const deltaDays = differenceInCalendarDays(source, anchor);
  return format(addDays(getAppBusinessDate(), deltaDays), "yyyy-MM-dd");
}

export function shiftIsoDateTime(datetime: string, anchorDate = DEFAULT_ANCHOR_DATE): string {
  const anchor = startOfDay(parseISO(anchorDate));
  const source = parseISO(datetime);
  const deltaMs = source.getTime() - anchor.getTime();
  return addMilliseconds(getAppBusinessDate(), deltaMs).toISOString();
}

export function formatShiftedMonthDayTime(datetime: string, anchorDate = DEFAULT_ANCHOR_DATE): string {
  return format(parseISO(shiftIsoDateTime(datetime, anchorDate)), "M/d a h:mm", { locale: zhTW });
}

export function formatShiftedMonthDay(datetime: string, anchorDate = DEFAULT_ANCHOR_DATE): string {
  return format(parseISO(shiftIsoDateTime(datetime, anchorDate)), "M/d", { locale: zhTW });
}
