import { formatAppointmentLong, getNextAppointment } from "./patientAppointments";
import { DEFAULT_PATIENT_ID } from "./patientProfiles";
import { getTodaySummary } from "./progressStore";

export type NotificationVariant = "doctor" | "patient" | "family";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  unread?: boolean;
  type?: "info" | "alert" | "success";
}

function buildFamilyTodayBody(): string {
  const summary = getTodaySummary();
  if (summary.completed === 0) {
    return "王大明今日尚未開始訓練，可適時鼓勵。";
  }
  if (summary.progressPct >= 100) {
    return `王大明今日全數完成（${summary.completed}/${summary.total} 項），表現優異！`;
  }
  return `王大明今日完成 ${summary.progressPct}%（${summary.completed}/${summary.total} 項），可適時鼓勵。`;
}

function buildPatientTodayBody(): string {
  const summary = getTodaySummary();
  if (summary.remaining === 0) {
    return "今日復健項目已全部完成，好好休息！";
  }
  return `尚有 ${summary.remaining} 項動作未完成，建議今日完成剩餘訓練。`;
}

export function getNotificationsByVariant(variant: NotificationVariant): AppNotification[] {
  const nextAppointment = getNextAppointment(DEFAULT_PATIENT_ID);
  const nextAppointmentSummary = nextAppointment
    ? formatAppointmentLong(nextAppointment.datetime).replace("年 ", "/").replace("月 ", "/").replace("日 ", " ")
    : "近期";

  const byVariant: Record<NotificationVariant, AppNotification[]> = {
    doctor: [
      {
        id: "d1",
        title: "張文彬依從率下降",
        body: "近 3 天訓練完成率低於 50%，建議主動關懷。",
        time: "10 分鐘前",
        unread: true,
        type: "alert",
      },
      {
        id: "d2",
        title: "黃志宏未訓練提醒",
        body: "已 2 天未上線訓練，踝關節復健進度可能延後。",
        time: "1 小時前",
        unread: true,
        type: "alert",
      },
      {
        id: "d3",
        title: "王大明回診提醒",
        body: "明日 14:00 門診，請確認處方是否需調整。",
        time: "今日 09:00",
        unread: true,
        type: "info",
      },
      {
        id: "d4",
        title: "陳美玲訓練達標",
        body: "本週依從率 95%，動作品質維持優良。",
        time: "昨日",
        type: "success",
      },
    ],
    patient: [
      {
        id: "p1",
        title: "今日復健提醒",
        body: buildPatientTodayBody(),
        time: "30 分鐘前",
        unread: true,
        type: "info",
      },
      {
        id: "p2",
        title: "下一關已解鎖",
        body: "踝關節旋轉可以開始挑戰了，記得先暖身！",
        time: "今日 08:00",
        unread: true,
        type: "success",
      },
      {
        id: "p3",
        title: "連續訓練 12 天",
        body: "太棒了！保持節奏有助於關節恢復。",
        time: "昨日",
        type: "success",
      },
    ],
    family: [
      {
        id: "f1",
        title: "今日訓練進度",
        body: buildFamilyTodayBody(),
        time: "1 小時前",
        unread: true,
        type: "info",
      },
      {
        id: "f2",
        title: "疼痛指數改善",
        body: "本週疼痛指數由 4 降至 2，恢復趨勢良好。",
        time: "今日 09:30",
        unread: true,
        type: "success",
      },
      {
        id: "f3",
        title: "回診提醒",
        body: `${nextAppointmentSummary} 回診，請提前安排交通。`,
        time: "昨日",
        type: "info",
      },
    ],
  };

  return byVariant[variant];
}
