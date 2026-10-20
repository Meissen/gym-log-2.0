import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, CheckCircle2, ChevronUp, ChevronDown, Settings2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTrainingLog } from './hooks/useTrainingLog';
import { useAppStore } from '../../store/useAppStore';
import { MovementManageModal } from './components/MovementManageModal';

export const TrainingLogPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    movementSettings, 
    systemSettings, 
    availableMovements, 
    trainingMethods,
    saveToOfflineCache, 
    uploadTrainingBatch 
  } = useAppStore();

  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [filterText, setFilterText] = useState('');

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    action: () => void;
  }>({ isOpen: false, title: '', action: () => {} });

  const {
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
    completedSetsCount,
  } = useTrainingLog({
    movementSettings,
    defaultDisplayUnit: systemSettings.defaultDisplayUnit,
    storageUnit: systemSettings.storageUnit,
    isTestMode: systemSettings.isTestMode,
    onSaveToLocalCache: saveToOfflineCache,
    onUploadSession: uploadTrainingBatch,
  });

  const promptConfirm = (title: string, action: () => void) => {
    setConfirmDialog({ isOpen: true, title, action });
  };

  const filteredMovements = availableMovements.filter((m) =>
    m.name.toLowerCase().includes(filterText.toLowerCase()) ||
    m.targetPart.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen safe-top safe-bottom bg-slate-950 text-slate-100">
      {/* 頂部導航列 */}
      <header className="px-4 py-3 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-20">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-1.5 text-blue-400 active:opacity-60 text-sm font-medium"
        >
          <ArrowLeft className="w-5 h-5" /> 回主頁
        </button>
        <span className="font-semibold text-base">訓練紀錄</span>
        <div className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
          已記錄: {completedSetsCount} 組
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4 pb-36 overflow-y-auto">
        {/* UI 區塊 1: 選擇訓練方法 */}
        <section className="bg-slate-900 rounded-2xl p-3 border border-slate-800">
          <label className="text-xs font-semibold text-slate-400 mb-2 block">訓練方法</label>
          <div className="grid grid-cols-4 gap-1.5">
            {trainingMethods.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMethod(m)}
                className={`py-2 text-xs font-medium rounded-xl border transition-all ${
                  selectedMethod === m
                    ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </section>

        {/* UI 區塊 2: 選擇與編輯動作 (支援搜尋 + 彈窗增刪) */}
        <section className="bg-slate-900 rounded-2xl p-3 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-slate-400">選擇動作</label>
            <button
              onClick={() => setIsManageModalOpen(true)}
              className="text-xs text-blue-400 flex items-center gap-1 hover:underline active:opacity-70"
            >
              <Settings2 className="w-3.5 h-3.5" /> 新增/刪除動作
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="搜尋動作或部位..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-1/3 bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <select
              value={selectedMovementId}
              onChange={(e) => handleSelectMovement(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">-- 請選取訓練動作 --</option>
              {filteredMovements.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name} ({m.targetPart})
                </option>
              ))}
            </select>
          </div>

          {selectedMovementId && (
            <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
              <span>目前為：<b className="text-blue-400">{selectedMovementId}</b></span>
              <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-300">
                微調模式：{activeSetting?.mode === 'B' ? `B模式 (${activeSetting.gearLevels.length}檔)` : `A模式 (+${activeSetting?.stepValue || 2.5})`}
              </span>
            </div>
          )}
        </section>

        {/* UI 區塊 3: 動態 Blocks 輸入區 */}
        {selectedMovementId ? (
          <section className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold tracking-wider text-slate-400">
                第 {currentSetIndex} 組配置 (SET {currentSetIndex})
              </span>
              <button
                onClick={addBlock}
                className="flex items-center gap-1 text-xs text-blue-400 bg-blue-950/60 border border-blue-800/80 px-2.5 py-1 rounded-full font-medium active:scale-95 transition-transform"
              >
                <Plus className="w-3.5 h-3.5" /> 新增小組數 (遞減/超級組)
              </button>
            </div>

            {blocks.map((block, idx) => (
              <div 
                key={block.id} 
                className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-sm space-y-2.5"
              >
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">小組數 #{idx + 1}</span>
                  {idx > 0 && (
                    <button 
                      onClick={() => removeBlock(block.id)}
                      className="text-red-400 active:opacity-60 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> 刪除小組
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* 重量欄位與 A/B 檔位按鈕 */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">重量</span>
                      <button
                        onClick={() => toggleBlockUnit(block.id)}
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-blue-400 border border-slate-700 active:scale-95"
                      >
                        {block.unit.toUpperCase()} 切換
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.5"
                        value={block.weight || ''}
                        onChange={(e) => updateBlock(block.id, 'weight', parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-center text-xl font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => tuneWeight(block.id, 'UP')}
                          className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 active:bg-slate-700 text-blue-400"
                          title={activeSetting?.mode === 'B' ? '升一檔' : '加重'}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => tuneWeight(block.id, 'DOWN')}
                          className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 active:bg-slate-700 text-blue-400"
                          title={activeSetting?.mode === 'B' ? '降一檔' : '減重'}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 次數欄位與微調按鈕 */}
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400 block">次數 (Reps)</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.5"
                        value={block.reps || ''}
                        onChange={(e) => updateBlock(block.id, 'reps', parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-center text-xl font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => tuneReps(block.id, 'UP')}
                          className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 active:bg-slate-700 text-blue-400"
                          title="+1 次"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => tuneReps(block.id, 'DOWN')}
                          className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 active:bg-slate-700 text-blue-400"
                          title="-1 次"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>
        ) : (
          <div className="text-center py-20 text-slate-500 text-sm">
            請先在上方選取動作開始訓練
          </div>
        )}
      </main>

      {/* 底部固定大按鈕操作區 (支援 iOS Notch Safe Area) */}
      <footer className="fixed bottom-0 left-0 right-0 bg-slate-900/95 border-t border-slate-800 p-3 safe-bottom backdrop-blur z-20 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            disabled={!selectedMovementId}
            onClick={() => promptConfirm(`確認儲存第 ${currentSetIndex} 組紀錄？`, finishSet)}
            className="py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold rounded-xl text-sm active:scale-[0.98] transition-transform shadow-lg shadow-blue-900/30"
          >
            完成這組 (Set {currentSetIndex})
          </button>
          <button
            disabled={!selectedMovementId}
            onClick={() => promptConfirm('確認完成此動作？將清除畫面並重設組數。', finishMovement)}
            className="py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-semibold rounded-xl text-sm border border-slate-700 active:scale-[0.98] transition-transform"
          >
            完成這個動作
          </button>
        </div>
        <button
          onClick={() => promptConfirm('確認結束今天所有訓練並批次上傳至 Google Sheet？', finishWorkout)}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform shadow-lg shadow-emerald-950/40"
        >
          <CheckCircle2 className="w-4 h-4" /> 完成今天訓練 (上傳雲端)
        </button>
      </footer>

      {/* 動作增刪管理彈窗 */}
      <MovementManageModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
      />

      {/* iOS 原生確認彈窗 */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xs p-5 text-center space-y-4 shadow-2xl">
            <h3 className="font-semibold text-base text-slate-100">{confirmDialog.title}</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                className="py-2.5 rounded-xl bg-slate-800 text-slate-300 font-medium text-sm active:scale-95"
              >
                取消
              </button>
              <button
                onClick={() => {
                  confirmDialog.action();
                  setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
                }}
                className="py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm active:scale-95"
              >
                確認
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
