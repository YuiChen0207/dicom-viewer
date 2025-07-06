import { useEffect, useRef } from "react";

// ✅ 引入 cornerstone 核心（v2）
// 負責啟用影像容器、載入與顯示影像
import * as cornerstone from "cornerstone-core";

// ✅ 引入 cornerstone 的 WADO 影像載入器（支援 .dcm 檔案解析）
import * as cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";

// ✅ 引入 DICOM 檔解析器
import dicomParser from "dicom-parser";

function App() {
  // ✅ DOM 容器參考，放 DICOM 影像畫面
  const containerRef = useRef(null);

  useEffect(() => {
    // ✅ 綁定 cornerstone 核心給影像載入器使用
    cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
    cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

    // ✅ 初始化 Web Worker（v2 必須手動）
    cornerstoneWADOImageLoader.webWorkerManager.initialize({
      maxWebWorkers: navigator.hardwareConcurrency || 1, // 可使用幾個執行緒
      startWebWorkersOnDemand: true,
      taskConfiguration: {
        decodeTask: {
          initializeCodecsOnStartup: false, // 延遲初始化編解碼器，加快啟動速度
          usePDFJS: false, // 不支援 PDF
        },
      },
    });
  }, []); // 只執行一次（元件掛載時）

  // ✅ 使用者上傳檔案事件
  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // ✅ 加入檔案到 fileManager，產生 imageId（例如：wadouri:dicomfile:0）
    const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(file);
    const element = containerRef.current;

    try {
      // ✅ 啟用該容器讓 Cornerstone 可以渲染影像
      cornerstone.enable(element);

      // ✅ 非同步載入 DICOM 影像
      const image = await cornerstone.loadImage(imageId);

      // ✅ 將影像顯示在該 element 上
      cornerstone.displayImage(element, image);

      // ✅ 重設 viewport（視窗參數：例如 window width / center）
      cornerstone.reset(element);

      console.log("✅ 顯示成功", image);
    } catch (err) {
      console.error("❌ 顯示失敗：", err);
    }
  };

  return (
    <div style={{ padding: "1rem", textAlign: "center" }}>
      <h1>DICOM Viewer (Cornerstone v2)</h1>
      {/* ✅ 上傳 .dcm 檔案的輸入欄位 */}
      <input type="file" accept=".dcm,.DCM" onChange={handleFile} />

      {/* ✅ 用來顯示影像的容器 */}
      <div
        ref={containerRef}
        style={{
          width: 512,
          height: 512,
          margin: "20px auto",
          border: "1px solid #ccc",
        }}
      />
    </div>
  );
}

export default App;

/*
===============================
📌 與 Cornerstone v3 的主要差異
===============================

✅ v2 優點：
- API 比較簡單（直接 displayImage）
- 不需要自己建立 RenderingEngine / Viewport（自動處理）
- 適合初學者、小型專案
- 文件成熟穩定

⚠️ v3 特性（但也較複雜）：
- 需要建立 RenderingEngine 與 Viewport
- 需要自己手動 render()
- 模組化更完整，但學習門檻高
- 支援 3D Volume Rendering（CT/MRI）、GPU 加速

建議：
👉 新手先用 v2，先會讀圖、顯示、互動操作
👉 等熟悉 Cornerstone 再升級 v3，支援更高階功能（例如 MPR、AI）
*/