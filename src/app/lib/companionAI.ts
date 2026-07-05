/**
 * 小伴 AI — 患者端常駐陪伴助手的對話引擎
 * 具備情境感知（即時進度、連續天數、回診、家人鼓勵）與記憶（疼痛回報）
 */
import { getStreakDays, getTodaySummary, getSessionsForDate, todayStr } from "../data/progressStore";
import { getNextAppointment, formatAppointmentLong } from "../data/patientAppointments";
import { getUnreadEncouragements } from "../data/encouragements";
import { resolveExerciseById } from "../data/patientExercisePlans";

const MEMORY_KEY = "rehabbridge_companion_memory";

export interface CompanionMemory {
  /** 最近一次疼痛/不適回報 */
  lastPainReport?: { date: string; note: string };
  /** 上次開啟小伴的日期 */
  lastVisitDate?: string;
}

export function loadMemory(): CompanionMemory {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    return raw ? (JSON.parse(raw) as CompanionMemory) : {};
  } catch {
    return {};
  }
}

export function saveMemory(memory: CompanionMemory) {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
  } catch {
    /* ignore */
  }
}

export interface AiReply {
  text: string;
  /** 建議的快速回覆選項 */
  suggestions?: string[];
}

export const QUICK_QUESTIONS = [
  "今天要練什麼？",
  "我最近表現如何？",
  "下次回診是什麼時候？",
  "我有點不舒服",
];

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 11) return "早安";
  if (h < 18) return "午安";
  return "晚安";
}

/** 開啟面板時的主動問候（情境感知 + 記憶） */
export function buildProactiveGreeting(patientName: string): AiReply {
  const memory = loadMemory();
  const summary = getTodaySummary();
  const streak = getStreakDays();
  const unread = getUnreadEncouragements();
  const parts: string[] = [];

  parts.push(`${timeGreeting()}，${patientName}！我是小伴，今天也陪著你 💚`);

  // 記憶：上次疼痛回報追蹤關心
  if (memory.lastPainReport && memory.lastPainReport.date !== todayStr()) {
    parts.push(`上次你說「${memory.lastPainReport.note}」，今天感覺有好一點嗎？`);
  }

  // 家人鼓勵
  if (unread.length > 0) {
    const latest = unread[0];
    parts.push(`💌 ${latest.from}傳來打氣：「${latest.message}」`);
  }

  // 今日進度
  if (summary.completed >= summary.total) {
    parts.push(`今天 ${summary.total} 項全部完成，連續 ${streak} 天，你真的太棒了！好好休息 🎉`);
  } else if (summary.todaySessions.length > 0) {
    parts.push(
      `今天已完成 ${summary.todaySessions.length} 項訓練，再 ${summary.remaining} 項就全數達成，繼續加油！`
    );
  } else {
    parts.push(
      `今天還沒開始訓練喔。剩 ${summary.remaining} 項、大約 ${summary.estimatedMinutes} 分鐘，${
        summary.nextExercise ? `從「${summary.nextExercise.name}」開始吧！` : ""
      }`
    );
  }

  saveMemory({ ...memory, lastVisitDate: todayStr() });

  return { text: parts.join("\n"), suggestions: QUICK_QUESTIONS };
}

/** 規則式意圖判斷 + 情境資料回覆 */
export function replyTo(input: string, patientName: string): AiReply {
  const text = input.trim();
  const summary = getTodaySummary();
  const streak = getStreakDays();

  // 疼痛 / 不適 — 最優先，安全第一
  if (/痛|不舒服|不適|頭暈|暈|喘|累壞|受傷|麻/.test(text)) {
    const memory = loadMemory();
    saveMemory({
      ...memory,
      lastPainReport: { date: todayStr(), note: text.slice(0, 40) },
    });
    return {
      text:
        "先停下來休息，聽到你不舒服我有點擔心 🥺\n" +
        "如果是輕微痠痛，休息 10 分鐘再評估；若疼痛明顯、持續或伴隨頭暈胸悶，請立即停止訓練並聯絡家人或撥打醫院。\n" +
        "我已經幫你記下來了，明天會再關心你。需要的話也可以請醫師調整訓練強度。",
      suggestions: ["下次回診是什麼時候？", "今天先休息"],
    };
  }

  // 今天練什麼
  if (/練什麼|今天.*(練|做)|做什麼|開始訓練|訓練項目|下一關/.test(text)) {
    if (!summary.nextExercise) {
      return {
        text: `今天 ${summary.total} 項全部完成啦！連續 ${streak} 天，明天見 🎉`,
        suggestions: ["我最近表現如何？"],
      };
    }
    const next = resolveExerciseById(summary.nextExercise.id) ?? summary.nextExercise;
    return {
      text:
        `下一關是「${next.name}」：${next.setsReps}，${next.duration}。\n` +
        `小提醒：${next.instruction}\n` +
        `今天剩 ${summary.remaining} 項、約 ${summary.estimatedMinutes} 分鐘。到「復健項目」地圖點亮的關卡就能開始！`,
      suggestions: ["我最近表現如何？", "我有點不舒服"],
    };
  }

  // 表現 / 進度
  if (/表現|進度|如何|做得|成績|品質|幾天|連續/.test(text)) {
    const qualityLine =
      summary.avgQualityToday != null
        ? `今日平均動作品質 ${summary.avgQualityToday} 分，`
        : "";
    return {
      text:
        `你已經連續訓練 ${streak} 天了，超厲害！\n` +
        `今天完成 ${summary.completed}/${summary.total} 項，${qualityLine}整體恢復狀況穩定向上。\n` +
        `到「復健結果」可以看完整月曆與品質分析，「里程碑」還有成就等你解鎖喔。`,
      suggestions: ["今天要練什麼？", "下次回診是什麼時候？"],
    };
  }

  // 回診
  if (/回診|門診|醫師|醫生|掛號|預約|看診/.test(text)) {
    const appt = getNextAppointment("p1");
    if (!appt) {
      return { text: "目前沒有排定的回診喔。有不舒服請隨時告訴我或聯絡醫院。" };
    }
    return {
      text:
        `下次回診：${formatAppointmentLong(appt.datetime)}\n` +
        `${appt.department} · ${appt.physician}\n地點：${appt.location}` +
        (appt.note ? `\n備註：${appt.note}` : ""),
      suggestions: ["今天要練什麼？"],
    };
  }

  // 休息
  if (/休息|好累|疲勞|睡/.test(text)) {
    return {
      text:
        "好，休息也是復健的一部分 😌 記得補充水分。\n" +
        "如果等一下有精神了，做一項短的也很棒——踝關節旋轉只要 8 分鐘。不勉強，身體最重要。",
      suggestions: ["今天要練什麼？"],
    };
  }

  // 感謝 / 打招呼
  if (/謝謝|感謝|你好|嗨|哈囉|早安|午安|晚安/.test(text)) {
    return {
      text: `${timeGreeting()}！能陪著你是小伴最開心的事 💚 有任何問題都可以問我。`,
      suggestions: QUICK_QUESTIONS,
    };
  }

  // 找家人 / 求助
  if (/家人|女兒|兒子|孫|找人|求助|幫忙/.test(text)) {
    const today = getSessionsForDate(todayStr());
    return {
      text:
        "你的家人在家屬端隨時看得到你的復健進度，他們一直都在關心你。\n" +
        (today.length > 0
          ? "今天的訓練成果已經同步給他們了，他們一定很開心！"
          : "完成今天的訓練後，成果會即時同步給他們喔。") +
        "\n如需緊急協助，請直接撥打電話給家人或 119。",
      suggestions: ["今天要練什麼？"],
    };
  }

  // fallback
  return {
    text:
      `這個問題小伴還在學習中 🙈 不過我很懂你的復健狀況！\n` +
      `你可以問我今天的訓練、最近的表現、回診時間，或告訴我身體的感覺。`,
    suggestions: QUICK_QUESTIONS,
  };
}
