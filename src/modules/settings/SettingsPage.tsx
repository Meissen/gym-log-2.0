import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Cloud, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { MovementSetting, WeightUnit } from '../../types/models';
import { GoogleSheetsService } from '../../services/googleSheetsService';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    systemSettings, 
    setSystemSettings, 
    availableMovements, 
    movementSettings, 
    updateMovementSetting 
  } = useAppStore();

  const [gasUrl, setGasUrl] = useState(systemSettings.gasWebAppUrl || '');
  const [displayUnit, setDisplayUnit] = useState<WeightUnit>(systemSettings.defaultDisplayUnit);
  const [storageUnit, setStorageUnit] = useState<WeightUnit>(systemSettings.storageUnit);
  const [isTestMode, setIsTestMode] = useState<boolean>(systemSettings.isTestMode);

  // 動作詳細設定
  const [selectedMovement, setSelectedMovement] = useState<string>(
    availableMovements[0]?.name || ''
  );
  const [currentSetting, setCurrentSetting] = useState<MovementSetting>({
    movementName: '',
    defaultWeight: 20,
    defaultReps: 10,
    mode: 'A',
    stepValue: 2.5,
    gearLevels: [15, 20, 25, 30],
  });

  const [newGearInput, setNewGearInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // 當選取的動作改變，載入該動作設定
  useEffect(() => {
    if (!selectedMovement) return;
    const found = movementSettings.find((s) => s.movementName === selectedMovement);
    if (found) {
      setCurrentSetting({ ...found });
    } else {
      setCurrentSetting({
        movementName: selectedMovement,
        defaultWeight: 20,
        defaultReps: 10,
        mode: 'A',
        stepValue: 2.5,
        gearLevels: [15, 20, 25, 30, 35, 40],
      });
    }
  }, [selectedMovement, movementSettings]);

  // 新增 B 模式檔位
  const handleAddGear = () => {
    const val = parseFloat(newGearInput);
    if (isNaN(val)) return;
    if (currentSetting.gearLevels.includes(val)) {
      alert('該檔位重量已存在！');
      return;
    }
    const nextGears = [...currentSetting.gearLevels, val].sort((a, b) => a - b);
    setCurrentSetting((prev) => ({ ...prev, gearLevels: nextGears }));
    setNewGearInput('');
  };

  const handleRemoveGear = (gearToRemove: number) => {
    setCurrentSetting((prev) => ({
      ...prev,
      gearLevels: prev.gearLevels.filter((g) => g !== gearToRemove),
    }));
  };

  // 測試模式切換邏輯：若從開切換至關，觸發 GAS 自動刪除測試資料
  const handleToggleTestMode = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.checked;
    setIsTestMode(nextVal);
    setSystemSettings({ isTestMode: nextVal });

    if (!nextVal) {
      if (confirm('已關閉測試模式。是否立即通知 Google Sheet 自動刪除所有的測試資料？')) {
        try {
          await GoogleSheetsService.clearTestData();
          alert('✅ Google Sheet 中的測試資料已自動清除！');
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          alert(`清除測試資料失敗: ${msg}`);
        }
      }
    }
  };

  // 儲存並同步至 Google Sheet
  const handleSaveAndSync = async () => {
    setIsSaving(true);
    try {
      // 1. 本地更新
      updateMovementSetting(currentSetting);
      setSystemSettings({
        gasWebAppUrl: gasUrl,
        defaultDisplayUnit: displayUnit,
        storageUnit: storageUnit,
        isTestMode: isTestMode,
      });

      // 2. 雲端同步
      const updatedMovementSettings = movementSettings.some((s) => s.movementName === currentSetting.movementName)
        ? movementSettings.map((s) => (s.movementName === currentSetting.movementName ? currentSetting : s))
        : [...movementSettings, currentSetting];

      await GoogleSheetsService.saveSettings({
        system: {
          gasWebAppUrl: gasUrl,
          defaultDisplayUnit: displayUnit,
          storageUnit: storageUnit,
          isTestMode: isTestMode,
        },
        movementSettings: updatedMovementSettings,
      });

      alert('✅ 設定已成功儲存並同步至 Google Sheet「設定數據」分頁！');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`⚠️ 本地已儲存，但上傳 Google Sheet 失敗: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen safe-top safe-bottom bg-slate-950 text-slate-100">
      <header className="px-4 py-3 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-slate-300 active:opacity-60 text-sm font-medium"
        >
          <ArrowLeft className="w-5 h-5" /> 回主頁
        </button>
        <span className="font-semibold text-base">偏好與動作設定</span>
        <div className="w-12"></div>
      </header>

      <main className="flex-1 p-4 space-y-5 pb-28 overflow-y-auto max-w-md mx-auto w-full">
        {/* 1. Google Apps Script 雲端設定 */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
            <Cloud className="w-4 h-4" /> Google Apps Script URL
          </div>
          <input
            type="text"
            placeholder="https://script.google.com/macros/s/xxxx/exec"
            value={gasUrl}
            onChange={(e) => setGasUrl(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
          />
          <p className="text-[11px] text-slate-400">
            請貼上您在 Google Apps Script 部署為網頁應用程式時所取得的 Exec URL。
          </p>
        </section>

        {/* 2. 單位設定區 */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h3 className="font-semibold text-sm text-slate-200">單位設定</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">預設顯示單位</label>
              <select
                value={displayUnit}
                onChange={(e) => setDisplayUnit(e.target.value as WeightUnit)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs font-semibold text-white"
              >
                <option value="kg">kg (公斤)</option>
                <option value="lb">lb (磅)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">資料儲存單位</label>
              <select
                value={storageUnit}
                onChange={(e) => setStorageUnit(e.target.value as WeightUnit)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs font-semibold text-white"
              >
                <option value="kg">kg (寫入試算表)</option>
                <option value="lb">lb (寫入試算表)</option>
              </select>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            * 若顯示與儲存單位不同，紀錄時會自動於背景依 1 kg = 2.20462 lb 換算儲存。
          </p>
        </section>

        {/* 3. 動作詳細設定區 (A/B 模式與動態長度檔位) */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
          <h3 className="font-semibold text-sm text-slate-200">動作詳細設定 (A/B 模式)</h3>

          <div>
            <label className="text-xs text-slate-400 block mb-1">選擇要設定的動作</label>
            <select
              value={selectedMovement}
              onChange={(e) => setSelectedMovement(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-white"
            >
              {availableMovements.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name} ({m.targetPart})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">預設起始重量</label>
              <input
                type="number"
                step="0.5"
                value={currentSetting.defaultWeight}
                onChange={(e) =>
                  setCurrentSetting((prev) => ({
                    ...prev,
                    defaultWeight: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-center text-sm font-bold text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">預設起始次數</label>
              <input
                type="number"
                value={currentSetting.defaultReps}
                onChange={(e) =>
                  setCurrentSetting((prev) => ({
                    ...prev,
                    defaultReps: parseInt(e.target.value, 10) || 0,
                  }))
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-center text-sm font-bold text-white"
              />
            </div>
          </div>

          {/* 模式切換 */}
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">微調模式選擇</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setCurrentSetting((prev) => ({ ...prev, mode: 'A' }))
                }
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  currentSetting.mode === 'A'
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                A 模式 (固定加減值)
              </button>
              <button
                type="button"
                onClick={() =>
                  setCurrentSetting((prev) => ({ ...prev, mode: 'B' }))
                }
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  currentSetting.mode === 'B'
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                B 模式 (檔位陣列)
              </button>
            </div>
          </div>

          {/* A 模式內容 */}
          {currentSetting.mode === 'A' ? (
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-2">
              <label className="text-xs text-slate-300 block">每次點擊 [+] 或 [-] 增減公斤數</label>
              <input
                type="number"
                step="0.5"
                value={currentSetting.stepValue}
                onChange={(e) =>
                  setCurrentSetting((prev) => ({
                    ...prev,
                    stepValue: parseFloat(e.target.value) || 2.5,
                  }))
                }
                placeholder="例如 2.5"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-sm font-bold text-white"
              />
            </div>
          ) : (
            /* B 模式內容 (支援任意檔位長度) */
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-3">
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span>檔位設定 (目前共有 {currentSetting.gearLevels.length} 檔)</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                {currentSetting.gearLevels.map((gear, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-950/80 border border-blue-700/60 text-blue-200 text-xs font-semibold"
                  >
                    {gear} kg
                    <button
                      type="button"
                      onClick={() => handleRemoveGear(gear)}
                      className="text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <input
                  type="number"
                  step="0.5"
                  placeholder="輸入重量 (例: 52.5)"
                  value={newGearInput}
                  onChange={(e) => setNewGearInput(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={handleAddGear}
                  className="px-3 bg-blue-600 rounded-lg text-xs font-bold text-white flex items-center gap-1 active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" /> 加檔位
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 4. 測試模式區 */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-sm text-slate-200">測試模式</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isTestMode}
                onChange={handleToggleTestMode}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>
          <p className="text-[11px] text-slate-400">
            開啟時，上傳之資料皆會被註記為測試資料 (`isTest: true`)。關閉測試模式時，將提示並發送請求自動清除 Sheet 中的測試數據。
          </p>
        </section>
      </main>

      {/* 底部儲存按鈕 */}
      <footer className="fixed bottom-0 left-0 right-0 bg-slate-900/95 border-t border-slate-800 p-4 safe-bottom backdrop-blur z-20">
        <button
          onClick={handleSaveAndSync}
          disabled={isSaving}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-blue-900/40"
        >
          <Save className="w-4 h-4" />
          {isSaving ? '儲存並同步中...' : '儲存並同步設定'}
        </button>
      </footer>
    </div>
  );
};
