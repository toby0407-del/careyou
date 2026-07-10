/** 45° 等角黏土風浮島插畫（Higgsfield 生成，去背 webp） */

export interface IslandDef {
  id: string;
  name: string;
  sublabel: string;
  artUrl: string;
}

export const ISLANDS: IslandDef[] = [
  {
    id: "lantern-hill",
    name: "啟航燈丘",
    sublabel: "復健旅程的起點",
    artUrl: "/islands/island1.webp",
  },
  {
    id: "millstream",
    name: "水車溪谷",
    sublabel: "流水與節奏同行",
    artUrl: "/islands/island2.webp",
  },
  {
    id: "twin-springs",
    name: "雙泉橋嶼",
    sublabel: "穩步跨越每一關",
    artUrl: "/islands/island3.webp",
  },
  {
    id: "zen-terrace",
    name: "禪石台地",
    sublabel: "沉靜專注的修煉場",
    artUrl: "/islands/island4.webp",
  },
  {
    id: "lighthouse-cliff",
    name: "燈塔崖岸",
    sublabel: "為你指引前進方向",
    artUrl: "/islands/island5.webp",
  },
  {
    id: "windmill-rise",
    name: "風車之丘",
    sublabel: "迎風挑戰最終關",
    artUrl: "/islands/island6.webp",
  },
];

/** @deprecated 改用 ISLANDS；保留相容舊呼叫 */
export const ISLAND_ART: string[] = ISLANDS.map((island) => island.artUrl);

export function islandArtForIndex(index: number): string {
  return ISLANDS[index % ISLANDS.length].artUrl;
}

export function islandDefForIndex(index: number): IslandDef {
  return ISLANDS[index % ISLANDS.length];
}
