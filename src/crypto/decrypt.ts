export const PBKDF2_ITERATIONS = 600_000;

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export async function deriveKey(password: string, saltBase64: string, iterations: number): Promise<CryptoKey> {
  const salt = base64ToBytes(saltBase64);
  const passwordKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
}

// 各暗号化ファイルは [12byte IV][暗号文] の並びで保存されている
function splitIvAndCiphertext(buf: ArrayBuffer): { iv: Uint8Array; ciphertext: ArrayBuffer } {
  const bytes = new Uint8Array(buf);
  return { iv: bytes.slice(0, 12), ciphertext: bytes.slice(12).buffer };
}

async function decryptRaw(key: CryptoKey, buf: ArrayBuffer): Promise<ArrayBuffer> {
  const { iv, ciphertext } = splitIvAndCiphertext(buf);
  return crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, ciphertext);
}

export async function decryptToJson<T>(key: CryptoKey, buf: ArrayBuffer): Promise<T> {
  const plain = await decryptRaw(key, buf);
  return JSON.parse(new TextDecoder().decode(plain)) as T;
}

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
};

export function mimeTypeForPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

export async function decryptToBlob(key: CryptoKey, buf: ArrayBuffer, mimeType: string): Promise<Blob> {
  const plain = await decryptRaw(key, buf);
  return new Blob([plain], { type: mimeType });
}
