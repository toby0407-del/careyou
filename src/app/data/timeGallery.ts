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

export const BASE_GALLERY_PHOTOS: GalleryPhoto[] = [
  {
    id: "p1",
    category: "training",
    date: "2026-06-15",
    title: "第一次膝關節訓練",
    caption: "在客廳完成第一次復健，雖然有點累但很有成就感！",
    location: "家中客廳",
    imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=400&fit=crop",
    tags: ["膝關節", "首訓"],
  },
  {
    id: "p2",
    category: "family",
    date: "2026-06-18",
    title: "女兒陪我練習",
    caption: "小芳下班後專程回來陪我一起做橋式運動，心裡暖暖的。",
    location: "家中臥室",
    imageUrl: "https://images.unsplash.com/photo-1516307365426-bea5f780b4ad?w=600&h=400&fit=crop",
    tags: ["家屬陪伴", "橋式運動"],
  },
  {
    id: "p3",
    category: "celebration",
    date: "2026-06-20",
    title: "連續訓練 7 天！",
    caption: "達成一週不間斷訓練，全家一起慶祝吃了我最愛的滷肉飯。",
    imageUrl: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&h=400&fit=crop",
    tags: ["里程碑", "7天"],
  },
  {
    id: "p4",
    category: "training",
    date: "2026-06-22",
    title: "公園晨間復健",
    caption: "天氣很好，到附近公園散步兼做踝關節運動。",
    location: "大安森林公園",
    imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=400&fit=crop",
    tags: ["戶外", "踝關節"],
  },
  {
    id: "p5",
    category: "progress",
    date: "2026-06-25",
    title: "膝關節角度進步",
    caption: "醫師說我的膝關節活動度比上個月進步了 12 度，繼續加油！",
    imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&h=400&fit=crop",
    tags: ["進步", "膝關節"],
  },
  {
    id: "p6",
    category: "family",
    date: "2026-06-28",
    title: "孫子放學後的探望",
    caption: "小寶放學後跑來看我訓練，還幫我數做了幾下。",
    location: "家中",
    imageUrl: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&h=400&fit=crop",
    tags: ["孫子", "陪伴"],
  },
  {
    id: "p7",
    category: "celebration",
    date: "2026-06-30",
    title: "首關三星通關",
    caption: "膝關節屈伸拿到滿分三顆星，護理師說我是模範病患！",
    imageUrl: "https://images.unsplash.com/photo-1529156069898-ec499b0dfa28?w=600&h=400&fit=crop",
    tags: ["三星", "通關"],
  },
  {
    id: "p8",
    category: "training",
    date: "2026-07-01",
    title: "今日訓練打卡",
    caption: "七月的第一天，繼續保持！已完成手腕屈伸訓練。",
    imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=400&fit=crop",
    tags: ["今日", "手腕"],
  },
];

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
