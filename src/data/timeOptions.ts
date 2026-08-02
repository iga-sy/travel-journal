export const TIME_OPTIONS: string[] = Array.from({ length: 24 * 4 }, (_, i) => {
  const h = Math.floor(i / 4);
  const m = (i % 4) * 15;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});

// 15分刻みに一致しない既存値（万一のイレギュラーなデータ）も選べるように、
// 選択肢に無ければ現在値を差し込む。
export function timeOptionsWithCurrent(current: string): string[] {
  if (!current || TIME_OPTIONS.includes(current)) return TIME_OPTIONS;
  return [...TIME_OPTIONS, current].sort();
}

// 写真のEXIF時刻など15分刻みではない値を、一番近い15分刻みに丸める。
export function roundToNearestSlot(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const clamped = Math.min(Math.round((h * 60 + m) / 15) * 15, 23 * 60 + 45);
  return `${String(Math.floor(clamped / 60)).padStart(2, "0")}:${String(clamped % 60).padStart(2, "0")}`;
}
