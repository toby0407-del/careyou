import { useState, useEffect, useCallback } from "react";
import { loadGalleryPhotos, appendGalleryPhoto, type GalleryPhoto } from "../data/timeGallery";

export function useTimeGallery() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>(loadGalleryPhotos);

  const refresh = useCallback(() => {
    setPhotos(loadGalleryPhotos());
  }, []);

  useEffect(() => {
    const onUpdate = () => refresh();
    window.addEventListener("time-gallery-updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("time-gallery-updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [refresh]);

  const appendPhoto = useCallback(
    (photo: Omit<GalleryPhoto, "id" | "syncedAt">) => {
      const created = appendGalleryPhoto(photo);
      refresh();
      return created;
    },
    [refresh]
  );

  return { photos, appendPhoto, refresh };
}
