import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useAppStore } from '../../../store/useAppStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const MovementManageModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { availableMovements, addMovement, deleteMovement } = useAppStore();
  const [name, setName] = useState('');
  const [targetPart, setTargetPart] = useState('胸');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addMovement({
      id: `act_${Date.now()}`,
      name: name.trim(),
      targetPart: targetPart.trim(),
    });
    setName('');
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm max-h-[85vh] flex flex-col shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-base text-slate-100">管理動作清單</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 新增動作表單 */}
        <form onSubmit={handleAdd} className="p-4 border-b border-slate-800 space-y-3">
          <div className="text-xs font-semibold text-slate-400">新增動作</div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="動作名稱 (例: 啞鈴飛鳥)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <select
              value={targetPart}
              onChange={(e) => setTargetPart(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white"
            >
              <option value="胸">胸</option>
              <option value="背">背</option>
              <option value="腿">腿</option>
              <option value="肩">肩</option>
              <option value="手臂">手臂</option>
              <option value="核心">核心</option>
            </select>
            <button
              type="submit"
              className="bg-blue-600 px-3 py-2 rounded-lg text-xs font-semibold text-white flex items-center gap-1 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" /> 加
            </button>
          </div>
        </form>

        {/* 現有動作清單 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="text-xs font-semibold text-slate-400 mb-2">現有動作 ({availableMovements.length})</div>
          {availableMovements.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60"
            >
              <div>
                <span className="text-xs font-semibold text-slate-200">{m.name}</span>
                <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                  {m.targetPart}
                </span>
              </div>
              <button
                onClick={() => {
                  if (confirm(`確定要刪除「${m.name}」嗎？`)) {
                    deleteMovement(m.id);
                  }
                }}
                className="text-red-400 hover:text-red-300 p-1 active:scale-90"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-slate-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
