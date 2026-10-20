import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, Dumbbell, Settings, RefreshCw, CheckCircle2 } from 'lucide-react';
import { GoogleSheetsService } from '../services/googleSheetsService';
import { useAppStore } from '../store/useAppStore';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { setAllRemoteData, systemSettings } = useAppStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');

  const handleSyncData = async () => {
    try {
      setIsSyncing(true);
      setSyncStatus('');
      const data = await GoogleSheetsService.fetchAllData();
      setAllRemoteData(data);
      setSyncStatus('✅ 雙向同步成功！本地資料已更新至最新。');
      setTimeout(() => setSyncStatus(''), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`同步失敗: ${msg}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen safe-top safe-bottom p-5 bg-slate-950 justify-between select-none">
      <header className="pt-4 pb-2 text-center">
        <h1 className="text-3xl font-black text-white tracking-wider">FITNESS LOG</h1>
        <p className="text-xs text-slate-400 mt-1">個人健身與健康管理 PWA</p>
        {systemSettings.isTestMode && (
          <div className="mt-2 inline-block px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
            ⚠️ 測試模式進行中
          </div>
        )}
      </header>

      {/* 四個主要功能大按鈕 */}
      <main className="grid grid-cols-1 gap-4 my-auto max-w-sm mx-auto w-full">
        {syncStatus && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-center text-xs font-semibold text-emerald-300 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            {syncStatus}
          </div>
        )}

        <button
          onClick={() => navigate('/health')}
          className="flex items-center gap-4 p-5 bg-gradient-to-r from-rose-950/70 to-rose-800/70 border border-rose-500/30 rounded-2xl text-white font-bold text-lg active:scale-95 transition-transform shadow-lg shadow-rose-950/30"
        >
          <div className="p-3 bg-rose-500/20 rounded-xl">
            <HeartPulse className="w-8 h-8 text-rose-400" />
          </div>
          <div className="text-left">
            <div>健康資訊</div>
            <div className="text-[11px] text-rose-300/70 font-normal">體重、體脂、骨骼肌記錄</div>
          </div>
        </button>

        <button
          onClick={() => navigate('/training')}
          className="flex items-center gap-4 p-5 bg-gradient-to-r from-blue-950/70 to-blue-800/70 border border-blue-500/30 rounded-2xl text-white font-bold text-lg active:scale-95 transition-transform shadow-lg shadow-blue-950/30"
        >
          <div className="p-3 bg-blue-500/20 rounded-xl">
            <Dumbbell className="w-8 h-8 text-blue-400" />
          </div>
          <div className="text-left">
            <div>訓練紀錄</div>
            <div className="text-[11px] text-blue-300/70 font-normal">動作組數、A/B檔位微調</div>
          </div>
        </button>

        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-4 p-5 bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700/60 rounded-2xl text-white font-bold text-lg active:scale-95 transition-transform shadow-lg"
        >
          <div className="p-3 bg-slate-700/30 rounded-xl">
            <Settings className="w-8 h-8 text-slate-300" />
          </div>
          <div className="text-left">
            <div>偏好設定</div>
            <div className="text-[11px] text-slate-400 font-normal">單位換算、動作檔位、URL</div>
          </div>
        </button>

        <button
          disabled={isSyncing}
          onClick={handleSyncData}
          className="flex items-center gap-4 p-5 bg-gradient-to-r from-amber-950/70 to-amber-800/70 border border-amber-500/30 rounded-2xl text-white font-bold text-lg active:scale-95 transition-transform shadow-lg disabled:opacity-50"
        >
          <div className="p-3 bg-amber-500/20 rounded-xl">
            <RefreshCw className={`w-8 h-8 text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
          </div>
          <div className="text-left">
            <div>{isSyncing ? '正在拉取資料...' : '同步資料'}</div>
            <div className="text-[11px] text-amber-300/70 font-normal">從雲端 Sheet 雙向更新</div>
          </div>
        </button>
      </main>

      <footer className="py-2 text-center text-[10px] text-slate-500">
        Standalone PWA · iOS Dynamic Island Optimized
      </footer>
    </div>
  );
};
