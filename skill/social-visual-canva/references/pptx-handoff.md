# 打包與驗收

使用環境中的簡報工具時，先讀該工具的技能。也可使用隨附 `scripts/build-editable.mjs manifest.json output-folder`。

腳本需要 `@oai/artifact-tool`。Codex Desktop 用 `load_workspace_dependencies` 找到套件路徑，將模組入口放入 `ARTIFACT_TOOL_MODULE` 環境變數。其他環境可正常解析已安裝套件。腳本不自動安裝依賴。

Manifest 的座標、字級以像素表示，圖片路徑相對 manifest：

```json
{"width":1080,"height":1080,"images":[{"path":"background.png","name":"主視覺","x":0,"y":0,"width":1080,"height":1080}],"texts":[{"text":"立即預約","x":70,"y":950,"width":900,"height":70,"fontSize":32,"fontFamily":"Microsoft JhengHei","color":"#4D2C0D","align":"center"}]}
```

圖片依 images 順序放入，再放文字。特殊字 PNG 加到 images。底圖必須先去除對應文字，避免重複。輸出 `editable.pptx`、`preview.png`，已有同名檔案會拒絕覆寫，請用新輸出資料夾。

驗收必須區分：

- 本機：圖片嵌入、文字為原生物件、預覽沒有溢出或殘字。
- Canva：官網實際匯入，取得新設計 URL，文字可選取並顯示字型控制。
- 外觀：對照原圖的產品、光影、構圖與文字。不能把結構驗證當作外觀一致的證明。

一般文字替換字型、AI 去字與透明字抽取仍可能產生差異。主視覺合併保留，不承諾全拆或完全一致。使用者已要求整套上傳時執行已授權範圍，不重複要求確認。
