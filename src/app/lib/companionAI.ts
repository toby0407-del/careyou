/**
 * 小伴 AI — 患者端常駐陪伴助手的對話引擎
 * 具備情境感知（即時進度、連續天數、回診、家人鼓勵）與記憶（疼痛回報）
 */
import { getStreakDays, getTodaySummary, getSessionsForDate, todayStr } from "../data/progressStore";
import { getNextAppointment, formatAppointmentLong } from "../data/patientAppointments";
import { getUnreadEncouragements } from "../data/encouragements";
import { resolveExerciseById } from "../data/patientExercisePlans";
import { allExercises } from "../data/patientExercises";
import { chatWithLlm, isWebGpuSupported } from "./companionLLM";
import { CHAT_STORAGE_LIMIT, LLM_HISTORY_TURNS } from "./companionConfig";

export { LLM_HISTORY_TURNS, CHAT_STORAGE_LIMIT } from "./companionConfig";

const MEMORY_KEY = "rehabbridge_companion_memory";
/** 持久記憶：近期對話片段筆數 */
const DIALOGUE_MEMORY_LIMIT = 16;
/** 持久記憶：患者提過的事 */
const USER_NOTES_LIMIT = 12;

export interface CompanionMemory {
  /** 最近一次疼痛/不適回報 */
  lastPainReport?: { date: string; note: string };
  /** 上次開啟小伴的日期 */
  lastVisitDate?: string;
  /** 最近聊過的話題標籤 */
  recentTopics?: string[];
  /** 近期對話（跨 session 延續上下文） */
  recentDialogue?: Array<{ date: string; user: string; assistant: string }>;
  /** 患者曾提過的關鍵資訊 */
  userNotes?: string[];
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
  "怎麼拿更多星星？",
  "給我加油打氣",
];

const SUGGESTION_POOL = [
  "今天要練什麼？",
  "我最近表現如何？",
  "下次回診是什麼時候？",
  "我有點不舒服",
  "怎麼拿更多星星？",
  "給我加油打氣",
  "時光迴廊是什麼？",
  "里程碑怎麼解鎖？",
  "今天想休息一下",
  "膝關節怎麼練？",
  "我做得對嗎？",
  "跟我聊聊天",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function contextualSuggestions(exclude: string[] = []): string[] {
  const blocked = new Set(exclude);
  return shuffle(SUGGESTION_POOL)
    .filter((s) => !blocked.has(s))
    .slice(0, 4);
}

function rememberTopic(topic: string) {
  const memory = loadMemory();
  const recent = [topic, ...(memory.recentTopics ?? [])].slice(0, 12);
  saveMemory({ ...memory, recentTopics: recent });
}

/** 記住一輪對話，供下次開啟延續上下文 */
export function rememberDialogue(user: string, assistant: string) {
  const memory = loadMemory();
  const recentDialogue = [
    {
      date: todayStr(),
      user: user.trim().slice(0, 140),
      assistant: assistant.trim().slice(0, 220),
    },
    ...(memory.recentDialogue ?? []),
  ].slice(0, DIALOGUE_MEMORY_LIMIT);
  saveMemory({ ...memory, recentDialogue });
}

/** 記住患者提過的關鍵資訊（較長訊息或具體描述） */
export function rememberUserNote(note: string) {
  const trimmed = note.trim();
  if (trimmed.length < 8) return;
  const memory = loadMemory();
  const snippet = trimmed.slice(0, 100);
  const userNotes = [snippet, ...(memory.userNotes ?? [])]
    .filter((n, i, arr) => arr.indexOf(n) === i)
    .slice(0, USER_NOTES_LIMIT);
  saveMemory({ ...memory, userNotes });
}

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 11) return "早安";
  if (h < 18) return "午安";
  return "晚安";
}

function findExerciseInText(text: string) {
  return allExercises.find(
    (ex) =>
      text.includes(ex.name) ||
      ex.name.replace(/\s/g, "").includes(text.replace(/\s/g, "")) ||
      (ex.name.length >= 2 && text.includes(ex.name.slice(0, 2)))
  );
}

/** 開啟面板時的主動問候（情境感知 + 記憶） */
export function buildProactiveGreeting(patientName: string): AiReply {
  const memory = loadMemory();
  const summary = getTodaySummary();
  const streak = getStreakDays();
  const unread = getUnreadEncouragements();
  const parts: string[] = [];

  const openers = [
    `${timeGreeting()}，${patientName}！我是小伴，今天也陪著你 💚`,
    `${patientName}，${timeGreeting()}！小伴在這，想聊什麼都可以～`,
    `嗨 ${patientName}！${timeGreeting()}，今天心情怎麼樣？`,
  ];
  parts.push(pick(openers));

  if (memory.lastPainReport && memory.lastPainReport.date !== todayStr()) {
    const followUps = [
      `上次你說「${memory.lastPainReport.note}」，今天感覺有好一點嗎？`,
      `我一直在想上次你提到的「${memory.lastPainReport.note}」，現在還會不舒服嗎？`,
    ];
    parts.push(pick(followUps));
  }

  if (unread.length > 0) {
    const latest = unread[0];
    parts.push(`💌 ${latest.from}傳來打氣：「${latest.message}」`);
  }

  if (summary.completed >= summary.total) {
    const doneLines = [
      `今天 ${summary.total} 項全部完成，連續 ${streak} 天，你真的太棒了！好好休息 🎉`,
      `哇，今天全數達標！連續 ${streak} 天紀錄超亮，值得好好放鬆一下。`,
    ];
    parts.push(pick(doneLines));
  } else if (summary.todaySessions.length > 0) {
    parts.push(
      pick([
        `今天已完成 ${summary.todaySessions.length} 項，再 ${summary.remaining} 項就全數達成！`,
        `進度不錯喔，已完成 ${summary.todaySessions.length} 項，剩下 ${summary.remaining} 項，一步一步來。`,
      ])
    );
  } else {
    parts.push(
      pick([
        `今天還沒開始訓練喔。剩 ${summary.remaining} 項、大約 ${summary.estimatedMinutes} 分鐘，${
          summary.nextExercise ? `從「${summary.nextExercise.name}」開始吧！` : ""
        }`,
        `新的一天，從一小步開始就很好。今天約 ${summary.estimatedMinutes} 分鐘、${summary.remaining} 項，${
          summary.nextExercise ? `建議先做「${summary.nextExercise.name}」。` : ""
        }`,
      ])
    );
  }

  saveMemory({ ...memory, lastVisitDate: todayStr() });

  return { text: parts.join("\n"), suggestions: contextualSuggestions() };
}

/** 規則式意圖判斷 + 情境資料回覆（支援自由對話） */
export function replyTo(input: string, patientName: string): AiReply {
  const text = input.trim();
  const summary = getTodaySummary();
  const streak = getStreakDays();

  // 疼痛 / 不適 — 最優先
  if (/痛|不舒服|不適|頭暈|暈|喘|累壞|受傷|麻|痠痛|刺痛|腫/.test(text)) {
    const memory = loadMemory();
    saveMemory({
      ...memory,
      lastPainReport: { date: todayStr(), note: text.slice(0, 40) },
    });
    rememberTopic("pain");
    return {
      text: pick([
        "先停下來休息，聽到你不舒服我有點擔心 🥺\n如果是輕微痠痛，休息 10 分鐘再評估；若疼痛明顯、持續或伴隨頭暈胸悶，請立即停止訓練並聯絡家人或撥打醫院。\n我已經幫你記下來了，明天會再關心你。",
        "身體的訊號很重要，現在先別勉強。\n輕微痠痛可以休息觀察；若越來越痛、頭暈或胸悶，請立刻停止並聯絡醫護或家人。\n我記住了，明天再問你好不好。",
      ]),
      suggestions: contextualSuggestions(["我有點不舒服"]),
    };
  }

  // 今天練什麼
  if (/練什麼|今天.*(練|做)|做什麼|開始訓練|訓練項目|下一關|下一項|還要練/.test(text)) {
    rememberTopic("training");
    if (!summary.nextExercise) {
      return {
        text: pick([
          `今天 ${summary.total} 項全部完成啦！連續 ${streak} 天，明天見 🎉`,
          `今日任務清空！連續 ${streak} 天，可以好好休息，明天小伴再陪你。`,
        ]),
        suggestions: contextualSuggestions(["今天要練什麼？"]),
      };
    }
    const next = resolveExerciseById(summary.nextExercise.id) ?? summary.nextExercise;
    return {
      text: pick([
        `下一關是「${next.name}」：${next.setsReps}，${next.duration}。\n小提醒：${next.instruction}\n今天剩 ${summary.remaining} 項、約 ${summary.estimatedMinutes} 分鐘。`,
        `建議先做「${next.name}」(${next.setsReps})。\n${next.instruction}\n完成後還有 ${summary.remaining - 1} 項，整體約 ${summary.estimatedMinutes} 分鐘。`,
      ]),
      suggestions: contextualSuggestions(),
    };
  }

  // 特定動作詢問
  const mentioned = findExerciseInText(text);
  if (mentioned && /怎麼|如何|做對|姿勢|教|示範|技巧|要點/.test(text)) {
    rememberTopic("exercise");
    return {
      text:
        `「${mentioned.name}」：${mentioned.setsReps}，約 ${mentioned.duration}。\n` +
        `${mentioned.instruction}\n` +
        `到地圖上點該關卡，會有示範影片和即時姿勢偵測陪你練。`,
      suggestions: contextualSuggestions(),
    };
  }

  // 星星 / 品質
  if (/星|星星|評分|分數|品質|幾分|滿分/.test(text)) {
    rememberTopic("quality");
    const q =
      summary.avgQualityToday != null
        ? `你今天平均品質 ${summary.avgQualityToday} 分。`
        : "完成訓練後會依動作準確度給 1～3 顆星。";
    return {
      text: pick([
        `${q}\n動作越標準、完成度越高，星星越多。放慢速度、對準示範，通常比求快更好。`,
        `${q}\n每項做完都會看姿勢準確度給星。專心跟著節奏，比一次做很多組更有幫助。`,
      ]),
      suggestions: contextualSuggestions(),
    };
  }

  // 里程碑 / 成就
  if (/里程碑|成就|獎章|徽章|解鎖|關卡/.test(text)) {
    rememberTopic("milestones");
    return {
      text: pick([
        "「里程碑」會記錄連續天數、完成項目、品質突破等成就。\n多完成訓練、維持連續天數，就會陸續解鎖新里程碑。",
        "每個小進步都值得紀念！到「里程碑」分頁可以看到已解鎖與進行中的成就，繼續練就會一個個亮起來。",
      ]),
      suggestions: contextualSuggestions(["里程碑怎麼解鎖？"]),
    };
  }

  // 時光迴廊
  if (/迴廊|照片|回憶|相簿|時光/.test(text)) {
    rememberTopic("gallery");
    return {
      text: pick([
        "「時光迴廊」會隨著復健歷程解鎖照片與回憶，像一本復健日記。\n持續訓練、完成里程碑，就能收集更多珍貴片段。",
        "那裡放著你和家人的復健回憶。每多練一天，就有機會解鎖新的照片與故事，很值得去看看。",
      ]),
      suggestions: contextualSuggestions(["時光迴廊是什麼？"]),
    };
  }

  // 表現 / 進度
  if (/表現|進度|如何|做得|成績|幾天|連續|狀況|恢復/.test(text)) {
    rememberTopic("progress");
    const qualityLine =
      summary.avgQualityToday != null
        ? `今日平均動作品質 ${summary.avgQualityToday} 分，`
        : "";
    return {
      text: pick([
        `你已經連續訓練 ${streak} 天了，超厲害！\n今天完成 ${summary.completed}/${summary.total} 項，${qualityLine}整體恢復狀況穩定向上。`,
        `連續 ${streak} 天，這很不容易！\n今日 ${summary.completed}/${summary.total} 項，${qualityLine}保持這個節奏就很棒。`,
      ]),
      suggestions: contextualSuggestions(),
    };
  }

  // 回診
  if (/回診|門診|醫師|醫生|掛號|預約|看診|複診/.test(text)) {
    rememberTopic("appointment");
    const appt = getNextAppointment("p1");
    if (!appt) {
      return {
        text: pick([
          "目前沒有排定的回診喔。有不舒服請隨時告訴我或聯絡醫院。",
          "系統裡還沒有下一筆回診。若需要調整訓練，也可以請家人協助聯絡醫療團隊。",
        ]),
        suggestions: contextualSuggestions(),
      };
    }
    return {
      text:
        `下次回診：${formatAppointmentLong(appt.datetime)}\n` +
        `${appt.department} · ${appt.physician}\n地點：${appt.location}` +
        (appt.note ? `\n備註：${appt.note}` : ""),
      suggestions: contextualSuggestions(["下次回診是什麼時候？"]),
    };
  }

  // 加油 / 鼓勵
  if (/加油|打氣|鼓勵|支持|勉勵|棒|厲害|信心|堅持/.test(text)) {
    rememberTopic("cheer");
    const cheers = [
      `${patientName}，你已經連續 ${streak} 天了，這代表你真的有在照顧自己。\n今天哪怕只完成一項，也是向前的一步。`,
      `我相信你可以的！復健像爬山，不用一次登頂，每天一點點就很了不起。`,
      `家人也在遠端看著你的進度呢。你每多練一次，他們都會更放心、更開心。`,
      `累了可以休息，但別否定自己。能打開 App 開始，就已經很勇敢了。`,
    ];
    return { text: pick(cheers), suggestions: contextualSuggestions(["給我加油打氣"]) };
  }

  // 不想練 / 拖延
  if (/不想|懶|沒力|提不起|好難|做不到|放棄|太難/.test(text)) {
    rememberTopic("motivation");
    return {
      text: pick([
        "不想練的時候很正常，身體和心理都需要喘息。\n如果還有精神，挑最短的一項先做 5 分鐘就好；真的累了，今天休息也完全 OK。",
        "我聽見你了。與其逼自己全部做完，不如先選一個最輕鬆的動作試試。\n小步前進，也比完全停下來更有幫助。",
      ]),
      suggestions: contextualSuggestions(["今天想休息一下", "今天要練什麼？"]),
    };
  }

  // 休息
  if (/休息|好累|疲勞|睡|打盹|躺/.test(text)) {
    rememberTopic("rest");
    return {
      text: pick([
        "好，休息也是復健的一部分 😌 記得補充水分。\n如果等一下有精神了，做一項短的也很棒——不勉強，身體最重要。",
        "那就先好好歇一會。醒來後若想做，踝關節或手腕這類短項目也不錯；不想做也沒關係。",
      ]),
      suggestions: contextualSuggestions(),
    };
  }

  // 害怕 / 擔心
  if (/怕|擔心|會不會|危險|安全|怕痛/.test(text)) {
    return {
      text: pick([
        "會擔心很正常。訓練時跟著示範、量力而為，不舒服就停。\nApp 會即時看姿勢，但你的感受比什麼都重要。",
        "安全第一！任何動作若讓你緊張，可以減少次數或請家人在旁。\n有疑慮隨時問醫師，小伴也會記住你的狀況。",
      ]),
      suggestions: contextualSuggestions(["我有點不舒服"]),
    };
  }

  // 時間 / 多久
  if (/多久|幾分鐘|時間|要練多久|多長/.test(text)) {
    return {
      text:
        summary.remaining > 0
          ? `今天剩下約 ${summary.estimatedMinutes} 分鐘、${summary.remaining} 項。\n單項通常 8～15 分鐘，可以分次完成，不用一次做完。`
          : "今天的訓練都完成了！若還想動，可以複習已完成的項目當伸展。",
      suggestions: contextualSuggestions(),
    };
  }

  // 感謝 / 打招呼
  if (/謝謝|感謝|你好|嗨|哈囉|早安|午安|晚安|在嗎|你在/.test(text)) {
    return {
      text: pick([
        `${timeGreeting()}！能陪著你是小伴最開心的事 💚 想聊訓練、身體感受或日常都可以。`,
        `我在呀！${timeGreeting()}，${patientName}。今天想聊什麼呢？`,
      ]),
      suggestions: contextualSuggestions(),
    };
  }

  // 找家人 / 求助
  if (/家人|女兒|兒子|孫|找人|求助|幫忙|女兒|老婆|老公/.test(text)) {
    rememberTopic("family");
    const today = getSessionsForDate(todayStr());
    return {
      text:
        pick([
          "你的家人在家屬端隨時看得到你的復健進度，他們一直都在關心你。",
          "家人可以在家屬 App 看你的完成率、趨勢，還能傳打氣訊息給你。",
        ]) +
        (today.length > 0
          ? "\n今天的訓練成果已經同步給他們了，他們一定很開心！"
          : "\n完成今天的訓練後，成果會即時同步給他們喔。") +
        "\n如需緊急協助，請直接撥打電話給家人或 119。",
      suggestions: contextualSuggestions(),
    };
  }

  // 小伴是誰 / App 怎麼用
  if (/你是誰|小伴|什麼是|怎麼用|如何使用|功能/.test(text)) {
    return {
      text: pick([
        "我是小伴，你的復健陪伴助手 🤖\n可以問我今天的訓練、進度、回診，也能聊身體感受。地圖上點關卡開始練，「結果」看統計，「迴廊」收集回憶。",
        "小伴是本機 AI，不用網路也能聊。\n我懂你的訓練進度，會提醒、打氣，不舒服也會請你休息。隨時打字或按麥克風跟我說話！",
      ]),
      suggestions: contextualSuggestions(),
    };
  }

  // 聊天 / 情緒
  if (/聊天|寂寞|無聊|孤單|心情|難過|開心|壓力|煩/.test(text)) {
    rememberTopic("chat");
    return {
      text: pick([
        `我喜歡跟你聊天。${patientName}，復健路上有起伏很正常，我會一直在。\n想說什麼都可以，訓練的事或生活瑣事都行。`,
        "嗯，我在聽。有時候說出來會輕鬆一點。\n你若想轉移注意力，做一項短訓練或看看時光迴廊也不錯。",
        "今天能來跟我說話就很好了。不管心情如何，你都值得被好好對待。",
      ]),
      suggestions: contextualSuggestions(["跟我聊聊天", "給我加油打氣"]),
    };
  }

  // 喝水 / 飲食
  if (/喝水|飲食|吃|營養|補充/.test(text)) {
    return {
      text: pick([
        "訓練前後記得補充水分，少量多次最好。\n若有糖尿病或飲食限制，請依醫師建議，小伴無法取代營養諮詢喔。",
        "水分很重要！休息時喝幾口水，有助恢復。餐食方面請跟醫療團隊確認最適合你的安排。",
      ]),
      suggestions: contextualSuggestions(),
    };
  }

  // 含問號的自由提問 — 盡量情境回覆
  if (/[？?]/.test(text) || text.length >= 6) {
    const hints: string[] = [];
    if (summary.nextExercise) hints.push(`你下一項是「${summary.nextExercise.name}」`);
    if (streak > 0) hints.push(`已連續 ${streak} 天`);
    const hint = hints.length ? `\n（${hints.join("，")}）` : "";
    return {
      text: pick([
        `好問題！${hint}\n復健沒有標準答案，重要的是你的感受。若跟訓練有關，可以問「今天要練什麼」或「我最近表現如何」；身體不舒服一定要說喔。`,
        `我聽懂了。${hint}\n你可以跟我聊訓練、進度、回診，或任何身體狀況。我會依你的資料盡量回答，也歡迎自由聊聊。`,
        `嗯…${hint}\n也許我們可以從今天的小目標開始？哪怕只完成一項，都是進步。`,
      ]),
      suggestions: contextualSuggestions(),
    };
  }

  // fallback — 仍給溫暖且開放的回覆
  return {
    text: pick([
      `收到！${patientName}，想聊什麼都可以。\n我可以陪你聊今天的訓練、身體感受、回診，或只是說說心情。`,
      `嗯，我在聽。你可以直接問訓練、進度、星星怎麼拿，或用語音跟我說話也行。`,
      `謝謝你跟我說這些。若不確定問什麼，試試「今天要練什麼」或「給我加油打氣」？`,
    ]),
    suggestions: contextualSuggestions(),
  };
}

/** 需立即走規則引擎的安全關鍵字（疼痛、緊急） */
export function isSafetyCritical(text: string): boolean {
  return /痛|不舒服|不適|頭暈|暈|喘|胸悶|昏|急救|119|受傷|麻痺|吐血|呼吸困難/.test(text);
}

/** 供本機 LLM 使用的復健情境 system prompt */
export function buildSystemPrompt(patientName: string): string {
  const summary = getTodaySummary();
  const streak = getStreakDays();
  const appt = getNextAppointment("p1");
  const memory = loadMemory();
  const unread = getUnreadEncouragements();

  const lines = [
    "你是「小伴」，倍伴練 App 的 AI 復健陪伴助手。",
    "請用繁體中文，語氣溫暖、簡短、像朋友聊天，2～5 句為宜。",
    "你可以自由聊天、傾聽心情、聊生活瑣事，也能回答復健相關問題。",
    "",
    `患者：${patientName}`,
    `今日完成：${summary.completed}/${summary.total} 項，連續訓練 ${streak} 天`,
    summary.avgQualityToday != null ? `今日平均動作品質：${summary.avgQualityToday}` : "",
    summary.nextExercise
      ? `下一項訓練：${summary.nextExercise.name}（約剩 ${summary.remaining} 項、${summary.estimatedMinutes} 分鐘）`
      : "今日訓練已全部完成",
    appt ? `下次回診：${formatAppointmentLong(appt.datetime)}，${appt.department}` : "目前無排定回診",
    memory.lastPainReport
      ? `曾回報不適（${memory.lastPainReport.date}）：${memory.lastPainReport.note}`
      : "",
    unread[0] ? `家人打氣：${unread[0].from} 說「${unread[0].message}」` : "",
    memory.recentTopics?.length
      ? `最近聊過的話題：${memory.recentTopics.slice(0, 8).join("、")}`
      : "",
    memory.userNotes?.length
      ? `患者曾提過：${memory.userNotes.slice(0, 6).join("；")}`
      : "",
    memory.recentDialogue?.length
      ? [
          "近期對話（請延續上下文，不要重複問已聊過的事）：",
          ...memory.recentDialogue.slice(0, 8).map(
            (d) => `· ${d.date} 患者：${d.user} → 小伴：${d.assistant}`
          ),
        ].join("\n")
      : "",
    "",
    "安全規則：",
    "- 若患者描述疼痛、頭暈、胸悶等，請溫柔建議休息並聯絡家人或醫護，不可診斷或開藥。",
    "- 不施壓、不批評；鼓勵小步前進。",
    "- 不要使用 Markdown 標題或條列符號，可用換行。",
  ];

  return lines.filter(Boolean).join("\n");
}

export type ChatTurn = { role: "user" | "assistant"; content: string };

/**
 * 非同步回覆：優先本機開源 LLM 自由對話，失敗時退回規則引擎。
 * 安全關鍵議題一律走規則引擎。
 */
export async function replyToAsync(
  input: string,
  patientName: string,
  history: ChatTurn[] = [],
  onLlmProgress?: (p: { text: string; progress: number }) => void
): Promise<AiReply> {
  const text = input.trim();
  if (!text) {
    return { text: "想跟我說什麼呢？", suggestions: contextualSuggestions() };
  }

  if (isSafetyCritical(text)) {
    return replyTo(text, patientName);
  }

  try {
    if (isWebGpuSupported()) {
      const llmText = await chatWithLlm(
        buildSystemPrompt(patientName),
        history,
        text,
        onLlmProgress
      );
      if (llmText) {
        rememberTopic("llm-chat");
        rememberUserNote(text);
        rememberDialogue(text, llmText);
        return {
          text: llmText,
          suggestions: contextualSuggestions(),
        };
      }
    }
  } catch {
    /* 退回規則引擎 */
  }

  const ruleReply = replyTo(text, patientName);
  rememberUserNote(text);
  rememberDialogue(text, ruleReply.text);
  return ruleReply;
}
