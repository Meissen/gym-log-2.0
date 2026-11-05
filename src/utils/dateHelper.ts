/**
 * 本地真實時間格式化工具
 * 直接抓取手機/設備當前的系統時區與時間，徹底解決 UTC 8 小時時差問題
 * 格式範例：2026-11-05 15:45:20
 */
export const formatLocalDateTime = (date: Date = new Date()): string => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * 取得純日期字串 (YYYY-MM-DD)
 */
export const getLocalDateString = (dateStr?: string): string => {
  if (!dateStr) return formatLocalDateTime().substring(0, 10);
  return dateStr.substring(0, 10);
};
