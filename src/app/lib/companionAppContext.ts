/**
 * 小伴可查詢的 App 即時資料快照（給本機 LLM 當上下文）
 */
import { ISLANDS } from "../data/islandArt";
import { getLiveMilestones } from "../data/milestones";
import { getNextAppointment, formatAppointmentLong } from "../data/patientAppointments";
import { categories } from "../data/patientExercises";
import {
  getLiveExercises,
  getStreakDays,
  getTodaySummary,
  getLifetimeCompletedLevelCount,
} from "../data/progressStore";
import { getLevelStatus } from "../data/patientExercises";
import { getUnreadEncouragements } from "../data/encouragements";

export function buildAppKnowledgeContext(patientName: string): string {
  const summary = getTodaySummary();
  const streak = getStreakDays();
  const exercises = getLiveExercises();
  const completedLevels = getLifetimeCompletedLevelCount();
  const appt = getNextAppointment("p1");
  const unread = getUnreadEncouragements();
  const milestones = getLiveMilestones();
  const unlockedMs = milestones.filter((m) => m.unlocked);
  const nearMs = milestones
    .filter((m) => !m.unlocked && m.current / m.target >= 0.5)
    .slice(0, 4);

  const levelLines = exercises.map((ex, i) => {
    const island = ISLANDS[i % ISLANDS.length];
    const status = getLevelStatus(ex, i, exercises);
    const statusLabel =
      status === "completed" ? "已通關" : status === "active" ? "可挑戰" : "未解鎖";
    return `· ${island.name}｜第 ${ex.level} 關 ${ex.name}（${statusLabel}，${ex.setsReps}，約 ${ex.duration}）`;
  });

  const categoryLines = categories.map((cat) => {
    const ids = new Set(cat.exercises.map((e) => e.id));
    const done = exercises.filter((e) => ids.has(e.id) && e.completed).length;
    return `· ${cat.label}：${done}/${cat.exercises.length}`;
  });

  const sections = [
    "【App 即時資料｜請優先依此回答，不要編造】",
    `患者：${patientName}`,
    `今日完成：${summary.completed}/${summary.total} 項（${summary.progressPct}%）`,
    `連續訓練：${streak} 天`,
    `累計通關關卡：${completedLevels} 關`,
    summary.avgQualityToday != null
      ? `今日平均動作品質：${summary.avgQualityToday} 分`
      : "今日尚無動作品質資料",
    summary.nextExercise
      ? `下一項訓練：${summary.nextExercise.name}（約剩 ${summary.remaining} 項、${summary.estimatedMinutes} 分鐘）`
      : "今日訓練已全部完成",
    appt
      ? `下次回診：${formatAppointmentLong(appt.datetime)}，${appt.department}`
      : "目前無排定回診",
    unread[0]
      ? `家人打氣未讀：${unread[0].from}「${unread[0].message}」`
      : "目前沒有未讀家人打氣",
    "",
    "【浮島與關卡】",
    ...levelLines,
    "",
    "【訓練分類進度】",
    ...categoryLines,
    "",
    "【里程碑】",
    `已解鎖 ${unlockedMs.length}/${milestones.length} 個`,
    unlockedMs.length
      ? `近期解鎖：${unlockedMs
          .slice(-4)
          .map((m) => m.title)
          .join("、")}`
      : "",
    nearMs.length
      ? `接近完成：${nearMs
          .map((m) => `${m.title}（${m.current}/${m.target}${m.unit}）`)
          .join("、")}`
      : "",
    "",
    "【App 功能導覽】",
    "· 地圖／任務：3D 浮島選關，完成上一關才解鎖下一島",
    "· 結果：查看訓練統計與日曆",
    "· 里程碑：島嶼風格成就（航程堅持、島嶼征途等）",
    "· 時光迴廊：完成關卡解鎖回憶照片",
    "· 小伴：本機 AI，可查進度、聊日常、給鼓勵",
  ];

  return sections.filter((line) => line !== undefined).join("\n");
}
