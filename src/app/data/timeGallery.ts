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

const G = (file: string) => `/assets/gallery/${file}`;

/** 內建照片池 — 本地圖檔（Unsplash / Pexels 免費圖） */
export const BASE_GALLERY_PHOTOS: GalleryPhoto[] = [
  {
    id: "p1",
    category: "training",
    date: "2026-06-12",
    title: "第一次膝關節訓練",
    caption: "在客廳完成第一次復健，雖然有點累但很有成就感！",
    location: "家中客廳",
    imageUrl: G("g01-training-knee.jpg"),
    tags: ["膝關節", "首訓"],
  },
  {
    id: "p2",
    category: "family",
    date: "2026-06-14",
    title: "黃昏時分的家人",
    caption: "小芳陪我到陽台看夕陽，說慢慢來也會變好。",
    location: "家中陽台",
    imageUrl: G("g02-family-care.jpg"),
    tags: ["家屬陪伴"],
  },
  {
    id: "p3",
    category: "celebration",
    date: "2026-06-16",
    title: "連續訓練 7 天！",
    caption: "達成一週不間斷訓練，全家一起慶祝。",
    imageUrl: G("g03-celebration.jpg"),
    tags: ["里程碑", "7天"],
  },
  {
    id: "p4",
    category: "training",
    date: "2026-06-18",
    title: "公園晨間復健",
    caption: "天氣很好，到附近公園散步兼做踝關節運動。",
    location: "大安森林公園",
    imageUrl: G("g04-park-walk.jpg"),
    tags: ["戶外", "散步"],
  },
  {
    id: "p5",
    category: "progress",
    date: "2026-06-20",
    title: "回診進步檢查",
    caption: "醫師說膝關節活動度比上個月進步了，繼續加油！",
    location: "復健科門診",
    imageUrl: G("g05-doctor-progress.jpg"),
    tags: ["進步", "回診"],
  },
  {
    id: "p6",
    category: "family",
    date: "2026-06-22",
    title: "孫子放學後的探望",
    caption: "小寶放學後跑來看我訓練，還幫我數做了幾下。",
    location: "家中",
    imageUrl: G("g06-grandchild.jpg"),
    tags: ["孫子", "陪伴"],
  },
  {
    id: "p7",
    category: "training",
    date: "2026-06-24",
    title: "橋式運動練習",
    caption: "核心穩定越來越好，橋式可以撐更久了。",
    location: "家中臥室",
    imageUrl: G("g07-bridge-exercise.jpg"),
    tags: ["橋式運動", "核心"],
  },
  {
    id: "p8",
    category: "family",
    date: "2026-06-25",
    title: "週末公園時光",
    caption: "女兒推著輪椅陪我在公園曬太陽，心裡暖暖的。",
    location: "河濱公園",
    imageUrl: G("g08-family-park.jpg"),
    tags: ["週末", "公園"],
  },
  {
    id: "p9",
    category: "training",
    date: "2026-06-26",
    title: "肩關節外展訓練",
    caption: "今天肩關節角度又進步一點，動作更穩定了。",
    imageUrl: G("g10-shoulder.jpg"),
    tags: ["肩關節"],
  },
  {
    id: "p10",
    category: "training",
    date: "2026-06-27",
    title: "復健中心伸展",
    caption: "在復健中心跟治療師一起做伸展，身體鬆了很多。",
    location: "復健中心",
    imageUrl: G("g11-stretch.jpg"),
    tags: ["伸展", "治療師"],
  },
  {
    id: "p11",
    category: "family",
    date: "2026-06-28",
    title: "母女一起散步",
    caption: "慢慢走、慢慢聊，復健路上不孤單。",
    imageUrl: G("g12-family-walk.jpg"),
    tags: ["散步", "母女"],
  },
  {
    id: "p12",
    category: "progress",
    date: "2026-06-29",
    title: "能走更遠的路了",
    caption: "上週還只能走五分鐘，今天撐了二十分鐘！",
    location: "山間步道",
    imageUrl: G("g13-outdoor-trail.jpg"),
    tags: ["耐力", "戶外"],
  },
  {
    id: "p13",
    category: "celebration",
    date: "2026-06-30",
    title: "首關三星通關",
    caption: "膝關節屈伸拿到滿分三顆星，護理師說我是模範病患！",
    imageUrl: G("g14-hands-together.jpg"),
    tags: ["三星", "通關"],
  },
  {
    id: "p14",
    category: "training",
    date: "2026-07-01",
    title: "居家伸展放鬆",
    caption: "七月的第一天，做完伸展覺得全身都醒了。",
    location: "家中",
    imageUrl: G("g15-wellness.jpg"),
    tags: ["伸展", "居家"],
  },
  {
    id: "p15",
    category: "family",
    date: "2026-07-02",
    title: "牽手扶持",
    caption: "復健不只是身體，家人的手是最大的力量。",
    imageUrl: G("g16-care-hands.jpg"),
    tags: ["扶持", "溫暖"],
  },
  {
    id: "p16",
    category: "celebration",
    date: "2026-07-03",
    title: "笑著迎接進步",
    caption: "每次小小進步都值得開心一下。",
    imageUrl: G("g17-smile.jpg"),
    tags: ["微笑", "鼓勵"],
  },
  {
    id: "p17",
    category: "progress",
    date: "2026-07-04",
    title: "步伐越來越穩",
    caption: "醫師說步態改善很多，可以試著少依賴助行器。",
    imageUrl: G("g18-walking.jpg"),
    tags: ["步態", "行走"],
  },
  {
    id: "p18",
    category: "celebration",
    date: "2026-07-05",
    title: "家人團聚",
    caption: "訓練完大家圍在一起，為這一週的努力乾杯。",
    imageUrl: G("g19-party.jpg"),
    tags: ["團聚"],
  },
  {
    id: "p19",
    category: "celebration",
    date: "2026-07-06",
    title: "健康餐慶祝",
    caption: "完成階段目標，吃一頓營養滿滿的慶祝餐。",
    imageUrl: G("g20-meal.jpg"),
    tags: ["飲食", "慶祝"],
  },
  {
    id: "p20",
    category: "family",
    date: "2026-07-07",
    title: "三代同堂",
    caption: "孫女週末回來，一家人在一起的時光最珍貴。",
    location: "家中客廳",
    imageUrl: G("g21-asian-family.jpg"),
    tags: ["三代同堂"],
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
    const merged = [...BASE_GALLERY_PHOTOS];
    for (const photo of dynamic) {
      if (!merged.some((p) => p.id === photo.id)) merged.push(photo);
    }
    return merged.sort((a, b) => b.date.localeCompare(a.date));
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
