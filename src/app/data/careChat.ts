/**
 * 照護訊息 — 醫師 / 家屬 / 患者一對一私訊（localStorage + 事件同步）
 */
export type CareChatRole = "doctor" | "family" | "patient";

export interface CareChatMessage {
  id: string;
  patientId: string;
  from: CareChatRole;
  to: CareChatRole;
  senderName: string;
  text: string;
  createdAt: string;
  readBy: CareChatRole[];
}

const STORAGE_KEY = "rehabbridge_care_chat_v2";
const SEED_FLAG_KEY = "rehabbridge_care_chat_seeded_v1";

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
  window.dispatchEvent(new Event("rehab-care-chat-updated"));
}

export function subscribeCareChat(listener: () => void) {
  listeners.add(listener);
  const onUpdate = () => listener();
  window.addEventListener("rehab-care-chat-updated", onUpdate);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("rehab-care-chat-updated", onUpdate);
  };
}

function hoursAgo(hours: number, minutes = 0): string {
  const d = new Date();
  d.setHours(d.getHours() - hours, d.getMinutes() - minutes);
  return d.toISOString();
}

function daysAgo(days: number, hour = 10, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function seedMessage(
  id: string,
  patientId: string,
  from: CareChatRole,
  to: CareChatRole,
  senderName: string,
  text: string,
  createdAt: string,
  readBy: CareChatRole[] = [from]
): CareChatMessage {
  return { id, patientId, from, to, senderName, text, createdAt, readBy };
}

function buildSeedMessages(): CareChatMessage[] {
  return [
    // p1 王大明 — 醫師 ↔ 患者
    seedMessage(
      "seed-p1-dp-1",
      "p1",
      "patient",
      "doctor",
      "王大明",
      "陳醫師您好，今天膝蓋彎曲訓練做完有一點酸，這樣正常嗎？",
      daysAgo(1, 9, 15),
      ["patient", "doctor"]
    ),
    seedMessage(
      "seed-p1-dp-2",
      "p1",
      "doctor",
      "patient",
      "陳建宏 醫師",
      "王伯伯您好，訓練後肌肉酸是正常現象，記得冰敷 15 分鐘。若明天仍明顯疼痛再跟我說。",
      daysAgo(1, 9, 42),
      ["doctor", "patient"]
    ),
    seedMessage(
      "seed-p1-dp-3",
      "p1",
      "patient",
      "doctor",
      "王大明",
      "好的，我會照做，謝謝醫師！",
      daysAgo(1, 10, 5),
      ["patient", "doctor"]
    ),
    seedMessage(
      "seed-p1-dp-4",
      "p1",
      "doctor",
      "patient",
      "陳建宏 醫師",
      "很棒，繼續保持！記得每日完成度也要打卡。",
      hoursAgo(26),
      ["doctor", "patient"]
    ),

    // p1 王大明 — 醫師 ↔ 家屬
    seedMessage(
      "seed-p1-df-1",
      "p1",
      "family",
      "doctor",
      "家屬",
      "醫師好，爸爸這週都有按時做復健，回診前還需要注意什麼嗎？",
      daysAgo(2, 14, 20),
      ["family", "doctor"]
    ),
    seedMessage(
      "seed-p1-df-2",
      "p1",
      "doctor",
      "family",
      "陳建宏 醫師",
      "家屬您好，回診前請協助記錄每日疼痛指數，並暫時避免爬樓梯。",
      daysAgo(2, 15, 8),
      ["doctor", "family"]
    ),
    seedMessage(
      "seed-p1-df-3",
      "p1",
      "family",
      "doctor",
      "家屬",
      "了解，我們會留意，謝謝醫師！",
      daysAgo(2, 15, 35),
      ["family", "doctor"]
    ),

    // p1 王大明 — 患者 ↔ 家屬
    seedMessage(
      "seed-p1-pf-1",
      "p1",
      "family",
      "patient",
      "家屬",
      "爸，今天復健做完了嗎？我晚上會打電話關心你。",
      hoursAgo(5),
      ["family", "patient"]
    ),
    seedMessage(
      "seed-p1-pf-2",
      "p1",
      "patient",
      "family",
      "王大明",
      "做完了，今天三組都完成，醫師也有回我訊息。",
      hoursAgo(4, 35),
      ["patient", "family"]
    ),

    // p2 李淑芬 — 醫師 ↔ 患者
    seedMessage(
      "seed-p2-dp-1",
      "p2",
      "doctor",
      "patient",
      "林雅婷 醫師",
      "淑芬女士，這週完成率進步不少，腰橋式記得不要拱太高，以骨盆中立為主。",
      daysAgo(1, 11, 0),
      ["doctor", "patient"]
    ),
    seedMessage(
      "seed-p2-dp-2",
      "p2",
      "patient",
      "doctor",
      "李淑芬",
      "收到醫師，我會注意角度，今天也有完成側彎訓練。",
      daysAgo(1, 11, 28),
      ["patient", "doctor"]
    ),

    // p2 李淑芬 — 醫師 ↔ 家屬
    seedMessage(
      "seed-p2-df-1",
      "p2",
      "family",
      "doctor",
      "家屬",
      "林醫師好，想請問她久坐後腰還是會痠，需要調整訓練嗎？",
      hoursAgo(20),
      ["family", "doctor"]
    ),
    seedMessage(
      "seed-p2-df-2",
      "p2",
      "doctor",
      "family",
      "林雅婷 醫師",
      "可先增加骨盆後傾練習，並提醒每 45 分鐘起身活動。下週回診再評估。",
      hoursAgo(19, 40),
      ["doctor", "family"]
    ),
    seedMessage(
      "seed-p2-pf-1",
      "p2",
      "patient",
      "family",
      "李淑芬",
      "老公，我今天有做橋式運動，腰比較不那麼緊了。",
      hoursAgo(6),
      ["patient", "family"]
    ),
    seedMessage(
      "seed-p2-pf-2",
      "p2",
      "family",
      "patient",
      "家屬",
      "太好了，記得不要一次做太久，不舒服就休息。",
      hoursAgo(5, 45),
      ["family", "patient"]
    ),

    // p3 張文彬 — 家屬未讀（醫師端紅點示範）
    seedMessage(
      "seed-p3-df-1",
      "p3",
      "family",
      "doctor",
      "家屬",
      "陳醫師，爸爸已經三天沒做訓練了，可以請您幫忙提醒一下嗎？",
      hoursAgo(3),
      ["family"]
    ),
    seedMessage(
      "seed-p3-dp-1",
      "p3",
      "doctor",
      "patient",
      "陳建宏 醫師",
      "文彬先生，復健需要持續才有效，今天先從坐姿抬腿開始，量力而為即可。",
      daysAgo(4, 10, 30),
      ["doctor", "patient"]
    ),
    seedMessage(
      "seed-p3-pf-1",
      "p3",
      "family",
      "patient",
      "家屬",
      "爸，女兒有跟醫師說了，今天先從簡單的開始做就好。",
      hoursAgo(2, 30),
      ["family", "patient"]
    ),
    seedMessage(
      "seed-p3-pf-2",
      "p3",
      "patient",
      "family",
      "張文彬",
      "好，我試試看，做完再跟你說。",
      hoursAgo(2),
      ["patient", "family"]
    ),

    // p4 陳美玲 — 進度良好
    seedMessage(
      "seed-p4-dp-1",
      "p4",
      "patient",
      "doctor",
      "陳美玲",
      "黃醫師，肩關節外展今天做到 80 度了！",
      hoursAgo(2),
      ["patient", "doctor"]
    ),
    seedMessage(
      "seed-p4-dp-2",
      "p4",
      "doctor",
      "patient",
      "黃俊豪 醫師",
      "進步很好，維持現有強度，不要勉強衝更高角度。",
      hoursAgo(1, 45),
      ["doctor", "patient"]
    ),
    seedMessage(
      "seed-p4-df-1",
      "p4",
      "family",
      "doctor",
      "家屬",
      "黃醫師，她回家後還需要做冰敷嗎？",
      daysAgo(1, 16, 0),
      ["family", "doctor"]
    ),
    seedMessage(
      "seed-p4-df-2",
      "p4",
      "doctor",
      "family",
      "黃俊豪 醫師",
      "訓練後若微腫可冰敷 10–15 分鐘，沒有不適則不必每天冰敷。",
      daysAgo(1, 16, 25),
      ["doctor", "family"]
    ),
    seedMessage(
      "seed-p4-pf-1",
      "p4",
      "patient",
      "family",
      "陳美玲",
      "我剛做完訓練，肩膀沒有特別痛。",
      hoursAgo(1),
      ["patient", "family"]
    ),

    // p5 黃志宏 — 家屬未讀
    seedMessage(
      "seed-p5-df-1",
      "p5",
      "family",
      "doctor",
      "家屬",
      "林醫師，他最近常說腳踝緊，是否可以先減少訓練組數？",
      hoursAgo(8),
      ["family"]
    ),
    seedMessage(
      "seed-p5-dp-1",
      "p5",
      "doctor",
      "patient",
      "林雅婷 醫師",
      "志宏先生，腳踝緊可先多做熱身與伸展，訓練強度我們下週回診再調整。",
      daysAgo(2, 11, 0),
      ["doctor", "patient"]
    ),
    seedMessage(
      "seed-p5-pf-1",
      "p5",
      "patient",
      "family",
      "黃志宏",
      "老婆，醫師說先不要自己減組數，我明天回診再問。",
      hoursAgo(7),
      ["patient", "family"]
    ),
  ];
}

function ensureCareChatSeed() {
  try {
    if (localStorage.getItem(SEED_FLAG_KEY)) return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CareChatMessage[];
      if (parsed.length > 0) {
        localStorage.setItem(SEED_FLAG_KEY, "1");
        return;
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buildSeedMessages()));
    localStorage.setItem(SEED_FLAG_KEY, "1");
  } catch {
    /* ignore */
  }
}

function loadAll(): CareChatMessage[] {
  ensureCareChatSeed();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CareChatMessage[]) : [];
  } catch {
    return [];
  }
}

function saveAll(messages: CareChatMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    /* ignore */
  }
  notify();
}

export function getAvailablePeers(role: CareChatRole): CareChatRole[] {
  if (role === "doctor") return ["patient", "family"];
  if (role === "patient") return ["doctor", "family"];
  return ["doctor", "patient"];
}

export function isConversationMessage(
  msg: CareChatMessage,
  patientId: string,
  self: CareChatRole,
  peer: CareChatRole
): boolean {
  if (msg.patientId !== patientId) return false;
  return (
    (msg.from === self && msg.to === peer) || (msg.from === peer && msg.to === self)
  );
}

export function getCareMessages(
  patientId: string,
  self: CareChatRole,
  peer: CareChatRole
): CareChatMessage[] {
  return loadAll()
    .filter((msg) => isConversationMessage(msg, patientId, self, peer))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function sendCareMessage(input: {
  patientId: string;
  from: CareChatRole;
  to: CareChatRole;
  senderName: string;
  text: string;
}): CareChatMessage {
  const trimmed = input.text.trim();
  if (!trimmed) throw new Error("訊息不可為空");

  const message: CareChatMessage = {
    id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    patientId: input.patientId,
    from: input.from,
    to: input.to,
    senderName: input.senderName,
    text: trimmed,
    createdAt: new Date().toISOString(),
    readBy: [input.from],
  };

  saveAll([...loadAll(), message]);
  return message;
}

export function markCareChatRead(
  patientId: string,
  self: CareChatRole,
  peer: CareChatRole
) {
  let changed = false;
  const updated = loadAll().map((msg) => {
    if (!isConversationMessage(msg, patientId, self, peer)) return msg;
    if (msg.from === self || msg.readBy.includes(self)) return msg;
    changed = true;
    return { ...msg, readBy: [...msg.readBy, self] };
  });
  if (changed) saveAll(updated);
}

export function getCareChatUnreadCount(
  patientId: string,
  self: CareChatRole,
  peer: CareChatRole
): number {
  return loadAll().filter(
    (msg) =>
      isConversationMessage(msg, patientId, self, peer) &&
      msg.from !== self &&
      !msg.readBy.includes(self)
  ).length;
}

export function getCareChatTotalUnread(patientId: string, self: CareChatRole): number {
  return getAvailablePeers(self).reduce(
    (sum, peer) => sum + getCareChatUnreadCount(patientId, self, peer),
    0
  );
}

export function formatCareChatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export const CARE_CHAT_ROLE_LABEL: Record<CareChatRole, string> = {
  doctor: "醫師",
  family: "家屬",
  patient: "患者",
};
