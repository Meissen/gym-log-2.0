import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Movement, 
  MovementSetting, 
  SystemSettings, 
  HealthRecord, 
  TrainingFlatRow,
  ActiveTrainingDraft
} from '../types/models';
import { GoogleSheetsService } from '../services/googleSheetsService';

interface AppStoreState {
  // 遠端拉取與本地快取資料
  availableMovements: Movement[];
  trainingMethods: string[];
  movementSettings: MovementSetting[];
  healthRecords: HealthRecord[];
  trainingHistory: TrainingFlatRow[]; // 所有歷史訓練紀錄 (供調閱最近三次)

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

  // 進行中訓練草稿 (跳轉至主頁再返回不重置)
  activeDraft: ActiveTrainingDraft;
  updateActiveDraft: (draft: Partial<ActiveTrainingDraft>) => void;
  resetActiveDraft: () => void;

  // 歷史紀錄手動增加 (上傳成功後即時加入歷史)
  appendTrainingHistory: (rows: TrainingFlatRow[]) => void;

  // 全域同步更新
  setAllRemoteData: (data: {
    health?: HealthRecord[];
    movements?: { movements: Movement[]; methods: string[] };
    settings?: { system: Partial<SystemSettings>; movementSettings: MovementSetting[] };
    training?: TrainingFlatRow[];
  }) => void;

  // API 呼叫
  uploadTrainingBatch: (rows: TrainingFlatRow[]) => Promise<boolean>;
}

const defaultDraft: ActiveTrainingDraft = {
  selectedMethod: '訓練組',
  selectedMovementId: '',
  currentSetIndex: 1,
  blocks: [{ id: 'b_init', weight: 0, reps: 0, unit: 'kg' }],
  currentMovementSets: [],
};

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
      trainingHistory: [],
      systemSettings: {
        defaultDisplayUnit: 'kg',
        storageUnit: 'kg',
        isTestMode: false,
        gasWebAppUrl: GoogleSheetsService.getUrl(),
      },
      offlineTrainingRows: [],
      activeDraft: { ...defaultDraft },

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

      // 新增動作：自動插入在該部位 (targetPart) 動作群的最後面
      addMovement: (movement) =>
        set((state) => {
          const list = [...state.availableMovements];
          let lastIndex = -1;
          for (let i = list.length - 1; i >= 0; i--) {
            if (list[i].targetPart === movement.targetPart) {
              lastIndex = i;
              break;
            }
          }
          if (lastIndex !== -1) {
            list.splice(lastIndex + 1, 0, movement);
          } else {
            list.push(movement);
          }
          return { availableMovements: list };
        }),

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

      updateActiveDraft: (partial) =>
        set((state) => ({
          activeDraft: { ...state.activeDraft, ...partial },
        })),

      resetActiveDraft: () =>
        set(() => ({
          activeDraft: {
            ...defaultDraft,
            blocks: [{ id: `b_${Date.now()}`, weight: 0, reps: 0, unit: 'kg' }],
          },
        })),

      appendTrainingHistory: (rows) =>
        set((state) => ({
          trainingHistory: [...rows, ...state.trainingHistory],
        })),

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
          if (data.training && Array.isArray(data.training)) {
            next.trainingHistory = data.training;
          }
          return next;
        }),

      uploadTrainingBatch: async (rows) => {
        try {
          await GoogleSheetsService.uploadTrainingBatch(rows);
          // 上傳成功後，立刻追加進本地歷史紀錄，調閱歷史時即時可見
          set((state) => ({
            trainingHistory: [...rows, ...state.trainingHistory],
          }));
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
