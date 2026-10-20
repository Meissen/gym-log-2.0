import { useState, useCallback, useMemo } from 'react';
import { 
  TrainingBlock, 
  TrainingSetRecord, 
  MovementSetting, 
  WeightUnit, 
  TrainingFlatRow 
} from '../../../types/models';

interface UseTrainingLogProps {
  movementSettings: MovementSetting[];
  defaultDisplayUnit: WeightUnit;
  storageUnit: WeightUnit;
  isTestMode: boolean;
  onSaveToLocalCache: (records: TrainingFlatRow[]) => void;
  onUploadSession: (records: TrainingFlatRow[]) => Promise<boolean>;
}

const KG_TO_LB = 2.20462;
export const convertWeight = (val: number, from: WeightUnit, to: WeightUnit): number => {
  if (from === to) return val;
  if (from === 'kg' && to === 'lb') return Math.round(val * KG_TO_LB * 10) / 10;
  return Math.round((val / KG_TO_LB) * 10) / 10;
};

export const useTrainingLog = ({
  movementSettings,
  defaultDisplayUnit,
  storageUnit,
  isTestMode,
  onSaveToLocalCache,
  onUploadSession,
}: UseTrainingLogProps) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('訓練組');
  const [selectedMovementId, setSelectedMovementId] = useState<string>('');
  const [currentSetIndex, setCurrentSetIndex] = useState<number>(1);
  const [sessionCompletedSets, setSessionCompletedSets] = useState<TrainingSetRecord[]>([]);

  // 當前動作的設定檔 (包含 A/B 模式與預設次數)
  const activeSetting = useMemo(() => {
    return movementSettings.find((s) => s.movementName === selectedMovementId);
  }, [movementSettings, selectedMovementId]);

  // 動態 Blocks 陣列 (至少包含 1 個 Block)
  const [blocks, setBlocks] = useState<TrainingBlock[]>([
    { id: 'b_1', weight: 0, reps: 0, unit: defaultDisplayUnit }
  ]);

  // 切換動作時：自動套用預設重量與次數
  const handleSelectMovement = useCallback((movementName: string) => {
    setSelectedMovementId(movementName);
    const setting = movementSettings.find((s) => s.movementName === movementName);
    const initWeight = setting ? setting.defaultWeight : 20;
    const initReps = setting ? setting.defaultReps : 10;

    setBlocks([
      {
        id: `b_${Date.now()}_1`,
        weight: initWeight,
        reps: initReps,
        unit: defaultDisplayUnit,
      }
    ]);
  }, [movementSettings, defaultDisplayUnit]);

  // 重量微調 (A 模式固定加減 / B 模式動態檔位搜尋)
  const tuneWeight = useCallback((blockId: string, direction: 'UP' | 'DOWN') => {
    setBlocks((prev) => prev.map((block) => {
      if (block.id !== blockId) return block;

      const currentWeight = block.weight;
      let newWeight = currentWeight;

      if (!activeSetting || activeSetting.mode === 'A') {
        const step = activeSetting ? activeSetting.stepValue : 2.5;
        newWeight = direction === 'UP' ? currentWeight + step : Math.max(0, currentWeight - step);
      } else {
        const gears = activeSetting.gearLevels || [];
        if (gears.length === 0) return block;

        if (direction === 'UP') {
          const nextGear = gears.find((g) => g > currentWeight);
          newWeight = nextGear !== undefined ? nextGear : gears[gears.length - 1];
        } else {
          const prevGears = gears.filter((g) => g < currentWeight);
          newWeight = prevGears.length > 0 ? prevGears[prevGears.length - 1] : gears[0];
        }
      }

      return { ...block, weight: Math.round(newWeight * 10) / 10 };
    }));
  }, [activeSetting]);

  // 動態 Block 操作
  const addBlock = useCallback(() => {
    setBlocks((prev) => {
      const lastBlock = prev[prev.length - 1];
      const newBlock: TrainingBlock = {
        id: `b_${Date.now()}_${prev.length + 1}`,
        weight: lastBlock ? lastBlock.weight : 0,
        reps: lastBlock ? lastBlock.reps : 0,
        unit: lastBlock ? lastBlock.unit : defaultDisplayUnit,
      };
      return [...prev, newBlock];
    });
  }, [defaultDisplayUnit]);

  const removeBlock = useCallback((blockId: string) => {
    setBlocks((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((b) => b.id !== blockId);
    });
  }, []);

  const updateBlock = useCallback((blockId: string, field: 'weight' | 'reps', value: number) => {
    setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, [field]: value } : b)));
  }, []);

  // 次數微調 (+1 或 -1，支援小數點並防止小於0)
  const tuneReps = useCallback((blockId: string, direction: 'UP' | 'DOWN') => {
    setBlocks((prev) => prev.map((block) => {
      if (block.id !== blockId) return block;
      const currentReps = block.reps;
      const newReps = direction === 'UP' ? currentReps + 1 : Math.max(0, currentReps - 1);
      return { ...block, reps: Math.round(newReps * 10) / 10 };
    }));
  }, []);

  const toggleBlockUnit = useCallback((blockId: string) => {
    setBlocks((prev) => prev.map((b) => {
      if (b.id !== blockId) return b;
      const nextUnit: WeightUnit = b.unit === 'kg' ? 'lb' : 'kg';
      return {
        ...b,
        unit: nextUnit,
        weight: convertWeight(b.weight, b.unit, nextUnit),
      };
    }));
  }, []);

  // [完成這組]
  const finishSet = useCallback(() => {
    if (!selectedMovementId) return;

    const setRecord: TrainingSetRecord = {
      setIndex: currentSetIndex,
      movementName: selectedMovementId,
      trainingMethod: selectedMethod,
      blocks: blocks.map((b, idx) => ({
        blockIndex: idx + 1,
        weight: convertWeight(b.weight, b.unit, storageUnit),
        storedUnit: storageUnit,
        reps: b.reps,
      })),
    };

    setSessionCompletedSets((prev) => [...prev, setRecord]);
    setCurrentSetIndex((prev) => prev + 1);
  }, [currentSetIndex, selectedMovementId, selectedMethod, blocks, storageUnit]);

  // [完成這個動作]
  const finishMovement = useCallback(() => {
    setCurrentSetIndex(1);
    setSelectedMovementId('');
    setBlocks([{ id: `b_${Date.now()}`, weight: 0, reps: 0, unit: defaultDisplayUnit }]);
  }, [defaultDisplayUnit]);

  // [完成今天訓練]
  const finishWorkout = useCallback(async () => {
    if (sessionCompletedSets.length === 0) {
      alert('目前尚未記錄任何完成的組數！');
      return false;
    }

    const sessionDateTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const createdAt = new Date().toISOString();

    const flatRows: TrainingFlatRow[] = [];
    sessionCompletedSets.forEach((set) => {
      set.blocks.forEach((b) => {
        flatRows.push({
          sessionDate: sessionDateTime,
          movementName: set.movementName,
          trainingMethod: set.trainingMethod,
          setIndex: set.setIndex,
          blockIndex: b.blockIndex,
          weight: b.weight,
          weightUnit: b.storedUnit,
          reps: b.reps,
          isTest: isTestMode,
          createdAt,
        });
      });
    });

    onSaveToLocalCache(flatRows);
    const success = await onUploadSession(flatRows);
    if (success) {
      setSessionCompletedSets([]);
      finishMovement();
      alert('訓練數據已成功批次上傳至 Google Sheet！');
    } else {
      alert('已暫存至本地快取，待網路正常或同步時再上傳！');
    }
    return success;
  }, [sessionCompletedSets, isTestMode, onSaveToLocalCache, onUploadSession, finishMovement]);

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
    completedSetsCount: sessionCompletedSets.length,
  };
};
