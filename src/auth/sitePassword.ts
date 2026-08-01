// 簡易的な閲覧ガード。サイトの静的ファイル自体は誰でも取得できるため、
// これは「見た目の鍵」であり本格的なアクセス制御ではない点に注意。
// パスワードは平文で埋め込まず、SHA-256ハッシュのみをビルド成果物に含める。
const PASSWORD_HASH = "de95b5b09473415e20dcaab1c59a64e947e6c8b23116fb9a3addfd1f6dcee28f";
const UNLOCK_KEY = "travel-journal-unlocked";

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyPassword(input: string): Promise<boolean> {
  const hash = await sha256(input);
  return hash === PASSWORD_HASH;
}

export function isUnlocked(): boolean {
  return localStorage.getItem(UNLOCK_KEY) === "1";
}

export function setUnlocked(): void {
  localStorage.setItem(UNLOCK_KEY, "1");
}
