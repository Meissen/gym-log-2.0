export type WeightUnit = 'kg' | 'lb';
export type TuningMode = 'A' | 'B';

// 1. 健康數據模型
export interface HealthRecord {
  id: string;
  timestamp: string;
  height: number;
  weight: number;
  bodyFat?: number | null;
  skeletalMuscle?: number | null;
  isTest?: boolean;
}

// 2. 動作與標籤模型
export interface Movement {
  id: string;
  name: string;
  targetPart: string;
}

// 3. 動作詳細設定模型 (A/B模式與檔位陣列)
export interface MovementSetting {
  movementName: string;
  defaultWeight: number;
  defaultReps: number;
  mode: TuningMode;
  stepValue: number;
  gearLevels: number[];
}

// 4. 系統全域設定
export interface SystemSettings {
  defaultDisplayUnit: WeightUnit;
  storageUnit: WeightUnit;
  isTestMode: boolean;
  gasWebAppUrl: string;
}

// 5. 訓練動態組 (Block)
export interface TrainingBlock {
  id: string;
  weight: number;
  unit: WeightUnit;
  reps: number;
}

// 6. 訓練單組紀錄
export interface TrainingSetRecord {
  setIndex: number;
  movementName: string;
  trainingMethod: string;
  blocks: {
    blockIndex: number;
    weight: number;
    storedUnit: WeightUnit;
    reps: number;
  }[];
}

// 7. 扁平化上傳資料行
export interface TrainingFlatRow {
  sessionDate: string;
  movementName: string;
  trainingMethod: string;
  setIndex: number;
  blockIndex: number;
  weight: number;
  weightUnit: WeightUnit;
  reps: number;
  isTest: boolean;
  createdAt: string;
}
