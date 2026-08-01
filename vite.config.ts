import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages ではリポジトリ名によってパスが変わるため、相対パス基準でビルドする。
export default defineConfig({
  base: "./",
  plugins: [react()],
});
