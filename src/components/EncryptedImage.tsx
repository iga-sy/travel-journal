import { useEffect, useState, type ImgHTMLAttributes } from "react";
import { decryptToBlob, mimeTypeForPath } from "../crypto/decrypt";
import { useTripData } from "../data/TripDataContext";

const BASE = import.meta.env.BASE_URL;
const blobUrlCache = new Map<string, string>();

function encryptedUrlFor(path: string): string {
  return `${BASE}photos-enc/${path.replace(/^photos\//, "")}.enc`;
}

interface EncryptedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  path: string;
}

export default function EncryptedImage({ path, style, ...rest }: EncryptedImageProps) {
  const { imageKey } = useTripData();
  const [src, setSrc] = useState<string | null>(blobUrlCache.get(path) ?? null);

  useEffect(() => {
    if (!path) return;
    if (blobUrlCache.has(path)) {
      setSrc(blobUrlCache.get(path)!);
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await fetch(encryptedUrlFor(path));
      const buf = await res.arrayBuffer();
      const blob = await decryptToBlob(imageKey, buf, mimeTypeForPath(path));
      const url = URL.createObjectURL(blob);
      blobUrlCache.set(path, url);
      if (!cancelled) setSrc(url);
    })();
    return () => {
      cancelled = true;
    };
  }, [path, imageKey]);

  if (!path || !src) {
    return <div style={{ ...style, background: "var(--color-line)" }} aria-label={path ? "読み込み中" : "写真未設定"} />;
  }
  return <img src={src} style={style} {...rest} />;
}
