import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, HeartPulse } from 'lucide-react';
import { GoogleSheetsService } from '../../services/googleSheetsService';
import { useAppStore } from '../../store/useAppStore';

export const HealthPage: React.FC = () => {
  const navigate = useNavigate();
  const { systemSettings } = useAppStore();

  const [height, setHeight] = useState<string>('175');
  const [weight, setWeight] = useState<string>('70');
  const [bodyFat, setBodyFat] = useState<string>('');
  const [skeletalMuscle, setSkeletalMuscle] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!height || !weight) {
      alert('請至少填寫身高與體重！');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage('');

    try {
      await GoogleSheetsService.uploadHealth({
        id: `h_${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        height: parseFloat(height),
        weight: parseFloat(weight),
        bodyFat: bodyFat ? parseFloat(bodyFat) : null,
        skeletalMuscle: skeletalMuscle ? parseFloat(skeletalMuscle) : null,
        isTest: systemSettings.isTestMode,
      });

      setStatusMessage('✅ 健康數據已成功上傳至 Google Sheet！');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage(`❌ 上傳失敗: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen safe-top safe-bottom bg-slate-950 text-slate-100">
      {/* 頂部導航 */}
      <header className="px-4 py-3 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-rose-400 active:opacity-60 text-sm font-medium"
        >
          <ArrowLeft className="w-5 h-5" /> 回主頁
        </button>
        <span className="font-semibold text-base">健康資訊紀錄</span>
        <div className="w-12"></div>
      </header>

      <main className="flex-1 p-5 max-w-md mx-auto w-full space-y-6">
        <div className="flex items-center gap-3 bg-rose-950/40 border border-rose-900/50 p-4 rounded-2xl">
          <HeartPulse className="w-8 h-8 text-rose-400 shrink-0" />
          <div className="text-xs text-rose-200">
            定期記錄體重與體組成數據，將自動追加同步至雲端「健康數據」試算表中。
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">身高 (cm) *</label>
              <input
                type="number"
                step="0.1"
                required
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="例如 175"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-base font-semibold text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">體重 (kg) *</label>
              <input
                type="number"
                step="0.1"
                required
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="例如 70.5"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-base font-semibold text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">體脂肪 (%)</label>
              <input
                type="number"
                step="0.1"
                value={bodyFat}
                onChange={(e) => setBodyFat(e.target.value)}
                placeholder="選填，例如 15.2"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-base font-semibold text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">骨骼肌 (kg)</label>
              <input
                type="number"
                step="0.1"
                value={skeletalMuscle}
                onChange={(e) => setSkeletalMuscle(e.target.value)}
                placeholder="選填，例如 32.8"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-base font-semibold text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          {statusMessage && (
            <div className={`p-3 rounded-xl text-center text-xs font-medium ${
              statusMessage.startsWith('✅') ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800' : 'bg-red-950/60 text-red-300 border border-red-800'
            }`}>
              {statusMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-xl text-base flex items-center justify-center gap-2 shadow-lg shadow-rose-950/50 active:scale-[0.98] transition-transform"
          >
            <CheckCircle2 className="w-5 h-5" />
            {isSubmitting ? '上傳中...' : '上傳至 Google Sheet'}
          </button>
        </form>
      </main>
    </div>
  );
};
