export type BodyRegion =
  | "neck"
  | "shoulder"
  | "elbow"
  | "wrist"
  | "core"
  | "hip"
  | "knee"
  | "ankle";

export interface PrescriptionExercise {
  id: string;
  name: string;
  nameEn: string;
  setsReps: string;
  difficulty: 1 | 2 | 3;
  region: BodyRegion;
}

export const BODY_REGION_LABELS: Record<BodyRegion, string> = {
  neck: "頸部",
  shoulder: "肩部",
  elbow: "肘部",
  wrist: "手腕",
  core: "腰腹核心",
  hip: "髖部",
  knee: "膝部",
  ankle: "踝部",
};

/** 依《動作.pdf》整理之復健動作庫 */
export const exercisesByRegion: Record<BodyRegion, PrescriptionExercise[]> = {
  neck: [
    { id: "neck-extension-push", name: "後推彈力帶", nameEn: "Neck Extension Push", setsReps: "10～15 次", difficulty: 2, region: "neck" },
    { id: "neck-isometric-lateral-flexion", name: "頸椎等長側彎", nameEn: "Neck Isometric Lateral Flexion", setsReps: "維持 5 秒 × 10 次（每側）", difficulty: 1, region: "neck" },
    { id: "neck-isometric-flexion", name: "頸椎等長前屈", nameEn: "Neck Isometric Flexion", setsReps: "維持 5 秒 × 10 次", difficulty: 1, region: "neck" },
    { id: "neck-isometric-rotation", name: "頸椎等長旋轉", nameEn: "Neck Isometric Rotation", setsReps: "維持 5 秒 × 10 次", difficulty: 1, region: "neck" },
    { id: "chin-tuck", name: "下巴內縮", nameEn: "Chin Tuck", setsReps: "維持 5 秒 × 10 次", difficulty: 1, region: "neck" },
    { id: "neck-rotation", name: "頸部旋轉", nameEn: "Neck Rotation", setsReps: "左右各 10 次", difficulty: 1, region: "neck" },
    { id: "neck-side-stretch", name: "頸部側彎伸展", nameEn: "Neck Side Stretch", setsReps: "維持 15 秒 × 3 組", difficulty: 1, region: "neck" },
  ],
  shoulder: [
    { id: "scapula-squeeze", name: "肩胛骨夾背", nameEn: "Shoulder Blade Squeeze", setsReps: "15 次（每次維持 5 秒）× 2 組", difficulty: 1, region: "shoulder" },
    { id: "shoulder-press", name: "肩推", nameEn: "Shoulder Press", setsReps: "10 次 × 2 組", difficulty: 2, region: "shoulder" },
    { id: "standing-row", name: "站姿划船", nameEn: "Standing Row", setsReps: "每側 10～12 次 × 2 組", difficulty: 2, region: "shoulder" },
    { id: "seated-row", name: "坐姿划船", nameEn: "Seated Row", setsReps: "12～15 次 × 2 組", difficulty: 2, region: "shoulder" },
    { id: "chest-fly", name: "胸部飛鳥", nameEn: "Chest Fly", setsReps: "10～12 次 × 2 組", difficulty: 2, region: "shoulder" },
    { id: "push-up", name: "伏地挺身", nameEn: "Push-up", setsReps: "8～12 次 × 2 組", difficulty: 2, region: "shoulder" },
    { id: "lateral-raise", name: "肩側平舉", nameEn: "Lateral Raise", setsReps: "10～12 次 × 2 組", difficulty: 2, region: "shoulder" },
    { id: "tube-shoulder-abduction", name: "帶套式肩外展", nameEn: "Tube Shoulder Abduction", setsReps: "左右各 10 次 × 2 組", difficulty: 2, region: "shoulder" },
    { id: "standing-external-rotation", name: "站姿雙側肩外旋", nameEn: "Standing External Rotation", setsReps: "12～15 次 × 2 組", difficulty: 2, region: "shoulder" },
    { id: "shoulder-internal-rotation-90", name: "90 度肩內旋", nameEn: "90° Internal Rotation", setsReps: "10 次 × 2 組", difficulty: 2, region: "shoulder" },
    { id: "shrug-retraction", name: "聳肩合併夾背", nameEn: "Shrug with Retraction", setsReps: "15 次 × 2 組", difficulty: 1, region: "shoulder" },
    { id: "mini-band-isometric-abduction", name: "迷你帶雙手等長外展", nameEn: "Mini Band Isometric Abduction", setsReps: "維持 5 秒 × 10～12 次", difficulty: 1, region: "shoulder" },
  ],
  elbow: [
    { id: "bicep-curl", name: "二頭肌彎舉", nameEn: "Bicep Curl", setsReps: "12～15 次 × 2 組", difficulty: 2, region: "elbow" },
    { id: "tricep-extension", name: "彈力帶頸後臂屈伸", nameEn: "Tricep Extension", setsReps: "10～12 次 × 2 組", difficulty: 2, region: "elbow" },
  ],
  wrist: [],
  core: [
    { id: "pelvic-tilt", name: "骨盆前後傾", nameEn: "Pelvic Tilt", setsReps: "15 次", difficulty: 1, region: "core" },
    { id: "seated-cat-cow", name: "坐姿貓牛式", nameEn: "Seated Cat-Cow", setsReps: "10 次", difficulty: 1, region: "core" },
    { id: "seated-side-bend", name: "坐姿側彎", nameEn: "Seated Side Bend", setsReps: "左右各 10 次", difficulty: 1, region: "core" },
    { id: "seated-trunk-rotation", name: "坐姿轉體", nameEn: "Seated Trunk Rotation", setsReps: "左右各 10 次", difficulty: 1, region: "core" },
    { id: "bridge", name: "橋式", nameEn: "Bridge", setsReps: "10 次 × 2 組", difficulty: 2, region: "core" },
    { id: "supine-crunch", name: "仰臥下腹捲腹", nameEn: "Supine Lower Crunch", setsReps: "10～12 次 × 2 組", difficulty: 2, region: "core" },
    { id: "seated-thoracic-extension", name: "坐姿胸椎伸直訓練", nameEn: "Seated Thoracic Extension", setsReps: "12 次 × 2 組", difficulty: 2, region: "core" },
    { id: "seated-thoracic-rotation", name: "坐姿胸椎旋轉訓練", nameEn: "Seated Thoracic Rotation", setsReps: "左右各 10 次 × 2 組", difficulty: 2, region: "core" },
  ],
  hip: [
    { id: "seated-marching", name: "坐姿踏步", nameEn: "Seated Marching", setsReps: "左右各 10 下", difficulty: 1, region: "hip" },
    { id: "sit-to-stand", name: "坐到站", nameEn: "Sit to Stand", setsReps: "10 次", difficulty: 2, region: "hip" },
    { id: "band-squat", name: "彈力帶深蹲", nameEn: "Band Squat", setsReps: "10～12 次 × 2 組", difficulty: 2, region: "hip" },
    { id: "band-lunge", name: "彈力帶弓箭步下蹲", nameEn: "Band Lunge", setsReps: "每側 10 次 × 2 組", difficulty: 3, region: "hip" },
    { id: "standing-hip-abduction-band", name: "站姿彈力帶側抬腿", nameEn: "Standing Hip Abduction", setsReps: "左右各 10～12 次", difficulty: 2, region: "hip" },
    { id: "standing-hip-adduction", name: "站姿髖內收", nameEn: "Standing Hip Adduction", setsReps: "左右各 12 次 × 2 組", difficulty: 2, region: "hip" },
    { id: "standing-hip-extension-kick", name: "站姿髖後伸快速踢", nameEn: "Standing Hip Extension Kick", setsReps: "每側 15 次 × 2 組", difficulty: 2, region: "hip" },
    { id: "standing-hip-flexion-kick", name: "站姿環形帶屈髖前踢", nameEn: "Standing Hip Flexion Kick", setsReps: "左右各 10 次 × 2 組", difficulty: 2, region: "hip" },
    { id: "seated-hip-internal-rotation", name: "坐姿髖內旋", nameEn: "Seated Hip Internal Rotation", setsReps: "12 次 × 2 組", difficulty: 2, region: "hip" },
    { id: "seated-hip-external-rotation", name: "坐姿髖外旋", nameEn: "Seated Hip External Rotation", setsReps: "12 次 × 2 組", difficulty: 2, region: "hip" },
    { id: "clamshell", name: "蚌殼式", nameEn: "Clamshell", setsReps: "10 次 × 2 組（每次維持 15 秒）", difficulty: 2, region: "hip" },
    { id: "standing-hip-abduction", name: "站姿髖外展", nameEn: "Standing Hip Abduction", setsReps: "左右各 10 次", difficulty: 1, region: "hip" },
    { id: "glute-squeeze", name: "臀部夾緊運動", nameEn: "Glute Squeeze", setsReps: "10 次（每次維持 5 秒）", difficulty: 1, region: "hip" },
  ],
  knee: [
    { id: "long-arc-quad", name: "坐姿膝伸直", nameEn: "Long Arc Quad", setsReps: "10 次 × 2 組", difficulty: 1, region: "knee" },
    { id: "tke", name: "終端膝伸直訓練（TKE）", nameEn: "Terminal Knee Extension", setsReps: "15 次 × 2 組（伸直維持 2 秒）", difficulty: 2, region: "knee" },
  ],
  ankle: [
    { id: "chair-calf-raise", name: "扶椅提踵", nameEn: "Chair Calf Raise", setsReps: "15 次", difficulty: 1, region: "ankle" },
    { id: "band-calf-raise", name: "彈力帶提踵", nameEn: "Band Calf Raise", setsReps: "15～20 次 × 2 組", difficulty: 2, region: "ankle" },
    { id: "seated-ankle-inversion-self", name: "坐姿自主腳踝內翻", nameEn: "Seated Ankle Inversion", setsReps: "12～15 次 × 2 組", difficulty: 2, region: "ankle" },
    { id: "seated-ankle-inversion-fixed", name: "坐姿低位固定腳踝內翻", nameEn: "Fixed Ankle Inversion", setsReps: "15 次 × 2 組", difficulty: 2, region: "ankle" },
    { id: "seated-ankle-eversion-fixed", name: "坐姿低位固定腳踝外翻", nameEn: "Fixed Ankle Eversion", setsReps: "15 次 × 2 組", difficulty: 2, region: "ankle" },
    { id: "seated-ankle-eversion-resisted", name: "坐姿雙腳對抗外翻", nameEn: "Resisted Ankle Eversion", setsReps: "12～15 次 × 2 組", difficulty: 2, region: "ankle" },
    { id: "seated-plantarflexion", name: "坐姿足底蹠屈", nameEn: "Seated Plantarflexion", setsReps: "15～20 次 × 2 組", difficulty: 2, region: "ankle" },
    { id: "seated-dorsiflexion", name: "坐姿踝背屈", nameEn: "Seated Dorsiflexion", setsReps: "12～15 次 × 2 組", difficulty: 2, region: "ankle" },
  ],
};

export const ALL_PRESCRIPTION_EXERCISES = Object.values(exercisesByRegion).flat();

export function getExerciseLabel(ex: PrescriptionExercise) {
  return `${ex.name} (${ex.nameEn})`;
}
