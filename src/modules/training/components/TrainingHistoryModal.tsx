import React from 'react';
import { X, Calendar, Dumbbell, History } from 'lucide-react';
import { TrainingFlatRow } from '../../../types/models';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  movementName: string;
  trainingMethod: string;
  historyRecords: TrainingFlatRow[];
}

export const TrainingHistoryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  movementName,
  trainingMethod,
  historyRecords,
}) => {
  if (!isOpen) return null;

  // 1. 篩選出同動作且同訓練方法的紀錄
  const filtered = historyRecords.filter(
    (r) => r.movementName === movementName && r.trainingMethod === trainingMethod
  );

  // 2. 依日期 (YYYY-MM-DD) 分組，並找出最近 3 個不同日期
  const dateMap: { [dateStr: string]: TrainingFlatRow[] } = {};
  filtered.forEach((row) => {
    const dateKey = row.sessionDate ? row.sessionDate.substring(0, 10) : '未知日期';
    if (!dateMap[dateKey]) {
      dateMap[dateKey] = [];
    }
    dateMap[dateKey].push(row);
  });

  // 依日期由新到舊排序，取前 3 個不同日期
  const sortedDates = Object.keys(dateMap)
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 3);

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* 頂部標題列 */}
        <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">{movementName || '歷史紀錄'}</h3>
              <p className="text-xs text-blue-400 font-medium">{trainingMethod} · 最近 3 次訓練</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800 active:scale-95 transition-transform"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 內容區塊 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!movementName ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              請先在訓練頁面選擇動作，即可調閱該動作的最近紀錄。
            </div>
          ) : sortedDates.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Dumbbell className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">尚無此動作的歷史紀錄</p>
              <p className="text-xs text-slate-500 max-w-[220px] mx-auto">
                完成「{movementName}」並同步至雲端後，下次訓練就能在此比對數據！
              </p>
            </div>
          ) : (
            sortedDates.map((dateStr, dateIdx) => {
              const rowsOnDate = dateMap[dateStr];
              // 依組別 (setIndex) 分組
              const setGroups: { [setIdx: number]: TrainingFlatRow[] } = {};
              rowsOnDate.forEach((r) => {
                const sIdx = r.setIndex || 1;
                if (!setGroups[sIdx]) setGroups[sIdx] = [];
                setGroups[sIdx].push(r);
              });
              const setIndices = Object.keys(setGroups)
                .map(Number)
                .sort((a, b) => a - b);

              return (
                <div
                  key={dateStr}
                  className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-2.5 shadow-sm"
                >
                  <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-700/50">
                    <span className="flex items-center gap-1.5 font-bold text-slate-200">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      {dateStr}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-700 font-medium text-slate-300">
                      {dateIdx === 0 ? '最近一次' : dateIdx === 1 ? '前二次' : '前三次'}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {setIndices.map((sIdx) => {
                      const blocksInSet = setGroups[sIdx].sort((a, b) => a.blockIndex - b.blockIndex);
                      return (
                        <div
                          key={sIdx}
                          className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-900/60"
                        >
                          <span className="font-semibold text-slate-400">第 {sIdx} 組</span>
                          <div className="flex flex-col items-end gap-0.5">
                            {blocksInSet.map((b, bIdx) => (
                              <span key={bIdx} className="font-mono font-bold text-slate-100">
                                {blocksInSet.length > 1 && (
                                  <span className="text-[10px] text-slate-400 font-normal mr-1">
                                    [#{b.blockIndex}]
                                  </span>
                                )}
                                <span className="text-blue-400">{b.weight}</span> {b.weightUnit} ×{' '}
                                <span className="text-emerald-400">{b.reps}</span> 下
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 底部關閉按鈕 */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 text-center">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold active:scale-[0.98] transition-transform"
          >
            關閉紀錄
          </button>
        </div>
      </div>
    </div>
  );
};
