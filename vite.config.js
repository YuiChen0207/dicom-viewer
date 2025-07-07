import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  base: "/dicom-viewer/", // <- 加上你的 repo 名稱，確保資源路徑正確
  plugins: [react()],
});
