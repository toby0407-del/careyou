/**
 * 小伴 AI — 患者端常駐陪伴助手的對話引擎
 * 具備情境感知（即時進度、連續天數、回診、家人鼓勵）與記憶（疼痛回報）
 */
import { getStreakDays, getTodaySummary, getSessionsForDate, todayStr } from "../data/progressStore";
import { getNextAppointment, formatAppointmentLong } from "../data/patientAppointments";
import { getUnreadEncouragements } from "../data/encouragements";
import { resolveExerciseById } from "../data/patientExercisePlans";
import { allExercises } from "../data/patientExercises";
import { getTodayMedProgress } from "../data/medications";
import { getAppNow } from "./appClock";
import { chatWithLlm, isWebGpuSupported } from "./companionLLM";
import { buildAppKnowledgeContext } from "./companionAppContext";
import { CHAT_STORAGE_LIMIT, LLM_HISTORY_TURNS } from "./companionConfig";
import { getPatientSpeechLang } from "./patientLanguage";
import { L, pickL } from "./companionLocale";

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
  /** 簡短思考過程（可選顯示） */
  thinking?: string;
  /** 建議的快速回覆選項 */
  suggestions?: string[];
}

export const QUICK_QUESTIONS = [
  "今天要練什麼？",
  "我做得怎麼樣？",
  "可以幫我加油嗎？",
];

const SUGGESTION_POOL = [
  "今天要練什麼？",
  "我做得怎麼樣？",
  "可以幫我加油嗎？",
  "下次回診何時？",
  "身體有點不舒服",
  "怎麼拿星星？",
  "今天想休息",
  "膝關節怎麼練？",
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
    .slice(0, 3);
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
  const h = getAppNow().getHours();
  if (h < 11) return "早安";
  if (h < 18) return "午安";
  return "晚安";
}

function findExerciseInText(text: string) {
  return allExercises.find(
    (ex) =>
      text.includes(ex.name) ||
      (ex.name.length >= 3 && text.includes(ex.name.slice(0, 3))) ||
      (ex.name.length >= 2 && text.includes(ex.name.slice(0, 2)) && /怎麼|如何|姿勢|練/.test(text))
  );
}

function latestTopic(): string | undefined {
  return loadMemory().recentTopics?.[0];
}

function isMealFollowUp(text: string): boolean {
  if (latestTopic() !== "meal") return false;
  return /不健康|太健康|油一|清淡|換[一]?[個種]|改推薦|再推薦|另一|甜一|鹹一|加点|多一點|少健康|垃圾|中式|西式|那給我|你推薦|詳細/.test(
    text
  );
}

/** 開啟面板時的主動問候（情境感知 + 記憶） */
export function buildProactiveGreeting(patientName: string): AiReply {
  const memory = loadMemory();
  const summary = getTodaySummary();
  const streak = getStreakDays();
  const unread = getUnreadEncouragements();
  const parts: string[] = [];

  const openers =
    getPatientSpeechLang() === "nan"
      ? [
          `${timeGreeting()}，${patientName}！我是小伴，今仔日閣陪你 💚`,
          `${patientName}，${timeGreeting()}！小伴佇遮，想講啥攏通～`,
          `嗨 ${patientName}！${timeGreeting()}，今仔日心情按怎？`,
        ]
      : [
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
    const nextName = summary.nextExercise ? `「${summary.nextExercise.name}」` : "";
    parts.push(
      getPatientSpeechLang() === "nan"
        ? pick([
            `今仔日猶未開始訓練。猶剩 ${summary.remaining} 項、大約 ${summary.estimatedMinutes} 分鐘，${
              nextName ? `先對 ${nextName} 開始就好！` : ""
            }`,
            `新的一日，緩慢來就好。今仔日約 ${summary.estimatedMinutes} 分鐘、${summary.remaining} 項，${
              nextName ? `建議先做 ${nextName}。` : ""
            }`,
          ])
        : pick([
            `今天還沒開始訓練喔。剩 ${summary.remaining} 項、大約 ${summary.estimatedMinutes} 分鐘，${
              nextName ? `從${nextName}開始吧！` : ""
            }`,
            `新的一天，從一小步開始就很好。今天約 ${summary.estimatedMinutes} 分鐘、${summary.remaining} 項，${
              nextName ? `建議先做${nextName}。` : ""
            }`,
          ])
    );
  }

  saveMemory({ ...memory, lastVisitDate: todayStr() });

  const thinking =
    summary.completed >= summary.total
      ? "先看一下今天的完成狀況與連續天數。"
      : summary.nextExercise
        ? `看一下進度，下一項好像是「${summary.nextExercise.name}」。`
        : "想一下怎麼跟你打個招呼。";

  return {
    text: parts.join("\n"),
    thinking,
    suggestions: contextualSuggestions(),
  };
}

/** 規則回覆也給一句簡短「思考」，讓介面不顯得秒答 */
export function buildRuleThinking(input: string): string {
  const text = input.trim();
  if (!text) return "想一下你想聊什麼。";
  if (isSafetyCritical(text) || /痛|不舒服|不適|暈|喘|受傷/.test(text)) {
    return "先把安全放在第一，想想要怎麼提醒你休息。";
  }
  if (/休息|好累|疲勞|想歇|今天不做/.test(text)) return "對方想休息，先尊重身體的感覺。";
  if (/加油|打氣|鼓勵|支持/.test(text)) return "想一句溫暖、不給壓力的鼓勵。";
  if (/回診|門診|掛號|看診|複診/.test(text)) return "查一下 App 裡的下次回診時間。";
  if (/練什麼|今天.*(練|做)|下一關|下一項|開始訓練/.test(text)) {
    return "對一下今天的訓練清單與下一關。";
  }
  if (/表現|進度|做得怎麼|成績|連續/.test(text)) return "看看今天的完成進度與連續天數。";
  if (/早[餐饭飯]|午[餐饭飯]|晚[餐饭飯]|吃什麼|吃啥|想吃/.test(text)) {
    return "想個清淡、好準備的用餐建議。";
  }
  if (/藥|吃藥|服藥/.test(text)) return "看一下今天的用藥進度。";
  if (/星|星星|分數|品質/.test(text)) return "回想一下星星是怎麼算的。";
  if (/謝謝|感謝|你好|嗨|哈囉|早安|午安|晚安/.test(text)) return "先好好回個招呼。";
  if (/那給我|你推薦|推薦一下/.test(text)) return "接續剛才的話題，把建議說清楚。";
  return pick([
    "稍微想一下要怎麼陪你說。",
    "對一下你的狀況，再慢慢回你。",
    "聽懂了，整理一下重點再回。",
  ]);
}

function ensureThinking(reply: AiReply, input: string): AiReply {
  if (reply.thinking?.trim()) return reply;
  return { ...reply, thinking: buildRuleThinking(input) };
}

/** 讓回覆至少有一小段可見思考時間（約 3 秒） */
async function waitForVisibleThink(startedAt: number, minMs = 1500) {
  const elapsed = performance.now() - startedAt;
  const target = minMs + Math.floor(Math.random() * 200); // 約 1.5～1.7 秒
  if (elapsed < target) {
    await new Promise((r) => setTimeout(r, target - elapsed));
  }
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
      text: pickL(
        [
          "先停下來休息，聽到你不舒服我有點擔心 🥺\n如果是輕微痠痛，休息 10 分鐘再評估；若疼痛明顯、持續或伴隨頭暈胸悶，請立即停止訓練並聯絡家人或撥打醫院。\n我已經幫你記下來了，明天會再關心你。",
          "身體的訊號很重要，現在先別勉強。\n輕微痠痛可以休息觀察；若越來越痛、頭暈或胸悶，請立刻停止並聯絡醫護或家人。\n我記住了，明天再問你好不好。",
        ],
        [
          "先歇一下，聽你講毋爽快，我有佮意煩惱 🥺\n若是輕微痠痛，歇 10 分鐘閣評估；若是真疼、一直疼抑是暈眩胸悶，請馬上停落來，聯絡家人抑是醫院。\n我共你記牢囉，明仔再關心你。",
          "身體的訊息足重要，這馬莫勉強。\n輕微痠痛通先歇睏觀察；若愈來愈疼、頭暈抑是胸悶，請即刻停，聯絡醫護抑是家人。\n我記住矣，明仔閣問你好無。",
        ]
      ),
      suggestions: contextualSuggestions(["身體有點不舒服"]),
    };
  }

  // 特定動作怎麼練（必須先於「今天練什麼」，避免「膝關節怎麼練」被當成進度問答）
  const mentioned = findExerciseInText(text);
  if (mentioned && /怎麼|如何|做對|姿勢|教|示範|技巧|要點|怎麼練|如何練/.test(text)) {
    rememberTopic("exercise");
    return {
      text: L(
        `「${mentioned.name}」：${mentioned.setsReps}，約 ${mentioned.duration}。\n` +
          `${mentioned.instruction}\n` +
          `到地圖上點該關卡，會有示範與即時姿勢偵測陪你練。`,
        `「${mentioned.name}」：${mentioned.setsReps}，大約 ${mentioned.duration}。\n` +
          `${mentioned.instruction}\n` +
          `去地圖點這关，有示範佮即時姿勢偵測陪你練。`
      ),
      suggestions: contextualSuggestions(["今天要練什麼？"]),
    };
  }

  // 今天練什麼（只問今天清單，不涵蓋「某某怎麼練」）
  if (
    /練什麼|要練什麼|今天.*(練|做)|開始訓練|訓練項目|下一關|下一項|還要練/.test(text) &&
    !/怎麼練|如何練|姿勢|示範/.test(text)
  ) {
    rememberTopic("training");
    if (!summary.nextExercise) {
      return {
        text: pickL(
          [
            `今天 ${summary.total} 項全部完成啦！連續 ${streak} 天，明天見 🎉`,
            `今日任務清空！連續 ${streak} 天，可以好好休息，明天小伴再陪你。`,
          ],
          [
            `今仔日 ${summary.total} 項攏總完成矣！連續 ${streak} 工，明仔載見 🎉`,
            `今仔日任務清氣矣！連續 ${streak} 工，通好好歇睏，明仔小伴閣陪你。`,
          ]
        ),
        suggestions: contextualSuggestions(["今天要練什麼？"]),
      };
    }
    const next = resolveExerciseById(summary.nextExercise.id) ?? summary.nextExercise;
    return {
      text: pickL(
        [
          `下一關是「${next.name}」：${next.setsReps}，${next.duration}。\n小提醒：${next.instruction}\n今天剩 ${summary.remaining} 項、約 ${summary.estimatedMinutes} 分鐘。`,
          `建議先做「${next.name}」(${next.setsReps})。\n${next.instruction}\n完成後還有 ${Math.max(0, summary.remaining - 1)} 項，整體約 ${summary.estimatedMinutes} 分鐘。`,
        ],
        [
          `下一關是「${next.name}」：${next.setsReps}，${next.duration}。\n提醒你：${next.instruction}\n今仔日猶剩 ${summary.remaining} 項、大約 ${summary.estimatedMinutes} 分鐘。`,
          `建議先做「${next.name}」(${next.setsReps})。\n${next.instruction}\n做了閣有 ${Math.max(0, summary.remaining - 1)} 項，全部大約 ${summary.estimatedMinutes} 分鐘。`,
        ]
      ),
      suggestions: contextualSuggestions(),
    };
  }

  // 特定動作名稱（無「怎麼練」時仍給簡介）— 上面已處理 how-to
  // （保留空位避免重複）

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
      suggestions: contextualSuggestions(["怎麼拿星星？"]),
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
      suggestions: contextualSuggestions(["我做得怎麼樣？"]),
    };
  }

  // 表現 / 進度
  if (/表現|進度|如何|做得|成績|幾天|連續|狀況|恢復/.test(text)) {
    rememberTopic("progress");
    const qualityLine =
      summary.avgQualityToday != null
        ? L(
            `今日平均動作品質 ${summary.avgQualityToday} 分，`,
            `今仔日平均動作品質 ${summary.avgQualityToday} 分，`
          )
        : "";
    return {
      text: pickL(
        [
          `你已經連續訓練 ${streak} 天了，超厲害！\n今天完成 ${summary.completed}/${summary.total} 項，${qualityLine}整體恢復狀況穩定向上。`,
          `連續 ${streak} 天，這很不容易！\n今日 ${summary.completed}/${summary.total} 項，${qualityLine}保持這個節奏就很棒。`,
        ],
        [
          `你已經連續訓練 ${streak} 工矣，超厲害！\n今仔日完成 ${summary.completed}/${summary.total} 項，${qualityLine}整體恢復穩定向上。`,
          `連續 ${streak} 工，這真不易！\n今仔日 ${summary.completed}/${summary.total} 項，${qualityLine}維持這个節奏就真讚。`,
        ]
      ),
      suggestions: contextualSuggestions(),
    };
  }

  // 回診
  if (/回診|門診|醫師|醫生|掛號|預約|看診|複診/.test(text)) {
    rememberTopic("appointment");
    const appt = getNextAppointment("p1");
    if (!appt) {
      return {
        text: pickL(
          [
            "目前沒有排定的回診喔。有不舒服請隨時告訴我或聯絡醫院。",
            "系統裡還沒有下一筆回診。若需要調整訓練，也可以請家人協助聯絡醫療團隊。",
          ],
          [
            "這馬猶無排回診喔。若有毋爽快隨時共我講，抑是聯絡醫院。",
            "系統內底猶無下一筆回診。若欲調訓練，通拜託家人幫你聯絡醫療團隊。",
          ]
        ),
        suggestions: contextualSuggestions(),
      };
    }
    return {
      text: L(
        `下次回診：${formatAppointmentLong(appt.datetime)}\n` +
          `${appt.department} · ${appt.physician}\n地點：${appt.location}` +
          (appt.note ? `\n備註：${appt.note}` : ""),
        `下一次回診：${formatAppointmentLong(appt.datetime)}\n` +
          `${appt.department} · ${appt.physician}\n地點：${appt.location}` +
          (appt.note ? `\n備註：${appt.note}` : "")
      ),
      suggestions: contextualSuggestions(["下次回診何時？"]),
    };
  }

  // 吃藥／藥物提醒
  if (/藥|吃藥|服藥|提醒吃藥|藥物/.test(text)) {
    rememberTopic("meds");
    const med = getTodayMedProgress();
    return {
      text:
        med.total === 0
          ? "目前沒有登錄的用藥提醒。若有醫師開立藥物，可請家人在用藥頁幫你設定。"
          : `今天用藥進度：已服 ${med.taken}/${med.total}（${med.pct}%）。\n請依醫師指示服藥；劑量與時間有疑問時，以處方或醫療端為準，小伴不取代藥師叮嚀。`,
      suggestions: contextualSuggestions(),
    };
  }

  // 加油 / 鼓勵
  if (/加油|打氣|鼓勵|支持|勉勵|棒|厲害|信心|堅持/.test(text)) {
    rememberTopic("cheer");
    return {
      text: pickL(
        [
          `${patientName}，你已經連續 ${streak} 天了，這代表你真的有在照顧自己。\n今天哪怕只完成一項，也是向前的一步。`,
          `我相信你可以的！復健像爬山，不用一次登頂，每天一點點就很了不起。`,
          `家人也在遠端看著你的進度呢。你每多練一次，他們都會更放心、更開心。`,
          `累了可以休息，但別否定自己。能打開 App 開始，就已經很勇敢了。`,
        ],
        [
          `${patientName}，你已經連續 ${streak} 工矣，這表示有認真照顧家己。\n今仔日若干焦完成一項，嘛是向前的一步。`,
          `我相信你做會到！復健親像徛山，免一擺到頂，逐工一點仔就真了不起。`,
          `家人佇遠端攏看會著你的進度。你每閣練一擺，in 就閣較安心、閣較歡喜。`,
          `若累通歇睏，但是莫否定家己。會當開 App 開始，就已經足勇敢矣。`,
        ]
      ),
      suggestions: contextualSuggestions(["可以幫我加油嗎？"]),
    };
  }

  // 不想練 / 拖延（不含「不健康」這類飲食請求）
  if (/不想練|懶得練|沒力|提不起|好難|做不到|放棄|太難|不想做/.test(text)) {
    rememberTopic("motivation");
    return {
      text: pick([
        "不想練的時候很正常，身體和心理都需要喘息。\n如果還有精神，挑最短的一項先做 5 分鐘就好；真的累了，今天休息也完全 OK。",
        "我聽見你了。與其逼自己全部做完，不如先選一個最輕鬆的動作試試。\n小步前進，也比完全停下來更有幫助。",
      ]),
      suggestions: contextualSuggestions(["今天想休息", "今天要練什麼？"]),
    };
  }

  // 睡覺／就寢（跟「訓練想休息」分開，避免答非所問）
  if (/睡覺|該睡|要睡|入睡|上床|熬夜|失眠|打瞌睡|想睡了|睡了嗎|去睡/.test(text)) {
    rememberTopic("sleep");
    const hour = getAppNow().getHours();
    const late = hour >= 21 || hour < 5;
    const afternoonNap = hour >= 12 && hour < 17;
    return {
      text: pickL(
        [
          late
            ? `已經不早了，如果身體喊累，去睡是對的 😌\n先把燈調暗、腿放鬆；睡前少滑手機。明天精神好了再練，小伴在這。`
            : afternoonNap
              ? `下午想小睡一下也可以，建議 20～40 分鐘就好，醒了再喝口水。\n若等一下還想動，做一項短的就夠，不勉強。`
              : `現在若真的睏，短短躺一下補眠沒問題；還沒睏的話，先輕鬆坐著也行。\n好好照顧睡眠，復健才會更穩。`,
          hour >= 22
            ? `可以睡了。今天到這邊就好，休息比硬撐重要。\n明天見，小伴會繼續陪你。`
            : `要不要睡，看你現在累不累。累了就睡，不累就緩緩休息也很好。\n我不催你訓練；身體有訊號就要聽。`,
        ],
        [
          late
            ? `已經袂早矣，若身體講累，去睏是對的 😌\n先共燈調暗、跤放輕鬆；睏前少滑手機。明仔精神好才閣練，小伴佇遮。`
            : afternoonNap
              ? `下晡若想睏一下嘛通，建議 20～40 分鐘就好，醒了閣啉一屑水。\n若等一下猶想動，做一項較短的就好，莫勉強。`
              : `這馬若真的瞌，短短倒一下補眠沒問題；若猶未瞌，先輕鬆坐嘛好。\n好好照顧睏眠，復健才會較穩。`,
          hour >= 22
            ? `通去睏矣。今仔日到遮就好，歇睏比硬撐較重要。\n明仔載見，小伴會繼續陪你。`
            : `欲睏毋，看你這馬累無。累著去睏，無累就慢慢歇嘛好。\n我袂催你訓練；身體有訊息著愛聽。`,
        ]
      ),
      suggestions: contextualSuggestions(["今天想休息", "可以幫我加油嗎？"]),
    };
  }

  // 休息（暫停訓練，不要勸跑跳）
  if (/休息|好累|疲勞|想歇|歇一下|躺一下|今天不做|先不練/.test(text)) {
    rememberTopic("rest");
    return {
      text: pickL(
        [
          "好，那就先好好休息 😌 休息也是復健的一部分。\n記得喝水、把腿放輕鬆；真的想動了，再打開地圖做一項短一點的就好，完全不勉強。",
          `了解，${patientName}。今天選擇休息沒關係，身體有訊號就要聽。\n小伴會在這，等你準備好再練；家人端也看得到你有好好照顧自己。`,
        ],
        [
          "好，彼就先好好歇睏 😌 歇睏嘛是復健的一部份。\n記得啉水、共跤放輕鬆；若真的想動，才閣開地圖做一項較短的就好，完全莫勉強。",
          `了解，${patientName}。今仔日欲歇睏沒關係，身體有訊息著愛聽。\n小伴佇遮等你準備好才閣練；家人佇彼爿嘛看會著你有好好照顧家己。`,
        ]
      ),
      suggestions: contextualSuggestions(["可以幫我加油嗎？", "今天要練什麼？"]),
    };
  }

  // 飲食／早餐（含「想吃不健康一點」這類接續）
  if (
    /早[餐饭飯]|午[餐饭飯]|晚[餐饭飯]|吃什麼|吃啥|推薦.*吃|肚子餓|想吃|中式|西式|不健康|不要太健康|太清淡/.test(
      text
    ) ||
    isMealFollowUp(text)
  ) {
    rememberTopic("meal");
    const wantsIndulgent = /不健康|油一|甜一|鹹一|垃圾|炸|少健康|不要太健康|太清淡/.test(text);
    if (wantsIndulgent) {
      return {
        text: pickL(
          [
            "可以偶爾鬆一點！那換個「比較滿足、但還吃得完」的：\n蔥油餅或蛋餅一份＋豆漿（甜的也可以），或小籠包／肉包 1～2 顆。\n還是少配油條加大份；吃完休息一下再動，胃會比較舒服。",
            "好，聽你的～偶爾放鬆：煎餃或鍋貼幾顆＋小杯奶茶／米漿。\n別空腹狂練；若有醫囑限油限糖，還是以醫師為準，今天就當小確幸。",
          ],
          [
            "通偶爾放鬆！換一个較爽、嘛食會了的：\n蔥油餅抑是蛋餅一份＋豆浆（甜的嘛通），抑是小籠包／肉包 1～2 粒。\n油条莫配傷濟；食了歇一下才閣動，胃會較好過。",
            "好，聽你的～偶爾爽一下：煎餃抑是鍋貼幾粒＋一杯奶茶／米漿。\n莫腹肚空空猛練；若醫生有限油限糖，猶原著聽醫生，今仔日當做好心喜。",
          ]
        ),
        suggestions: contextualSuggestions(["今天要練什麼？"]),
      };
    }
    return {
      text: pickL(
        [
          "復健早上可以吃得清淡好消化～\n推薦中式：一小碗稀飯或燕麥＋雞蛋／少量肉鬆＋一份青菜或香蕉。\n少油炸、別空腹猛練；若有糖尿病或醫師飲食衛教，以醫師為準喔。",
          "簡單好準備的一餐：全麥吐司或饅頭＋牛奶／豆漿＋一點水果。\n飯後休息一下再做復健比較舒服；吞嚥不適或醫囑限飲食時，再跟家人確認。",
        ],
        [
          "復健早起通食較清，較好消化～\n推薦中式：一小碗糜抑是燕麥＋雞卵／一屑仔肉鬆＋青菜抑是香蕉。\n少油炸、莫腹肚空空猛練；若有糖尿病抑是醫生飲食交代，著聽醫生喔。",
          "簡單好備料：全麥吐司抑是饅頭＋牛奶／豆浆＋一屑果子。\n食了歇一下才復健較舒服；若吞嚥無順抑是醫生限制飲食，閣共家人確認。",
        ]
      ),
      suggestions: contextualSuggestions(["今天要練什麼？", "可以幫我加油嗎？"]),
    };
  }

  // 短句接續（例如剛問早餐，再說「那給我／你推薦」）
  if (
    /^(那給我|給我|推薦|你推薦|好啊|好|來|OK|ok)$/i.test(text) ||
    /那給我|你推薦一下|詳細一點/.test(text)
  ) {
    const topic = latestTopic();
    if (topic === "meal") {
      return {
        text:
          "那就這樣安排，好準備：\n1）溫稀飯或燕麥半碗～一碗\n2）水煮蛋或蒸蛋一顆\n3）香蕉或蘋果切片\n4）溫白開水或無糖豆漿一小杯\n吃完休息 20～30 分鐘再練，會比較穩。",
        suggestions: contextualSuggestions(["今天要練什麼？"]),
      };
    }
    if (topic === "rest" || topic === "sleep") {
      return {
        text: "好，那今天就以休息為主。躺坐舒適、把腳抬高也好。\n有任何不舒服隨時跟我說；明天精神好了，再從下一項慢慢開始。",
        suggestions: contextualSuggestions(["可以幫我加油嗎？"]),
      };
    }
  }

  // 害怕 / 擔心
  if (/怕|擔心|會不會|危險|安全|怕痛/.test(text)) {
    return {
      text: pick([
        "會擔心很正常。訓練時跟著示範、量力而為，不舒服就停。\nApp 會即時看姿勢，但你的感受比什麼都重要。",
        "安全第一！任何動作若讓你緊張，可以減少次數或請家人在旁。\n有疑慮隨時問醫師，小伴也會記住你的狀況。",
      ]),
      suggestions: contextualSuggestions(["身體有點不舒服"]),
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
      text: pickL(
        [
          `${timeGreeting()}！能陪著你是小伴最開心的事 💚 想聊訓練、身體感受或日常都可以。`,
          `我在呀！${timeGreeting()}，${patientName}。今天想聊什麼呢？`,
        ],
        [
          `${timeGreeting()}！會當陪你是小伴上歡喜的代誌 💚 想講訓練、身體感受抑是日常攏通。`,
          `我佇遮！${timeGreeting()}，${patientName}。今仔日想講啥？`,
        ]
      ),
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
      suggestions: contextualSuggestions(["可以幫我加油嗎？", "今天要練什麼？"]),
    };
  }

  // 喝水／營養
  if (/喝水|營養|補充水分|補水/.test(text)) {
    return {
      text: pick([
        "訓練前後記得補充水分，少量多次最好。\n若有糖尿病或飲食限制，請依醫師建議，小伴無法取代營養諮詢喔。",
        "水分很重要！休息時喝幾口水，有助恢復。",
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
    text: pickL(
      [
        `收到！${patientName}，想聊什麼都可以。\n我可以陪你聊今天的訓練、身體感受、回診，或只是說說心情。`,
        `嗯，我在聽。你可以直接問訓練、進度、星星怎麼拿，或用語音跟我說話也行。`,
        `謝謝你跟我說這些。若不確定問什麼，試試「今天要練什麼」或「給我加油打氣」？`,
      ],
      [
        `收到！${patientName}，想講啥攏通。\n我會陪你聊今仔日的訓練、身體感受、回診，抑是講講心情。`,
        `嗯，我佇聽。你通直接問訓練、進度、星星按怎提，抑是用語音共我講嘛好。`,
        `多謝你共我講這些。若毋知欲問啥，試「今天要練什麼」抑是「可以幫我加油嗎？」？`,
      ]
    ),
    suggestions: contextualSuggestions(),
  };
}

/** 需立即走規則引擎的安全關鍵字（疼痛、緊急） */
export function isSafetyCritical(text: string): boolean {
  return /痛|不舒服|不適|頭暈|暈|喘|胸悶|昏|急救|119|受傷|麻痺|吐血|呼吸困難/.test(text);
}

/**
 * 已知意圖優先走規則引擎（小模型常答非所問：休息勸跳、早餐自相矛盾等）
 */
export function isRulePreferred(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  if (isSafetyCritical(t)) return true;
  if (/睡覺|該睡|要睡|入睡|上床|熬夜|失眠|想睡了|去睡|打瞌睡/.test(t)) return true;
  if (
    /休息|好累|疲勞|想歇|歇一下|躺一下|今天不做|先不練|不想練|懶得練|沒力|提不起|放棄/.test(t)
  )
    return true;
  if (/加油|打氣|鼓勵|支持|勉勵/.test(t)) return true;
  if (
    /練什麼|要練什麼|今天.*(練|做)|開始訓練|訓練項目|下一關|下一項|還要練|怎麼練|如何練/.test(t)
  )
    return true;
  if (/回診|門診|掛號|預約|看診|複診/.test(t)) return true;
  if (/表現|進度|做得怎麼|成績|連續/.test(t)) return true;
  if (
    /早[餐饭飯]|午[餐饭飯]|晚[餐饭飯]|吃什麼|吃啥|推薦.*吃|肚子餓|想吃|中式|西式|不健康|不要太健康|太清淡/.test(
      t
    ) ||
    isMealFollowUp(t)
  )
    return true;
  if (/藥|吃藥|服藥|提醒吃藥/.test(t)) return true;
  if (/謝謝|感謝|你好|嗨|哈囉|早安|午安|晚安|在嗎|你在/.test(t)) return true;
  if (/^(那給我|給我|推薦|你推薦|好啊|好|來|OK|ok)$/i.test(t) || /那給我|你推薦一下/.test(t))
    return true;
  return false;
}

/** 供本機 LLM 使用的復健情境 system prompt */
export function buildSystemPrompt(patientName: string): string {
  const memory = loadMemory();
  const appContext = buildAppKnowledgeContext(patientName);

  const lines = [
    "你是「小伴」，倍伴練 App 的 AI 復健陪伴助手。",
    getPatientSpeechLang() === "nan"
      ? "患者選擇「台語」。請用台灣閩南語口語漢字寫回覆（例：按怎、足讚、莫勉強、今仔日），語氣像親切阿公阿媽聊天；查資料數字仍用清楚可讀寫法。"
      : "請用繁體中文（國語），語氣溫暖、像朋友聊天。",
    "你可以：1) 依下方 App 資料回答進度／關卡／島嶼／里程碑／回診；2) 陪聊日常心情與生活。",
    "回答規則：",
    "- 查資料時必須以【App 即時資料】為準，不要編造不存在的關卡或數字。",
    "- 日常聊天可輕鬆回應，不必每次都扯回復健。",
    "- 正式回答控制在 2～5 句，清楚好讀。",
    "- 輸出格式固定兩段（思考要短，不要超過 1 句）：",
    "【思考】用一句話說明你要查什麼或怎麼回",
    "【回答】給患者看的內容",
    "- 不要使用 Markdown 標題或條列符號，可用換行。",
    "",
    "絕對禁止：",
    "- 患者說想休息時，不要建議跳繩、跑步、打球等高強度活動，也不要追問「有沒有空運動」。",
    "- 問「要不要睡覺」就回答睡眠，不要答成復健休息或勸他去運動。",
    "- 飲食問題要給具體建議；患者說想「不健康一點」就要改推薦，不可重複同一套清淡菜單。",
    "- 不可自相矛盾（例如又說不吃早餐又說會幫你制定早餐）。",
    "- 不要把任意話題硬轉成「活動量是否適度」這類問卷。",
    "- 延續對話上下文，短句如「那給我」「你推薦」「可以不健康一點嗎」要接續上一題回答。",
    "",
    appContext,
    "",
    memory.lastPainReport
      ? `曾回報不適（${memory.lastPainReport.date}）：${memory.lastPainReport.note}`
      : "",
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
  ];

  return lines.filter(Boolean).join("\n");
}

export type ChatTurn = { role: "user" | "assistant"; content: string };

/**
 * 非同步回覆：
 * - 已知意圖／安全議題 → 規則引擎（穩定、有邏輯）
 * - 其餘開放聊天 → 本機 LLM；失敗再退回規則
 * 無論來源，都會附上簡短思考，並至少停頓約 1.5 秒再回，避免秒答感。
 */
export async function replyToAsync(
  input: string,
  patientName: string,
  history: ChatTurn[] = [],
  onLlmProgress?: (p: { text: string; progress: number }) => void
): Promise<AiReply> {
  const startedAt = performance.now();
  const text = input.trim();
  if (!text) {
    const empty = ensureThinking(
      { text: "想跟我說什麼呢？", suggestions: contextualSuggestions() },
      text
    );
    await waitForVisibleThink(startedAt);
    return empty;
  }

  let reply: AiReply;

  if (isRulePreferred(text)) {
    reply = ensureThinking(replyTo(text, patientName), text);
    rememberUserNote(text);
    rememberDialogue(text, reply.text);
    await waitForVisibleThink(startedAt);
    return reply;
  }

  try {
    if (isWebGpuSupported()) {
      const llmResult = await chatWithLlm(
        buildSystemPrompt(patientName),
        history,
        text,
        onLlmProgress
      );
      if (llmResult) {
        rememberTopic("llm-chat");
        rememberUserNote(text);
        rememberDialogue(text, llmResult.text);
        reply = ensureThinking(
          {
            text: llmResult.text,
            thinking: llmResult.thinking,
            suggestions: contextualSuggestions(),
          },
          text
        );
        await waitForVisibleThink(startedAt);
        return reply;
      }
    }
  } catch {
    /* 退回規則引擎 */
  }

  reply = ensureThinking(replyTo(text, patientName), text);
  rememberUserNote(text);
  rememberDialogue(text, reply.text);
  await waitForVisibleThink(startedAt);
  return reply;
}
