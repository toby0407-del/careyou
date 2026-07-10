/**
 * 患者端關卡選擇 — 3D 浮島轉盤場景（Three.js）
 * 呈現方式參考 LevelSelect3D：環形轉盤、拖曳慣性 + 吸附、漂浮動畫、聚焦放大
 * 純場景模組（不含 React），由 IslandCarousel3D 元件負責掛載與銷毀
 */
import * as THREE from "three";

export type CarouselStatus = "locked" | "active" | "completed";

export interface CarouselIslandInput {
  /** 島嶼插畫（去背 webp） */
  artUrl: string;
  status: CarouselStatus;
  /** 分類主色（如 #14b8a6） */
  accent: string;
}

export interface CarouselOptions {
  initialIndex: number;
  reducedMotion: boolean;
  onActiveChange: (index: number) => void;
  onIslandTap: (index: number, isFocused: boolean) => void;
}

export interface CarouselHandle {
  goTo(index: number): void;
  step(dir: 1 | -1): void;
  dispose(): void;
}

const ART_WIDTH = 3.2;
const DRAG_SENSITIVITY = 0.006;
const TAP_MAX_MOVE = 8;
const FOG_COLOR = 0xdcf5ee;
const BG_RADIUS = 19;
const BG_HEIGHT = 26;
/** 背景相對轉盤的視差比例（越小越遠） */
const BG_PARALLAX = 0.45;

function makeGlowSprite(accent: string): THREE.Sprite {
  const size = 256;
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const ctx = cv.getContext("2d")!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 10, size / 2, size / 2, size / 2);
  const c = new THREE.Color(accent);
  grad.addColorStop(0, `rgba(${(c.r * 255) | 0},${(c.g * 255) | 0},${(c.b * 255) | 0},0.55)`);
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(cv);
  const spr = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })
  );
  spr.scale.set(4.4, 4.4, 1);
  spr.renderOrder = -1;
  return spr;
}

/** 無縫環景貼圖：天空漸層 + 太陽 + 遠山 + 海面 + 白雲（左右邊界可銜接） */
function makePanoramaTexture(): THREE.CanvasTexture {
  const W = 2048;
  const H = 512;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d")!;

  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#addcff");
  sky.addColorStop(0.55, "#dcf4ee");
  sky.addColorStop(1, "#f2fdf6");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // 太陽（僅一顆，位置避開左右接縫）
  const sun = ctx.createRadialGradient(W * 0.7, H * 0.26, 8, W * 0.7, H * 0.26, 130);
  sun.addColorStop(0, "rgba(255,246,214,0.95)");
  sun.addColorStop(0.35, "rgba(255,238,180,0.5)");
  sun.addColorStop(1, "rgba(255,238,180,0)");
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, W, H);

  // 遠山輪廓 — 以整數週期正弦疊加，保證左右無縫
  const drawHills = (base: number, waves: [number, number, number][], color: string) => {
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) {
      const u = (x / W) * Math.PI * 2;
      let y = base;
      for (const [freq, amp, phase] of waves) y += Math.sin(u * freq + phase) * amp;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };
  drawHills(H * 0.62, [[2, 18, 0.8], [5, 10, 2.1], [9, 5, 4.4]], "rgba(148,208,196,0.5)");
  drawHills(H * 0.72, [[3, 22, 3.9], [7, 9, 1.2], [11, 4, 5.3]], "rgba(110,190,172,0.55)");

  // 海面
  const sea = ctx.createLinearGradient(0, H * 0.8, 0, H);
  sea.addColorStop(0, "rgba(153,220,214,0.65)");
  sea.addColorStop(1, "rgba(210,244,238,0.9)");
  ctx.fillStyle = sea;
  ctx.fillRect(0, H * 0.8, W, H * 0.2);

  // 白雲（位置避開接縫）
  const puff = (x: number, y: number, r: number, alpha: number) => {
    const g = ctx.createRadialGradient(x, y, r * 0.15, x, y, r);
    g.addColorStop(0, `rgba(255,255,255,${alpha})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  const cloudSpecs: [number, number, number][] = [
    [0.12, 0.2, 46], [0.18, 0.24, 34], [0.34, 0.14, 40], [0.4, 0.17, 30],
    [0.55, 0.3, 38], [0.6, 0.26, 30], [0.82, 0.16, 44], [0.88, 0.2, 32],
  ];
  for (const [ux, uy, r] of cloudSpecs) {
    puff(W * ux, H * uy, r, 0.85);
    puff(W * ux + r * 0.9, H * uy + 6, r * 0.75, 0.7);
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

/** 鎖定島嶼 → 灰階版材質貼圖；環境不支援 canvas filter 時回傳 null（改用色調變暗） */
function toGrayscaleTexture(image: HTMLImageElement): THREE.Texture | null {
  const cv = document.createElement("canvas");
  cv.width = image.naturalWidth;
  cv.height = image.naturalHeight;
  const ctx = cv.getContext("2d");
  if (!ctx || typeof ctx.filter !== "string") return null;
  ctx.filter = "grayscale(0.9) brightness(0.82)";
  ctx.drawImage(image, 0, 0);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

interface IslandRuntime {
  group: THREE.Group;
  artSprite: THREE.Sprite;
  glow: THREE.Sprite | null;
  debris: THREE.Mesh[];
  phase: number;
}

function buildIsland(
  input: CarouselIslandInput,
  index: number,
  loader: THREE.TextureLoader
): IslandRuntime {
  const group = new THREE.Group();
  const locked = input.status === "locked";

  const artSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ transparent: true, depthWrite: false, opacity: 0 })
  );
  artSprite.position.y = 0.35;
  artSprite.scale.set(ART_WIDTH, ART_WIDTH, 1);
  artSprite.userData.islandIndex = index;
  group.add(artSprite);

  loader.load(input.artUrl, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    const img = tex.image as HTMLImageElement;
    const aspect = img.naturalHeight / img.naturalWidth || 1;
    const mat = artSprite.material;
    if (locked) {
      const gray = toGrayscaleTexture(img);
      if (gray) {
        mat.map = gray;
        tex.dispose();
      } else {
        mat.map = tex;
        mat.color.set(0x8f9aa5);
      }
    } else {
      mat.map = tex;
    }
    mat.opacity = 1;
    mat.needsUpdate = true;
    artSprite.scale.set(ART_WIDTH, ART_WIDTH * aspect, 1);
  });

  let glow: THREE.Sprite | null = null;
  if (input.status === "active") {
    glow = makeGlowSprite(input.accent);
    glow.position.y = 0.35;
    group.add(glow);
  }

  // 環繞的漂浮碎石（鎖定關卡使用灰色）
  const debris: THREE.Mesh[] = [];
  const debrisColor = locked ? new THREE.Color(0x9aa3ad) : new THREE.Color(input.accent);
  const rng = (a: number, b: number) => a + Math.random() * (b - a);
  for (let i = 0; i < 4; i++) {
    const mesh = new THREE.Mesh(
      new THREE.DodecahedronGeometry(rng(0.08, 0.17), 0),
      new THREE.MeshStandardMaterial({ color: debrisColor, roughness: 0.6, flatShading: true })
    );
    mesh.userData = {
      a: rng(0, Math.PI * 2),
      r: rng(1.9, 2.4),
      y: rng(-0.5, 0.7),
      sp: rng(0.2, 0.5),
      ph: rng(0, 6),
    };
    debris.push(mesh);
    group.add(mesh);
  }

  return { group, artSprite, glow, debris, phase: index * 1.7 };
}

export function createIslandCarousel(
  mount: HTMLElement,
  islands: CarouselIslandInput[],
  options: CarouselOptions
): CarouselHandle {
  const n = islands.length;
  const step = (Math.PI * 2) / n;
  const radius = Math.max(4.8, (n * 5.6) / (Math.PI * 2));
  const camZ = radius + 5.4;
  const { reducedMotion } = options;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(Math.max(1, mount.clientWidth), Math.max(1, mount.clientHeight));
  renderer.setClearColor(0x000000, 0);
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(FOG_COLOR, camZ - 1.5, camZ + radius + 4.5);

  const camera = new THREE.PerspectiveCamera(
    48,
    Math.max(1, mount.clientWidth) / Math.max(1, mount.clientHeight),
    0.1,
    100
  );
  camera.position.set(0, 2.35, camZ);
  camera.lookAt(0, 0.55, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x9adfd2, 1.0));
  const sun = new THREE.DirectionalLight(0xfff2d9, 1.0);
  sun.position.set(5, 8, 6);
  scene.add(sun);

  // 環景背景（圓柱內壁貼無縫全景，隨拖曳以視差旋轉）
  const background = new THREE.Mesh(
    new THREE.CylinderGeometry(BG_RADIUS, BG_RADIUS, BG_HEIGHT, 48, 1, true),
    new THREE.MeshBasicMaterial({
      map: makePanoramaTexture(),
      side: THREE.BackSide,
      fog: false,
    })
  );
  background.position.y = 2;
  scene.add(background);

  const loader = new THREE.TextureLoader();
  const carousel = new THREE.Group();
  const runtimes = islands.map((input, i) => {
    const rt = buildIsland(input, i, loader);
    const a = i * step;
    rt.group.position.set(Math.sin(a) * radius, 0, Math.cos(a) * radius);
    carousel.add(rt.group);
    return rt;
  });
  scene.add(carousel);

  const artSprites = runtimes.map((rt) => rt.artSprite);

  // ── 拖曳控制（慣性 + 吸附）＋ 點擊偵測 ──
  const ctrl = { target: -options.initialIndex * step };
  let rot = ctrl.target;
  let dragging = false;
  let moved = false;
  let lastX = 0;
  let startX = 0;
  let vel = 0;
  let lastActive = -1;

  const el = renderer.domElement;
  el.style.touchAction = "none";
  el.style.cursor = "grab";

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  const activeFromTarget = () => ((Math.round(-ctrl.target / step) % n) + n) % n;

  function pickIsland(e: PointerEvent): number | null {
    const rect = el.getBoundingClientRect();
    ndc.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(artSprites, false)[0];
    return hit ? (hit.object.userData.islandIndex as number) : null;
  }

  const down = (e: PointerEvent) => {
    dragging = true;
    moved = false;
    lastX = startX = e.clientX;
    vel = 0;
    el.style.cursor = "grabbing";
    el.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    if (Math.abs(e.clientX - startX) > TAP_MAX_MOVE) moved = true;
    ctrl.target += dx * DRAG_SENSITIVITY;
    vel = dx * DRAG_SENSITIVITY;
  };
  const up = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    el.style.cursor = "grab";
    if (!moved) {
      ctrl.target = Math.round(ctrl.target / step) * step;
      const idx = pickIsland(e);
      if (idx !== null) options.onIslandTap(idx, idx === activeFromTarget());
      return;
    }
    ctrl.target += vel * 14; // 慣性甩動
    ctrl.target = Math.round(ctrl.target / step) * step; // 吸附到最近島嶼
  };
  el.addEventListener("pointerdown", down);
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerup", up);
  el.addEventListener("pointercancel", up);

  const resizeObserver = new ResizeObserver(() => {
    const w = Math.max(1, mount.clientWidth);
    const h = Math.max(1, mount.clientHeight);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
  resizeObserver.observe(mount);

  // ── 動畫迴圈 ──
  let raf = 0;
  const clock = new THREE.Clock();
  const targetScale = new THREE.Vector3();

  const animate = () => {
    raf = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    rot += (ctrl.target - rot) * 0.075; // 平滑趨近 → 切換過場
    carousel.rotation.y = rot;
    background.rotation.y = rot * BG_PARALLAX; // 背景隨滑動轉動（視差）

    const idx = activeFromTarget();
    if (idx !== lastActive) {
      lastActive = idx;
      options.onActiveChange(idx);
    }

    runtimes.forEach((rt, i) => {
      rt.group.position.y = reducedMotion ? 0 : Math.sin(t * 0.9 + rt.phase) * 0.2;
      const s = i === idx ? 1.16 : 0.9; // 聚焦放大
      targetScale.set(s, s, s);
      rt.group.scale.lerp(targetScale, 0.08);

      if (rt.glow) {
        rt.glow.material.opacity = reducedMotion ? 0.45 : 0.35 + 0.25 * Math.sin(t * 2.4);
      }
      rt.debris.forEach((d) => {
        const u = d.userData as { a: number; r: number; y: number; sp: number; ph: number };
        const time = reducedMotion ? 0 : t;
        d.position.set(
          Math.cos(u.a + time * u.sp) * u.r,
          u.y + Math.sin(time + u.ph) * 0.22,
          Math.sin(u.a + time * u.sp) * u.r
        );
        if (!reducedMotion) d.rotation.x = d.rotation.y += 0.01;
      });
    });

    if (!reducedMotion) {
      camera.position.y = 2.35 + Math.sin(t * 0.5) * 0.07; // 微幅呼吸感
    }
    renderer.render(scene, camera);
  };
  animate();

  return {
    goTo(index: number) {
      const base = -index * step;
      const k = Math.round((ctrl.target - base) / (Math.PI * 2));
      ctrl.target = base + k * Math.PI * 2;
    },
    step(dir: 1 | -1) {
      ctrl.target = (Math.round(ctrl.target / step) - dir) * step;
    },
    dispose() {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const material = (obj as THREE.Mesh).material as THREE.Material & {
          map?: THREE.Texture | null;
        };
        if (material) {
          if (material.map) material.map.dispose();
          material.dispose();
        }
      });
      renderer.dispose();
      if (el.parentElement === mount) mount.removeChild(el);
    },
  };
}
