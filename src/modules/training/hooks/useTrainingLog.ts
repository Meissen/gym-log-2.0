import { useCallback, useMemo } from 'react';
import { 
  TrainingBlock, 
  TrainingSetRecord, 
  WeightUnit, 
  TrainingFlatRow 
} from '../../../types/models';
import { useAppStore } from '../../../store/useAppStore';
import { formatLocalDateTime } from '../../../utils/dateHelper';

const KG_TO_LB = 2.20462;
export const convertWeight = (val: number, from: WeightUnit, to: WeightUnit): number => {
  if (from === to) return val;
  if (from === 'kg' && to === 'lb') return Math.round(val * KG_TO_LB * 10) / 10;
  return Math.round((val / KG_TO_LB) * 10) / 10;
};

export const useTrainingLog = () => {
  const {
    movementSettings,
    systemSettings,
    activeDraft,
    updateActiveDraft,
    resetActiveDraft,
    saveToOfflineCache,
    uploadTrainingBatch,
  } = useAppStore();

  const {
    selectedMethod,
    selectedMovementId,
    currentSetIndex,
    blocks,
    currentMovementSets,
  } = activeDraft;

  const storageUnit = systemSettings.storageUnit;
  const defaultDisplayUnit = systemSettings.defaultDisplayUnit;
  const isTestMode = systemSettings.isTestMode;

  // 當前動作的設定檔 (包含 A/B 模式與預設次數)
  const activeSetting = useMemo(() => {
    return movementSettings.find((s) => s.movementName === selectedMovementId);
  }, [movementSettings, selectedMovementId]);

  // 切換訓練方法
  const setSelectedMethod = useCallback((method: string) => {
    updateActiveDraft({ selectedMethod: method });
  }, [updateActiveDraft]);

  // 切換動作時：自動套用預設重量與次數
  const handleSelectMovement = useCallback((movementName: string) => {
    const setting = movementSettings.find((s) => s.movementName === movementName);
    const initWeight = setting ? setting.defaultWeight : 20;
    const initReps = setting ? setting.defaultReps : 10;

    updateActiveDraft({
      selectedMovementId: movementName,
      currentSetIndex: 1,
      currentMovementSets: [],
      blocks: [
        {
          id: `b_${Date.now()}_1`,
          weight: initWeight,
          reps: initReps,
          unit: defaultDisplayUnit,
        },
      ],
    });
  }, [movementSettings, defaultDisplayUnit, updateActiveDraft]);

  // 重量微調 (支援重量 0、A 模式固定加減 / B 模式動態檔位搜尋)
  const tuneWeight = useCallback((blockId: string, direction: 'UP' | 'DOWN') => {
    const nextBlocks = blocks.map((block) => {
      if (block.id !== blockId) return block;

      const currentWeight = Number(block.weight) || 0;
      let newWeight = currentWeight;

      if (!activeSetting || activeSetting.mode === 'A') {
        const step = activeSetting ? activeSetting.stepValue : 2.5;
        newWeight = direction === 'UP' ? currentWeight + step : Math.max(0, currentWeight - step);
      } else {
        const gears = activeSetting.gearLevels || [];
        if (gears.length === 0) {
          newWeight = direction === 'UP' ? currentWeight + 2.5 : Math.max(0, currentWeight - 2.5);
        } else if (direction === 'UP') {
          const nextGear = gears.find((g) => g > currentWeight);
          newWeight = nextGear !== undefined ? nextGear : (gears[gears.length - 1] || currentWeight + 2.5);
        } else {
          const prevGears = gears.filter((g) => g < currentWeight);
          newWeight = prevGears.length > 0 ? prevGears[prevGears.length - 1] : 0;
        }
      }

      return { ...block, weight: Math.round(newWeight * 10) / 10 };
    });

    updateActiveDraft({ blocks: nextBlocks });
  }, [blocks, activeSetting, updateActiveDraft]);

  // 次數微調 (+1 或 -1，支援小數點並防止小於 0)
  const tuneReps = useCallback((blockId: string, direction: 'UP' | 'DOWN') => {
    const nextBlocks = blocks.map((block) => {
      if (block.id !== blockId) return block;
      const currentReps = Number(block.reps) || 0;
      const newReps = direction === 'UP' ? currentReps + 1 : Math.max(0, currentReps - 1);
      return { ...block, reps: Math.round(newReps * 10) / 10 };
    });

    updateActiveDraft({ blocks: nextBlocks });
  }, [blocks, updateActiveDraft]);

  // 動態 Block 操作
  const addBlock = useCallback(() => {
    const lastBlock = blocks[blocks.length - 1];
    const newBlock: TrainingBlock = {
      id: `b_${Date.now()}_${blocks.length + 1}`,
      weight: lastBlock ? lastBlock.weight : 0,
      reps: lastBlock ? lastBlock.reps : 0,
      unit: lastBlock ? lastBlock.unit : defaultDisplayUnit,
    };
    updateActiveDraft({ blocks: [...blocks, newBlock] });
  }, [blocks, defaultDisplayUnit, updateActiveDraft]);

  const removeBlock = useCallback((blockId: string) => {
    if (blocks.length <= 1) return;
    updateActiveDraft({ blocks: blocks.filter((b) => b.id !== blockId) });
  }, [blocks, updateActiveDraft]);

  const updateBlock = useCallback((blockId: string, field: 'weight' | 'reps', value: number) => {
    const nextBlocks = blocks.map((b) => (b.id === blockId ? { ...b, [field]: value } : b));
    updateActiveDraft({ blocks: nextBlocks });
  }, [blocks, updateActiveDraft]);

  const toggleBlockUnit = useCallback((blockId: string) => {
    const nextBlocks = blocks.map((b) => {
      if (b.id !== blockId) return b;
      const nextUnit: WeightUnit = b.unit === 'kg' ? 'lb' : 'kg';
      return {
        ...b,
        unit: nextUnit,
        weight: convertWeight(b.weight, b.unit, nextUnit),
      };
    });
    updateActiveDraft({ blocks: nextBlocks });
  }, [blocks, updateActiveDraft]);

  // [完成這組] - 立即記錄手機當下系統精確時間 (YYYY-MM-DD HH:mm:ss)
  const finishSet = useCallback(() => {
    if (!selectedMovementId) return;

    const setTimestamp = formatLocalDateTime(new Date());

    const setRecord: TrainingSetRecord = {
      setIndex: currentSetIndex,
      movementName: selectedMovementId,
      trainingMethod: selectedMethod,
      completedAt: setTimestamp,
      blocks: blocks.map((b, idx) => ({
        blockIndex: idx + 1,
        weight: convertWeight(Number(b.weight) || 0, b.unit, storageUnit),
        storedUnit: storageUnit,
        reps: Number(b.reps) || 0,
      })),
    };

    updateActiveDraft({
      currentMovementSets: [...currentMovementSets, setRecord],
      currentSetIndex: currentSetIndex + 1,
    });
  }, [currentSetIndex, selectedMovementId, selectedMethod, blocks, storageUnit, currentMovementSets, updateActiveDraft]);

  // [完成這個動作] - 重構為：直接將該動作的所有組數同步上傳至 Google Sheet
  const finishMovement = useCallback(async () => {
    if (!selectedMovementId) return false;

    // 若有已完成的組數，立即批次上傳
    if (currentMovementSets.length > 0) {
      const flatRows: TrainingFlatRow[] = [];
      currentMovementSets.forEach((set) => {
        set.blocks.forEach((b) => {
          flatRows.push({
            sessionDate: set.completedAt, // 每組真實手機完成時間！
            movementName: set.movementName,
            trainingMethod: set.trainingMethod,
            setIndex: set.setIndex,
            blockIndex: b.blockIndex,
            weight: b.weight,
            weightUnit: b.storedUnit,
            reps: b.reps,
            isTest: isTestMode,
            createdAt: set.completedAt,
          });
        });
      });

      saveToOfflineCache(flatRows);
      const ok = await uploadTrainingBatch(flatRows);
      if (ok) {
        alert(`✅ 動作「${selectedMovementId}」共 ${currentMovementSets.length} 組已成功同步至 Google Sheet！`);
      } else {
        alert(`⚠️ 已將「${selectedMovementId}」暫存於手機本地，待連網時再同步至雲端。`);
      }
    }

    // 重設該動作狀態
    updateActiveDraft({
      selectedMovementId: '',
      currentSetIndex: 1,
      currentMovementSets: [],
      blocks: [{ id: `b_${Date.now()}`, weight: 0, reps: 0, unit: defaultDisplayUnit }],
    });

    return true;
  }, [
    selectedMovementId,
    currentMovementSets,
    isTestMode,
    saveToOfflineCache,
    uploadTrainingBatch,
    updateActiveDraft,
    defaultDisplayUnit,
  ]);

  // [完成今天訓練] - 結束工作階段並返回主頁 (不重複上傳已同步動作)
  const finishWorkout = useCallback(async () => {
    // 檢查是否有尚未按下「完成這個動作」但已記錄的組數
    if (currentMovementSets.length > 0) {
      const confirmSync = confirm(
        `當前動作「${selectedMovementId}」還有 ${currentMovementSets.length} 組尚未同步，是否同步並結束今天訓練？`
      );
      if (confirmSync) {
        await finishMovement();
      }
    }

    resetActiveDraft();
    return true;
  }, [currentMovementSets, selectedMovementId, finishMovement, resetActiveDraft]);

  return {
    selectedMethod,
    setSelectedMethod,
    selectedMovementId,
    handleSelectMovement,
    currentSetIndex,
    blocks,
    activeSetting,
    tuneWeight,
    tuneReps,
    addBlock,
    removeBlock,
    updateBlock,
    toggleBlockUnit,
    finishSet,
    finishMovement,
    finishWorkout,
    completedSetsCount: currentMovementSets.length,
  };
};
