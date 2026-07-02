export interface PatientProfile {
  id: string;
  name: string;
  gender: "男" | "女";
  age: number;
  heightCm: number;
  weightKg: number;
  bloodType: string;
  medicalRecordNo: string;
  department: string;
  attendingPhysician: string;
  diagnosis: string;
  rehabPhase: string;
  /** 住址單行顯示 */
  address: string;
  phone: string;
  emergencyContact: string;
  allergies?: string;
}

export const PATIENT_PROFILES: Record<string, PatientProfile> = {
  p1: {
    id: "p1",
    name: "王大明",
    gender: "男",
    age: 65,
    heightCm: 172,
    weightKg: 78,
    bloodType: "A",
    medicalRecordNo: "RB-2024-00821",
    department: "骨科復健科",
    attendingPhysician: "陳建宏 醫師",
    diagnosis: "右膝關節置換術後",
    rehabPhase: "第二期功能強化",
    address: "台北市大安區復興南路一段 390 號 8 樓",
    phone: "0912-345-678",
    emergencyContact: "王小美（女兒）0918-111-222",
    allergies: "青黴素過敏",
  },
  p2: {
    id: "p2",
    name: "李淑芬",
    gender: "女",
    age: 58,
    heightCm: 158,
    weightKg: 62,
    bloodType: "O",
    medicalRecordNo: "RB-2024-00654",
    department: "復健醫學科",
    attendingPhysician: "林雅婷 醫師",
    diagnosis: "腰椎間盤突出",
    rehabPhase: "第一期疼痛控制",
    address: "新北市板橋區文化路二段 182 號 5 樓",
    phone: "0923-456-789",
    emergencyContact: "李志明（配偶）0933-222-333",
  },
  p3: {
    id: "p3",
    name: "張文彬",
    gender: "男",
    age: 72,
    heightCm: 168,
    weightKg: 70,
    bloodType: "B",
    medicalRecordNo: "RB-2023-01203",
    department: "神經復健科",
    attendingPhysician: "陳建宏 醫師",
    diagnosis: "中風後左側肢體復健",
    rehabPhase: "第三期社區整合",
    address: "桃園市中壢區中正路 1200 號 3 樓",
    phone: "0934-567-890",
    emergencyContact: "張美華（女兒）0955-444-555",
    allergies: "磺胺類藥物",
  },
  p4: {
    id: "p4",
    name: "陳美玲",
    gender: "女",
    age: 44,
    heightCm: 163,
    weightKg: 55,
    bloodType: "AB",
    medicalRecordNo: "RB-2025-00112",
    department: "運動醫學科",
    attendingPhysician: "黃俊豪 醫師",
    diagnosis: "右肩袖撕裂修復術後",
    rehabPhase: "第一期關節活動度",
    address: "台中市西屯區台灣大道三段 99 號 12 樓",
    phone: "0956-678-901",
    emergencyContact: "陳志強（配偶）0966-777-888",
  },
  p5: {
    id: "p5",
    name: "黃志宏",
    gender: "男",
    age: 55,
    heightCm: 175,
    weightKg: 82,
    bloodType: "O",
    medicalRecordNo: "RB-2024-00987",
    department: "骨科復健科",
    attendingPhysician: "林雅婷 醫師",
    diagnosis: "左踝關節韌帶損傷",
    rehabPhase: "第二期肌力強化",
    address: "高雄市左營區博愛二路 777 號 6 樓",
    phone: "0977-789-012",
    emergencyContact: "黃淑娟（配偶）0988-999-000",
  },
};

/** 家屬端 / 患者端預設監護對象 */
export const DEFAULT_PATIENT_ID = "p1";

export function getPatientProfile(patientId: string): PatientProfile | undefined {
  return PATIENT_PROFILES[patientId];
}

export function getPatientProfileByName(name: string): PatientProfile | undefined {
  return Object.values(PATIENT_PROFILES).find((p) => p.name === name);
}
