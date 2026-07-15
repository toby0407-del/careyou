/** 今日照片解鎖牆 — 回憶錄順序對應關卡，每完成一關解鎖一張 */
import { useMemo, useSyncExternalStore } from "react";
import { loadGalleryPhotos, type GalleryPhoto } from "../data/timeGallery";
import { getLiveExercises, subscribeProgress, todayStr } from "../data/progressStore";

function subscribeGallery(listener: () => void) {
  const onUpdate = () => listener();
  window.addEventListener("time-gallery-updated", onUpdate);
  return () => window.removeEventListener("time-gallery-updated", onUpdate);
}

export interface DailyRevealSlot {
  photo: GalleryPhoto;
  levelNo: number;
  levelName: string;
  levelId: string;
  unlocked: boolean;
}

export function useDailyReveal() {
  const version = useSyncExternalStore(
    (listener) => {
      const unsubProgress = subscribeProgress(listener);
      const unsubGallery = subscribeGallery(listener);
      return () => {
        unsubProgress();
        unsubGallery();
      };
    },
    () => {
      const today = todayStr();
      return `${today}-${localStorage.getItem("rehabbridge-time-gallery")?.length ?? 0}-${getLiveExercises().filter((e) => e.completed).length}`;
    }
  );

  return useMemo(() => {
    void version;
    const today = todayStr();
    const exercises = getLiveExercises();
    const photos = loadGalleryPhotos();
    const unlockedCount = exercises.filter((e) => e.completed).length;
    const total = exercises.length;

    // 依回憶錄順序對應關卡：第 1 關→第 1 張，已完成前 N 關即解鎖前 N 張
    const wallPhotos =
      photos.length > 0 ? photos.slice(0, total) : [];

    const slots: DailyRevealSlot[] = exercises.map((ex, i) => ({
      photo: wallPhotos[i] ?? {
        id: `placeholder-${i}`,
        category: "family" as const,
        date: today,
        title: "等待上傳的回憶",
        caption: "上傳照片後，完成關卡就能在這裡解鎖看清！",
        imageUrl: "",
        tags: ["待上傳"],
      },
      levelNo: i + 1,
      levelName: ex.name,
      levelId: ex.id,
      unlocked: i < unlockedCount,
    }));

    return {
      today,
      slots,
      unlockedCount,
      total,
      photoPoolSize: photos.length,
      hasPhotos: photos.length > 0,
    };
  }, [version]);
}
