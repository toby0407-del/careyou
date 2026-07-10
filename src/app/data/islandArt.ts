/** 45° 等角黏土風浮島插畫（Higgsfield 生成，去背 webp） */
export const ISLAND_ART: string[] = [
  "/islands/island1.webp",
  "/islands/island2.webp",
  "/islands/island3.webp",
  "/islands/island4.webp",
  "/islands/island5.webp",
  "/islands/island6.webp",
];

export function islandArtForIndex(index: number): string {
  return ISLAND_ART[index % ISLAND_ART.length];
}
