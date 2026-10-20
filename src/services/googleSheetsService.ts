import { HealthRecord, TrainingFlatRow, MovementSetting, SystemSettings, Movement } from '../types/models';

export class GoogleSheetsService {
  public static getUrl(): string {
    return localStorage.getItem('gas_webapp_url') || '';
  }

  public static setUrl(url: string) {
    localStorage.setItem('gas_webapp_url', url.trim());
  }

  // 1. GET: 同步全站資料
  public static async fetchAllData(): Promise<{
    health: HealthRecord[];
    movements: { movements: Movement[]; methods: string[] };
    settings: { system: Partial<SystemSettings>; movementSettings: MovementSetting[] };
  }> {
    const url = this.getUrl();
    if (!url) throw new Error('尚未設定 Google Apps Script Web App URL，請先前往「設定」輸入。');

    const res = await fetch(`${url}?action=syncAll`, {
      method: 'GET',
      mode: 'cors',
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || '同步失敗');
    return json.data;
  }

  // 2. POST: 上傳健康數據
  public static async uploadHealth(data: Partial<HealthRecord>) {
    return this.postRequest('uploadHealth', data);
  }

  // 3. POST: 批次上傳訓練數據
  public static async uploadTrainingBatch(rows: TrainingFlatRow[]) {
    return this.postRequest('uploadTrainingBatch', rows);
  }

  // 4. POST: 儲存設定數據
  public static async saveSettings(payload: { system: SystemSettings; movementSettings: MovementSetting[] }) {
    return this.postRequest('saveSettings', payload);
  }

  // 5. POST: 清除測試數據
  public static async clearTestData() {
    return this.postRequest('clearTestData', {});
  }

  private static async postRequest(action: string, payload: unknown) {
    const url = this.getUrl();
    if (!url) throw new Error('尚未設定 Google Apps Script Web App URL，請先前往「設定」輸入。');

    const res = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, payload }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || `操作失敗: ${action}`);
    return json;
  }
}
