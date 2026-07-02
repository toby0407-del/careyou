import type { Exercise } from "./exerciseTypes";

export type WorldKind =
  | "archipelago"
  | "jungle-planet"
  | "desert-planet"
  | "ice-ring"
  | "volcano-planet"
  | "space-station";

export interface ChapterIsland {
  id: string;
  name: string;
  sublabel: string;
  position: { x: number; y: number };
  scale: number;
  levelCount: number;
  /** 去背浮島素材（單張 PNG） */
  image?: string;
}

export interface ChapterDef {
  id: string;
  index: number;
  name: string;
  subtitle: string;
  worldKind: WorldKind;
  accent: string;
  gradient: string;
  icon: string;
  unlockAfterChapter?: string;
  islands: ChapterIsland[];
  /** 使用程式繪製的篇章地圖（非貼圖） */
  styledMap?: "east-archipelago";
  /** 浮島全景圖（去背 PNG，四座島連在一起） */
  islandPanorama?: string;
  /** @deprecated 單島裁切，改用 islandPanorama */
  islandSpritesheet?: string;
  trophy: { name: string; emoji: string; description: string };
}

export const LEVELS_PER_ISLAND = 10;

/** 地圖素材製作中：暫時開放所有篇章底圖預覽 */
export const MAP_PREVIEW_ALL_CHAPTERS = true;

export const chapters: ChapterDef[] = [
  {
    id: "zhang-archipelago",
    index: 1,
    name: "張氏群島",
    subtitle: "東海浮島 · 復健啟航之地",
    worldKind: "archipelago",
    accent: "#c4a35a",
    gradient: "linear-gradient(180deg, #4c1d95 0%, #7c3aed 45%, #c4b5fd 100%)",
    icon: "🏝️",
    styledMap: "east-archipelago",
    islandPanorama: "/assets/world-map/zhang-islands-panorama.png?v=4",
    islands: [
      { id: "zhang-sanctuary", name: "水月仙宮", sublabel: "復健聖所", position: { x: 12, y: 50 }, scale: 1, levelCount: 10 },
      { id: "zhang-terrace", name: "青苗梯田島", sublabel: "靈田谷", position: { x: 37, y: 50 }, scale: 1, levelCount: 10 },
      { id: "zhang-market", name: "東海集市島", sublabel: "帆影碼頭", position: { x: 62, y: 50 }, scale: 1, levelCount: 10 },
      { id: "zhang-grotto", name: "金佛洞天島", sublabel: "石窟禪境", position: { x: 87, y: 50 }, scale: 0.95, levelCount: 10 },
    ],
    trophy: { name: "群島征服者寶箱", emoji: "🌊", description: "通關張氏群島全部 40 關" },
  },
  {
    id: "emerald-planet",
    index: 2,
    name: "翠綠行星",
    subtitle: "外星叢林 · 生命恢復之星",
    worldKind: "jungle-planet",
    accent: "#22c55e",
    gradient: "linear-gradient(165deg, #14532d 0%, #15803d 45%, #4ade80 100%)",
    icon: "🪐",
    unlockAfterChapter: "zhang-archipelago",
    islands: [
      { id: "emer-canopy", name: "樹冠島", sublabel: "高空步道", position: { x: 22, y: 50 }, scale: 0.92, levelCount: 10 },
      { id: "emer-vine", name: "藤蔓島", sublabel: "密林谷", position: { x: 52, y: 38 }, scale: 1.02, levelCount: 10 },
      { id: "emer-spring", name: "清泉島", sublabel: "藍泉澤", position: { x: 78, y: 52 }, scale: 0.94, levelCount: 10 },
    ],
    trophy: { name: "翠綠行星核心", emoji: "🌿", description: "征服翠綠行星全部副本" },
  },
  {
    id: "amber-desert",
    index: 3,
    name: "琥珀沙漠星",
    subtitle: "金色沙海 · 古文明遺跡",
    worldKind: "desert-planet",
    accent: "#f59e0b",
    gradient: "linear-gradient(165deg, #78350f 0%, #d97706 50%, #fcd34d 100%)",
    icon: "🏜️",
    unlockAfterChapter: "emerald-planet",
    islands: [
      { id: "amber-dune", name: "沙丘島", sublabel: "鳴沙灣", position: { x: 20, y: 55 }, scale: 0.9, levelCount: 10 },
      { id: "amber-ruin", name: "遺跡島", sublabel: "神殿墟", position: { x: 50, y: 40 }, scale: 1, levelCount: 10 },
      { id: "amber-oasis", name: "綠洲島", sublabel: "棕櫚泉", position: { x: 80, y: 58 }, scale: 0.93, levelCount: 10 },
    ],
    trophy: { name: "沙漠星琥珀護符", emoji: "🔶", description: "通關琥珀沙漠星" },
  },
  {
    id: "aurora-ring",
    index: 4,
    name: "極光冰環",
    subtitle: "冰封星環 · 極地修煉場",
    worldKind: "ice-ring",
    accent: "#38bdf8",
    gradient: "linear-gradient(165deg, #0c4a6e 0%, #1e3a8a 40%, #a5f3fc 100%)",
    icon: "❄️",
    unlockAfterChapter: "amber-desert",
    islands: [
      { id: "aurora-frost", name: "霜晶島", sublabel: "冰晶台", position: { x: 24, y: 48 }, scale: 0.91, levelCount: 10 },
      { id: "aurora-glacier", name: "冰川島", sublabel: "永凍崖", position: { x: 52, y: 36 }, scale: 1, levelCount: 10 },
      { id: "aurora-light", name: "極光島", sublabel: "光幕灣", position: { x: 76, y: 54 }, scale: 0.96, levelCount: 10 },
    ],
    trophy: { name: "極光冰環勳章", emoji: "🌌", description: "完成極光冰環修煉" },
  },
  {
    id: "magma-core",
    index: 5,
    name: "熔心星球",
    subtitle: "火山核心 · 高強度挑戰",
    worldKind: "volcano-planet",
    accent: "#ef4444",
    gradient: "linear-gradient(165deg, #450a0a 0%, #dc2626 45%, #fb923c 100%)",
    icon: "🌋",
    unlockAfterChapter: "aurora-ring",
    islands: [
      { id: "magma-vent", name: "火山島", sublabel: "噴氣口", position: { x: 22, y: 52 }, scale: 0.92, levelCount: 10 },
      { id: "magma-obsidian", name: "黑曜島", sublabel: "熔岩湖", position: { x: 50, y: 38 }, scale: 1.03, levelCount: 10 },
      { id: "magma-forge", name: "鍛造島", sublabel: "鐵匠谷", position: { x: 78, y: 56 }, scale: 0.94, levelCount: 10 },
    ],
    trophy: { name: "熔心星球鍛造錘", emoji: "🔥", description: "征服熔心星球" },
  },
  {
    id: "starport",
    index: 6,
    name: "星港空間站",
    subtitle: "軌道基地 · 終極復健殿堂",
    worldKind: "space-station",
    accent: "#a78bfa",
    gradient: "linear-gradient(165deg, #1e1b4b 0%, #4c1d95 50%, #818cf8 100%)",
    icon: "🛸",
    unlockAfterChapter: "magma-core",
    islands: [
      { id: "star-dock", name: "停泊島", sublabel: "A區船塢", position: { x: 20, y: 50 }, scale: 0.9, levelCount: 10 },
      { id: "star-lab", name: "實驗島", sublabel: "復健艙", position: { x: 50, y: 38 }, scale: 1, levelCount: 10 },
      { id: "star-bridge", name: "指揮島", sublabel: "艦橋台", position: { x: 80, y: 54 }, scale: 0.95, levelCount: 10 },
    ],
    trophy: { name: "星港大師徽章", emoji: "🎖️", description: "完成全部六篇章之旅" },
  },
];

const POSE_TEMPLATES: Exercise["pose"][] = [
  { joint: "leftKnee", flexedAngle: 90, extendedAngle: 165, tolerance: 15 },
  { joint: "leftKnee", flexedAngle: 100, extendedAngle: 160, tolerance: 20 },
  { joint: "leftHip", flexedAngle: 140, extendedAngle: 175, tolerance: 12 },
  { joint: "leftHip", flexedAngle: 130, extendedAngle: 170, tolerance: 18 },
  { joint: "leftShoulder", flexedAngle: 30, extendedAngle: 85, tolerance: 12 },
  { joint: "leftShoulder", flexedAngle: 20, extendedAngle: 70, tolerance: 15 },
];

const LEVEL_NAME_POOL: Record<WorldKind, string[]> = {
  archipelago: ["聖所伸展", "仙宮深蹲", "瀑布平衡", "雲海抬腿", "梯田扭轉", "集市步行", "碼頭屈膝", "石窟核心", "禪意拉伸", "群島終章"],
  "jungle-planet": ["藤蔓拉舉", "叢林深蹲", "樹冠平衡", "孢子呼吸", "根鬚伸展", "綠洲步行", "蕨葉扭轉", "行星核心", "密林抬腿", "翠綠終章"],
  "desert-planet": ["沙丘步行", "遺跡深蹲", "暖沙平衡", "琥珀拉伸", "綠洲抬腿", "神殿核心", "風暴呼吸", "沙漠扭轉", "烈日屈膝", "琥珀終章"],
  "ice-ring": ["霜晶平衡", "冰川步行", "極光拉伸", "冰環深蹲", "寒風核心", "雪原抬腿", "凍土扭轉", "冰晶呼吸", "星環屈膝", "極光終章"],
  "volcano-planet": ["熔岩步行", "火山深蹲", "熱浪平衡", "黑曜拉伸", "鍛造核心", "岩漿抬腿", "烈焰扭轉", "火山呼吸", "熔心屈膝", "熔火終章"],
  "space-station": ["零重力伸展", "艙室深蹲", "軌道平衡", "星港拉伸", "復健核心", "船塢抬腿", "艦橋扭轉", "太空呼吸", "指揮屈膝", "星港終章"],
};

function buildLevelId(chapterId: string, islandId: string, n: number) {
  return `${chapterId}__${islandId}__lv${String(n).padStart(2, "0")}`;
}

function defaultProgress(): { completed: boolean; stars: 0 | 1 | 2 | 3 } {
  return { completed: false, stars: 0 };
}

export function generateAllChapterExercises(): Exercise[] {
  const out: Exercise[] = [];
  let globalLevel = 0;

  for (const ch of chapters) {
    const names = LEVEL_NAME_POOL[ch.worldKind];
    for (const island of ch.islands) {
      for (let i = 1; i <= island.levelCount; i++) {
        globalLevel += 1;
        const progress = defaultProgress();
        const pose = POSE_TEMPLATES[(globalLevel - 1) % POSE_TEMPLATES.length];
        const difficulty = Math.min(3, Math.ceil(i / 3.5)) as 1 | 2 | 3;
        out.push({
          id: buildLevelId(ch.id, island.id, i),
          name: `${island.name} · ${names[i - 1] ?? `副本 ${i}`}`,
          nameEn: `Level ${globalLevel}`,
          setsReps: `${2 + (i % 2)} 組 × ${10 + (i % 6) * 2} 次`,
          duration: `約 ${7 + (i % 5)} 分鐘`,
          difficulty,
          completed: progress.completed,
          stars: progress.stars,
          sets: 2 + (i % 2),
          repsPerSet: 10 + (i % 6) * 2,
          instruction: `在${island.name}完成第 ${i} 個復健副本，保持動作穩定與呼吸節奏。`,
          level: globalLevel,
          pose,
        });
      }
    }
  }
  return out;
}

export const chapterExercises = generateAllChapterExercises();

export function getChapterById(id: string): ChapterDef | undefined {
  return chapters.find((c) => c.id === id);
}

export function getIslandDef(chapterId: string, islandId: string): ChapterIsland | undefined {
  return getChapterById(chapterId)?.islands.find((i) => i.id === islandId);
}

export function getIslandExerciseIds(chapterId: string, islandId: string): string[] {
  return chapterExercises
    .filter((e) => e.id.startsWith(`${chapterId}__${islandId}__`))
    .sort((a, b) => a.level - b.level)
    .map((e) => e.id);
}

export function getChapterExerciseIds(chapterId: string): string[] {
  return chapterExercises.filter((e) => e.id.startsWith(`${chapterId}__`)).map((e) => e.id);
}

export function isChapterUnlocked(chapterId: string): boolean {
  if (MAP_PREVIEW_ALL_CHAPTERS) return true;
  const ch = getChapterById(chapterId);
  if (!ch?.unlockAfterChapter) return true;
  const prev = getChapterById(ch.unlockAfterChapter);
  if (!prev) return true;
  return getChapterExerciseIds(prev.id).every((id) => {
    const ex = chapterExercises.find((e) => e.id === id);
    return ex?.completed;
  });
}

export function isIslandUnlocked(chapterId: string, islandId: string): boolean {
  if (!isChapterUnlocked(chapterId)) return false;
  const ch = getChapterById(chapterId);
  if (!ch) return false;
  const idx = ch.islands.findIndex((i) => i.id === islandId);
  if (idx <= 0) return true;
  const prev = ch.islands[idx - 1];
  return getIslandExerciseIds(chapterId, prev.id).every((id) => {
    const ex = chapterExercises.find((e) => e.id === id);
    return ex?.completed;
  });
}

export function getIslandProgress(chapterId: string, islandId: string) {
  const ids = getIslandExerciseIds(chapterId, islandId);
  const exercises = ids.map((id) => chapterExercises.find((e) => e.id === id)!);
  const completed = exercises.filter((e) => e.completed).length;
  return {
    completed,
    total: exercises.length,
    pct: exercises.length ? Math.round((completed / exercises.length) * 100) : 0,
  };
}

export function getChapterProgress(chapterId: string) {
  const ids = getChapterExerciseIds(chapterId);
  const exercises = ids.map((id) => chapterExercises.find((e) => e.id === id)!);
  const completed = exercises.filter((e) => e.completed).length;
  return {
    completed,
    total: exercises.length,
    pct: exercises.length ? Math.round((completed / exercises.length) * 100) : 0,
  };
}

export function isIslandCompleted(chapterId: string, islandId: string): boolean {
  const p = getIslandProgress(chapterId, islandId);
  return p.total > 0 && p.completed === p.total;
}

export function isChapterCompleted(chapterId: string): boolean {
  const p = getChapterProgress(chapterId);
  return p.total > 0 && p.completed === p.total;
}

export function getIslandLevelStatus(
  exercise: Exercise,
  indexInIsland: number,
  islandExercises: Exercise[]
): "locked" | "active" | "completed" {
  if (exercise.completed) return "completed";
  const prevDone = indexInIsland === 0 || islandExercises[indexInIsland - 1]?.completed;
  return prevDone ? "active" : "locked";
}

/** 10 關散佈在島嶼各區的座標（%）— 對應島嶼地形圖 */
const SCATTERED_ISLAND_POSITIONS: { x: number; y: number }[] = [
  { x: 24, y: 70 }, // 1 南岸沙灘
  { x: 34, y: 56 }, // 2 西側林地
  { x: 30, y: 40 }, // 3 西北森林
  { x: 44, y: 30 }, // 4 中央高地
  { x: 58, y: 34 }, // 5 東北丘陵
  { x: 68, y: 44 }, // 6 東岸台地
  { x: 54, y: 52 }, // 7 島心
  { x: 42, y: 62 }, // 8 中南平原
  { x: 62, y: 64 }, // 9 東南岬角
  { x: 72, y: 36 }, // 10 終點高塔
];

export function getIslandMapPositions(count: number): { x: number; y: number }[] {
  return SCATTERED_ISLAND_POSITIONS.slice(0, count);
}

export interface IslandSouvenir {
  id: string;
  islandId: string;
  islandName: string;
  chapterId: string;
  chapterName: string;
  name: string;
  emoji: string;
  description: string;
  unlocked: boolean;
}

export function getIslandSouvenir(chapterId: string, islandId: string): IslandSouvenir {
  const ch = getChapterById(chapterId)!;
  const island = getIslandDef(chapterId, islandId)!;
  const done = isIslandCompleted(chapterId, islandId);
  return {
    id: `${islandId}-trophy`,
    islandId,
    islandName: island.name,
    chapterId,
    chapterName: ch.name,
    name: `${island.name}戰利品箱`,
    emoji: ch.icon,
    description: `通關${island.name}全部 ${island.levelCount} 個副本`,
    unlocked: done,
  };
}

export function getAllIslandSouvenirs(): IslandSouvenir[] {
  return chapters.flatMap((ch) =>
    ch.islands.map((island) => getIslandSouvenir(ch.id, island.id))
  );
}

export function getUnlockedSouvenirCount(): number {
  return getAllIslandSouvenirs().filter((s) => s.unlocked).length;
}

export interface ProgressLocation {
  chapterId: string;
  chapterIndex: number;
  islandId: string;
  islandIndex: number;
  levelIndex: number;
  levelNumber: number;
  exerciseId: string;
  islandName: string;
  chapterName: string;
}

/** 依進度找出玩家目前所在的章、島、關 */
export function getCurrentProgressLocation(): ProgressLocation {
  for (let ci = 0; ci < chapters.length; ci++) {
    const ch = chapters[ci];
    if (!isChapterUnlocked(ch.id)) break;

    for (let ii = 0; ii < ch.islands.length; ii++) {
      const island = ch.islands[ii];
      if (!isIslandUnlocked(ch.id, island.id)) continue;

      const ids = getIslandExerciseIds(ch.id, island.id);
      const exercises = ids.map((id) => chapterExercises.find((e) => e.id === id)!);

      for (let li = 0; li < exercises.length; li++) {
        const status = getIslandLevelStatus(exercises[li], li, exercises);
        if (status === "active") {
          return {
            chapterId: ch.id,
            chapterIndex: ci,
            islandId: island.id,
            islandIndex: ii,
            levelIndex: li,
            levelNumber: li + 1,
            exerciseId: exercises[li].id,
            islandName: island.name,
            chapterName: ch.name,
          };
        }
      }

      if (!isIslandCompleted(ch.id, island.id)) {
        const nextIdx = exercises.findIndex((e) => !e.completed);
        const idx = nextIdx >= 0 ? nextIdx : 0;
        return {
          chapterId: ch.id,
          chapterIndex: ci,
          islandId: island.id,
          islandIndex: ii,
          levelIndex: idx,
          levelNumber: idx + 1,
          exerciseId: exercises[idx]?.id ?? ids[0],
          islandName: island.name,
          chapterName: ch.name,
        };
      }
    }

    if (!isChapterCompleted(ch.id)) break;
  }

  const first = chapters[0];
  const firstIsland = first.islands[0];
  const firstId = getIslandExerciseIds(first.id, firstIsland.id)[0];
  return {
    chapterId: first.id,
    chapterIndex: 0,
    islandId: firstIsland.id,
    islandIndex: 0,
    levelIndex: 0,
    levelNumber: 1,
    exerciseId: firstId,
    islandName: firstIsland.name,
    chapterName: first.name,
  };
}

export function getTodayRecommendedExerciseIds(chapterId: string, islandId: string): string[] {
  const ids = getIslandExerciseIds(chapterId, islandId);
  const exercises = ids.map((id) => chapterExercises.find((e) => e.id === id)!);
  const active = exercises.find(
    (e, i) => getIslandLevelStatus(e, i, exercises) === "active"
  );
  if (active) return [active.id];
  const next = exercises.find((e) => !e.completed);
  return next ? [next.id] : [];
}
