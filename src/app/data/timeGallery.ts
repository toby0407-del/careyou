import { shiftIsoDate } from "../lib/mockTime";

export type GalleryCategory = "training" | "family" | "celebration" | "progress";

export interface GalleryPhoto {
  id: string;
  category: GalleryCategory;
  date: string;
  title: string;
  caption: string;
  location?: string;
  imageUrl: string;
  tags: string[];
  syncedAt?: string;
}

export const GALLERY_STORAGE_KEY = "rehabbridge-time-gallery";

export const galleryCategories: { id: GalleryCategory; label: string; emoji: string }[] = [
  { id: "training", label: "訓練瞬間", emoji: "💪" },
  { id: "family", label: "與家人", emoji: "👨‍👩‍👧" },
  { id: "celebration", label: "慶祝時刻", emoji: "🎉" },
  { id: "progress", label: "進步對比", emoji: "📈" },
];

const G = (file: string) => `/assets/gallery/${file}?v=2`;

/**
 * 時光迴廊回憶錄 — 旅行友情合照
 * 順序對應今日關卡解鎖牆：完成第 N 關解鎖前 N 張
 */
export const BASE_GALLERY_PHOTOS: GalleryPhoto[] = [
  {
    id: "m1",
    category: "celebration",
    date: "2026-07-15",
    title: "粉紅機場合影",
    caption: "Hello Kitty 粉紅牆前五人自拍，旅途開始前先把笑容存起來。",
    location: "機場・Hello Kitty 主題區",
    imageUrl: G("memoir-01.jpg"),
    tags: ["機場", "友情", "自拍"],
  },
  {
    id: "m2",
    category: "celebration",
    date: "2026-07-14",
    title: "伏見稻荷的友情",
    caption: "穿過朱紅色鳥居，和夥伴們拍下這張，提醒自己復健路也要一步一步走。",
    location: "京都・伏見稻荷大社",
    imageUrl: G("memoir-02.jpg"),
    tags: ["京都", "友情", "旅行"],
  },
  {
    id: "m3",
    category: "family",
    date: "2026-07-13",
    title: "鑽石山合影",
    caption: "夕陽下的海邊風景，大家擠在一起笑，比練完一組還開心。",
    location: "夏威夷・鑽石山",
    imageUrl: G("memoir-03.jpg"),
    tags: ["夏威夷", "夕陽", "合照"],
  },
  {
    id: "m4",
    category: "celebration",
    date: "2026-07-12",
    title: "巴黎書店午後",
    caption: "在莎士比亞書店前翻書聊天，是這趟旅程裡最輕鬆的一刻。",
    location: "巴黎・Shakespeare and Company",
    imageUrl: G("memoir-04.jpg"),
    tags: ["巴黎", "書店", "午後"],
  },
  {
    id: "m5",
    category: "celebration",
    date: "2026-07-11",
    title: "海上乾杯",
    caption: "金色夕陽裡對瓶乾杯，慶祝彼此都勇敢出發。",
    location: "海上・夕陽船",
    imageUrl: G("memoir-05.jpg"),
    tags: ["夕陽", "干杯", "友情"],
  },
  {
    id: "m6",
    category: "progress",
    date: "2026-07-10",
    title: "光之森林",
    caption: "踩進水面與光點之間，像走進一幅畫，療癒滿滿。",
    location: "互動光影展",
    imageUrl: G("memoir-06.jpg"),
    tags: ["光影", "藝術", "療癒"],
  },
].map((photo) => ({
  ...photo,
  date: shiftIsoDate(photo.date),
}));

/** @deprecated use loadGalleryPhotos */
export const galleryPhotos = BASE_GALLERY_PHOTOS;

export function loadGalleryPhotos(): GalleryPhoto[] {
  try {
    const stored = localStorage.getItem(GALLERY_STORAGE_KEY);
    const dynamic: GalleryPhoto[] = stored ? JSON.parse(stored) : [];
    // 內建回憶保持穩定順序（對應關卡解鎖牆），上傳照片追加在後
    const merged = [...BASE_GALLERY_PHOTOS];
    for (const photo of dynamic) {
      if (!merged.some((p) => p.id === photo.id)) merged.push(photo);
    }
    return merged;
  } catch {
    return [...BASE_GALLERY_PHOTOS];
  }
}

export function appendGalleryPhoto(photo: Omit<GalleryPhoto, "id" | "syncedAt">): GalleryPhoto {
  const stored: GalleryPhoto[] = JSON.parse(localStorage.getItem(GALLERY_STORAGE_KEY) || "[]");
  const newPhoto: GalleryPhoto = {
    ...photo,
    id: `photo-${Date.now()}`,
    syncedAt: new Date().toISOString(),
  };
  localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify([...stored, newPhoto]));
  window.dispatchEvent(new Event("time-gallery-updated"));
  return newPhoto;
}

/** 移除使用者上傳的照片（內建示範照片不能刪） */
export function removeGalleryPhoto(id: string) {
  const stored: GalleryPhoto[] = JSON.parse(localStorage.getItem(GALLERY_STORAGE_KEY) || "[]");
  localStorage.setItem(
    GALLERY_STORAGE_KEY,
    JSON.stringify(stored.filter((p) => p.id !== id))
  );
  window.dispatchEvent(new Event("time-gallery-updated"));
}

export function isUploadedPhoto(photo: GalleryPhoto): boolean {
  return photo.imageUrl.startsWith("data:");
}

/** Group photos by year-month for timeline */
export function groupPhotosByMonth(photos: GalleryPhoto[]) {
  const groups: Record<string, GalleryPhoto[]> = {};
  for (const photo of photos) {
    const key = photo.date.slice(0, 7);
    if (!groups[key]) groups[key] = [];
    groups[key].push(photo);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, items]) => ({
      month,
      label: formatMonth(month),
      photos: items.sort((a, b) => b.date.localeCompare(a.date)),
    }));
}

function formatMonth(ym: string) {
  const [y, m] = ym.split("-");
  return `${y} 年 ${parseInt(m)} 月`;
}
