export type NotificationVariant = "doctor" | "patient" | "family";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  unread?: boolean;
  type?: "info" | "alert" | "success";
}

export const NOTIFICATIONS_BY_VARIANT: Record<NotificationVariant, AppNotification[]> = {
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
      body: "尚有 4 項動作未完成，建議下午完成膝關節訓練。",
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
      body: "王大明今日完成 33%，較平日略低，可適時鼓勵。",
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
      body: "7/5（五）14:00 複診，請提前安排交通。",
      time: "昨日",
      type: "info",
    },
  ],
};
