import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Movement, MovementSetting, SystemSettings, HealthRecord, TrainingFlatRow } from '../types/models';
import { GoogleSheetsService } from '../services/googleSheetsService';

interface AppStoreState {
  // 遠端拉取的資料
  availableMovements: Movement[];
  trainingMethods: string[];
  movementSettings: MovementSetting[];
  healthRecords: HealthRecord[];

  // 系統設定
  systemSettings: SystemSettings;
  setSystemSettings: (settings: Partial<SystemSettings>) => void;

  // 離線待上傳快取
  offlineTrainingRows: TrainingFlatRow[];
  saveToOfflineCache: (rows: TrainingFlatRow[]) => void;
  clearOfflineTrainingCache: () => void;

  // 動作增刪改
  addMovement: (movement: Movement) => void;
  deleteMovement: (id: string) => void;
  updateMovementSetting: (setting: MovementSetting) => void;

  // 同步動作
  setAllRemoteData: (data: {
    health?: HealthRecord[];
    movements?: { movements: Movement[]; methods: string[] };
    settings?: { system: Partial<SystemSettings>; movementSettings: MovementSetting[] };
  }) => void;

  // 呼叫 API
  uploadTrainingBatch: (rows: TrainingFlatRow[]) => Promise<boolean>;
}

export const useAppStore = create<AppStoreState>()(
  persist(
    (set) => ({
      availableMovements: [
        { id: 'act_1', name: '槓鈴臥推', targetPart: '胸' },
        { id: 'act_2', name: '上斜啞鈴臥推', targetPart: '胸' },
        { id: 'act_3', name: '引體向上', targetPart: '背' },
        { id: 'act_4', name: '滑輪下拉', targetPart: '背' },
        { id: 'act_5', name: '槓鈴深蹲', targetPart: '腿' },
        { id: 'act_6', name: '羅馬尼亞硬舉', targetPart: '腿' },
        { id: 'act_7', name: '啞鈴肩推', targetPart: '肩' },
        { id: 'act_8', name: '啞鈴側平舉', targetPart: '肩' },
      ],
      trainingMethods: ['暖身組', '訓練組', '超級組', '遞減組'],
      movementSettings: [
        { movementName: '槓鈴臥推', defaultWeight: 60, defaultReps: 8, mode: 'A', stepValue: 2.5, gearLevels: [] },
        { movementName: '上斜啞鈴臥推', defaultWeight: 24, defaultReps: 10, mode: 'A', stepValue: 2, gearLevels: [] },
        { movementName: '槓鈴深蹲', defaultWeight: 80, defaultReps: 8, mode: 'A', stepValue: 5, gearLevels: [] },
        { movementName: '滑輪下拉', defaultWeight: 45, defaultReps: 12, mode: 'B', stepValue: 0, gearLevels: [15, 20, 25, 30, 35, 40, 45, 50, 55, 60] },
        { movementName: '啞鈴側平舉', defaultWeight: 10, defaultReps: 15, mode: 'B', stepValue: 0, gearLevels: [4, 6, 8, 10, 12, 14, 16, 18, 20, 22] },
      ],
      healthRecords: [],
      systemSettings: {
        defaultDisplayUnit: 'kg',
        storageUnit: 'kg',
        isTestMode: false,
        gasWebAppUrl: GoogleSheetsService.getUrl(),
      },
      offlineTrainingRows: [],

      setSystemSettings: (newSettings) =>
        set((state) => {
          if (newSettings.gasWebAppUrl !== undefined) {
            GoogleSheetsService.setUrl(newSettings.gasWebAppUrl);
          }
          return {
            systemSettings: { ...state.systemSettings, ...newSettings },
          };
        }),

      saveToOfflineCache: (rows) =>
        set((state) => ({
          offlineTrainingRows: [...state.offlineTrainingRows, ...rows],
        })),

      clearOfflineTrainingCache: () => set({ offlineTrainingRows: [] }),

      addMovement: (movement) =>
        set((state) => ({
          availableMovements: [...state.availableMovements, movement],
        })),

      deleteMovement: (id) =>
        set((state) => ({
          availableMovements: state.availableMovements.filter((m) => m.id !== id),
        })),

      updateMovementSetting: (setting) =>
        set((state) => {
          const exists = state.movementSettings.some((s) => s.movementName === setting.movementName);
          const next = exists
            ? state.movementSettings.map((s) => (s.movementName === setting.movementName ? setting : s))
            : [...state.movementSettings, setting];
          return { movementSettings: next };
        }),

      setAllRemoteData: (data) =>
        set((state) => {
          const next = { ...state };
          if (data.health) next.healthRecords = data.health;
          if (data.movements) {
            if (data.movements.movements?.length) next.availableMovements = data.movements.movements;
            if (data.movements.methods?.length) next.trainingMethods = data.movements.methods;
          }
          if (data.settings) {
            if (data.settings.system) {
              next.systemSettings = {
                ...next.systemSettings,
                ...data.settings.system,
              };
            }
            if (data.settings.movementSettings?.length) {
              next.movementSettings = data.settings.movementSettings;
            }
          }
          return next;
        }),

      uploadTrainingBatch: async (rows) => {
        try {
          await GoogleSheetsService.uploadTrainingBatch(rows);
          return true;
        } catch (err) {
          console.error('上傳訓練數據失敗，已暫存至本地:', err);
          return false;
        }
      },
    }),
    {
      name: 'fitness-tracker-store',
    }
  )
);
