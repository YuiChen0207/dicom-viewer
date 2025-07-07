import React, { useEffect, useRef, useState } from "react";

// ✅ 引入 Cornerstone v2 的核心與工具套件
import cornerstone from "cornerstone-core"; // 核心功能：載入與顯示 DICOM 影像
import cornerstoneWADOImageLoader from "cornerstone-wado-image-loader"; // 讀取 .dcm 檔案所需的 Loader
import dicomParser from "dicom-parser"; // 解析 DICOM 的檔案標頭
import cornerstoneTools from "cornerstone-tools"; // 提供工具操作（放大、平移、量測等）

// ✅ 一定要引入這兩個
import Hammer from "hammerjs"; // 手勢操作（支援觸控或滑鼠拖拉）
import cornerstoneMath from "cornerstone-math"; // 工具的數學運算支援

function App() {
  // ✅ 建立 DOM 參考，用於放置 DICOM 顯示容器
  const elementRef = useRef(null);

  // ✅ 設定 Window Center（亮度）與 Window Width（對比）的 state
  const [windowCenter, setWindowCenter] = useState(128); // 預設亮度
  const [windowWidth, setWindowWidth] = useState(256); // 預設對比

  useEffect(() => {
    // ✅ 將外部函式掛載進套件
    cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
    cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
    cornerstoneTools.external.cornerstone = cornerstone;
    cornerstoneTools.external.Hammer = Hammer;
    cornerstoneTools.external.cornerstoneMath = cornerstoneMath;

    // ✅ 啟動 Web Worker 加快解碼速度
    cornerstoneWADOImageLoader.webWorkerManager.initialize({
      maxWebWorkers: navigator.hardwareConcurrency || 1, // 使用瀏覽器支援的核心數量
      startWebWorkersOnDemand: true, // 需要時才啟動
      taskConfiguration: {
        decodeTask: {
          initializeCodecsOnStartup: false, // 延遲載入解碼器
          usePDFJS: false, // 不使用 PDFJS（不處理 PDF 類影像）
        },
      },
    });

    // ✅ 初始化工具系統
    cornerstoneTools.init();

    // ✅ 啟用 DOM 元素，讓 Cornerstone 可以顯示影像
    const element = elementRef.current;
    cornerstone.enable(element);

    // ✅ 加入各種工具
    cornerstoneTools.addTool(cornerstoneTools.ZoomTool); // 放大縮小工具
    cornerstoneTools.addTool(cornerstoneTools.PanTool); // 平移工具
    cornerstoneTools.addTool(cornerstoneTools.MagnifyTool); // 放大鏡工具

    // ✅ 指定滑鼠按鈕操作：左鍵 Zoom、右鍵 Pan、中鍵 Magnify
    cornerstoneTools.setToolActive("Zoom", { mouseButtonMask: 1 });
    cornerstoneTools.setToolActive("Pan", { mouseButtonMask: 2 });
    cornerstoneTools.setToolActive("Magnify", { mouseButtonMask: 4 });

    // ✅ 清理資源
    return () => {
      cornerstone.disable(element); // 取消啟用 DOM 元素
      cornerstoneWADOImageLoader.webWorkerManager.terminate(); // 停止 worker
    };
  }, []);

  //上傳 DICOM 檔案的處理邏輯
  const handleFile = async (e) => {
    const file = e.target.files[0]; // 只處理第一個上傳的檔案
    if (!file) return;

    try {
      // ✅ 把檔案加入 Cornerstone 的 fileManager，回傳 imageId
      const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(file);

      // ✅ 非同步載入 DICOM 影像
      const image = await cornerstone.loadImage(imageId);

      // ✅ 拿到 DOM 元素
      const element = elementRef.current;

      // ✅ 顯示影像在指定 DOM 元素
      cornerstone.displayImage(element, image);

      // ✅ 重設視角與 VOI 設定
      cornerstone.reset(element);

      // ✅ 設定初始亮度與對比（若有從影像取得）
      setWindowCenter(image.windowCenter || 128);
      setWindowWidth(image.windowWidth || 256);

      console.log("✅ DICOM 顯示成功", image);
    } catch (err) {
      console.error("❌ 顯示失敗：", err);
    }
  };

  //根據 VOI 更新影像畫面
  const updateViewport = (newCenter, newWidth) => {
    const element = elementRef.current;
    const viewport = cornerstone.getViewport(element); // 拿到目前影像的 viewport 設定

    // ✅ 改變亮度與對比值
    viewport.voi.windowCenter = newCenter;
    viewport.voi.windowWidth = newWidth;

    // ✅ 套用新的 viewport 設定
    cornerstone.setViewport(element, viewport);
  };

  //當亮度或對比變動時更新畫面
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const image = cornerstone.getImage(element); // 確認有影像已載入
    if (image) {
      updateViewport(windowCenter, windowWidth); // 套用變更
    }
  }, [windowCenter, windowWidth]); // ✅ 每當滑桿更新時觸發

  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <h1>DICOM Viewer</h1>

      {/* ✅ 檔案上傳 */}
      <input
        type="file"
        accept=".dcm,.DCM"
        onChange={handleFile}
        style={{ marginBottom: 20 }}
      />

      {/* ✅ 顯示影像的容器 */}
      <div
        ref={elementRef}
        style={{
          width: 512,
          height: 512,
          border: "1px solid #ccc",
          margin: "0 auto",
          position: "relative",
        }}
      />

      {/* ✅ 控制亮度與對比的滑桿 */}
      <div style={{ width: "60%", margin: "auto", marginTop: 20 }}>
        <label>
          🔆 亮度 (Window Center): {windowCenter}
          <input
            type="range"
            min="-500"
            max="500"
            value={windowCenter}
            onChange={(e) => setWindowCenter(Number(e.target.value))}
          />
        </label>

        <br />

        <label>
          🎚️ 對比 (Window Width): {windowWidth}
          <input
            type="range"
            min="1"
            max="1000"
            value={windowWidth}
            onChange={(e) => setWindowWidth(Number(e.target.value))}
          />
        </label>
      </div>
    </div>
  );
}

export default App;
