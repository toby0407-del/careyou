import { format, parseISO } from "date-fns";
import { zhTW } from "date-fns/locale";
import { getAppNow } from "../lib/appClock";
import { shiftIsoDateTime } from "../lib/mockTime";

export interface PatientAppointment {
  id: string;
  patientId: string;
  department: string;
  physician: string;
  /** ISO 8601，含日期與時間 */
  datetime: string;
  location: string;
  clinicNumber?: string;
  purpose?: string;
  estimatedVisitTime?: string;
  note?: string;
}

/**
 * 相對示範日 APP_DEMO_TODAY（2026-07-15）排未來回診，
 * 避免「今日」釘死後回診全被當成已過期而顯示空白。
 */
const appointments: PatientAppointment[] = [
  {
    id: "a1",
    patientId: "p1",
    department: "骨科復健科",
    physician: "陳建宏 醫師",
    datetime: shiftIsoDateTime("2026-07-18T14:00:00"),
    location: "復健大樓 3F 305 診",
    clinicNumber: "305 診",
    purpose: "膝關節功能評估與復健處方調整",
    estimatedVisitTime: "14:20 - 14:40",
    note: "膝關節功能評估、調整復健處方",
  },
  {
    id: "a2",
    patientId: "p1",
    department: "新陳代謝科",
    physician: "王怡君 醫師",
    datetime: shiftIsoDateTime("2026-07-22T10:30:00"),
    location: "門診大樓 2F 218 診",
    clinicNumber: "218 診",
    purpose: "術後血糖與體重追蹤",
    estimatedVisitTime: "10:30 - 10:50",
    note: "術後血糖與體重追蹤",
  },
  {
    id: "a3",
    patientId: "p1",
    department: "心臟內科",
    physician: "林志遠 醫師",
    datetime: shiftIsoDateTime("2026-07-29T15:00:00"),
    location: "門診大樓 4F 412 診",
    clinicNumber: "412 診",
    purpose: "術前術後心血管風險追蹤",
    estimatedVisitTime: "15:10 - 15:30",
    note: "術前術後心血管風險追蹤",
  },
  {
    id: "a4",
    patientId: "p2",
    department: "復健醫學科",
    physician: "林雅婷 醫師",
    datetime: shiftIsoDateTime("2026-07-20T10:30:00"),
    location: "復健大樓 2F 201 診",
    clinicNumber: "201 診",
    purpose: "術後步態與肌力評估",
    estimatedVisitTime: "10:30 - 10:45",
  },
  {
    id: "a5",
    patientId: "p3",
    department: "神經復健科",
    physician: "陳建宏 醫師",
    datetime: shiftIsoDateTime("2026-07-19T09:00:00"),
    location: "復健大樓 4F 402 診",
    clinicNumber: "402 診",
    purpose: "神經復健進度追蹤",
    estimatedVisitTime: "09:10 - 09:30",
  },
];

export function getAppointmentsForPatient(patientId: string): PatientAppointment[] {
  return appointments
    .filter((a) => a.patientId === patientId)
    .sort((a, b) => a.datetime.localeCompare(b.datetime));
}

/** 尚未過期的回診（依示範日「現在」） */
export function getUpcomingAppointments(
  patientId: string,
  referenceDate = getAppNow()
): PatientAppointment[] {
  return getAppointmentsForPatient(patientId).filter(
    (a) => parseISO(a.datetime) >= referenceDate
  );
}

/** 取得最近一筆尚未過期的回診；若皆已過期則回傳排序後最後一筆 */
export function getNextAppointment(
  patientId: string,
  referenceDate = getAppNow()
): PatientAppointment | undefined {
  const list = getAppointmentsForPatient(patientId);
  if (list.length === 0) return undefined;

  const upcoming = list.filter((a) => parseISO(a.datetime) >= referenceDate);
  return upcoming[0] ?? list[list.length - 1];
}

export function formatAppointmentShort(datetime: string): string {
  const d = parseISO(datetime);
  return format(d, "M/d（EEEEE）HH:mm", { locale: zhTW });
}

export function formatAppointmentLong(datetime: string): string {
  const d = parseISO(datetime);
  return format(d, "yyyy年 M月 d日 EEEE HH:mm", { locale: zhTW });
}
