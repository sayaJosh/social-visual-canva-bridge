# Social Visual Canva Bridge

先產出三張完整社群成品，選定後保留主視覺、拆出常用文字，再透過 Canva 官網匯入可編輯 PPTX。

## 本機測試

```powershell
npm test
```

## 安裝 Skill

從 Code → Download ZIP 下載，將整個 `skill/social-visual-canva` 資料夾（包含 references、scripts）放入 `C:\Users\你的帳號\.codex\skills\social-visual-canva`，再開新對話。

輸入 `$social-visual-canva`，附上文案與產品原圖，要求三張 1:1 完整成品。選定後說「保留主視覺，只拆常用文字，打包 PPTX 並在側邊 Canva 官網上傳」。第一次請在 Canva 完成登入。

## 真正建立 Canva 草稿

需要圖片生成、PPTX 產製與瀏覽器操作能力。Skill 不會自行安裝這些工具。預設在側邊開 Canva 官方網站，確認登入後上傳 PPTX，不需要 Canva Developer App 或 API。

主視覺合併保留；一般文字可改，特殊效果字保留圖片或合併。字型替換及去字修補可能造成差異，不保證完全一致。只有網站實際匯入並檢查後才算 Canva 驗證完成。

`src/`、`canva-app/` 是早期橋接原型，不是這個官網工作流程的必需服務，也不是完整可部署的 Canva App。離線測試不代表 Canva 端到端通過。

## 隱私

官網流程會將選定設計的 PPTX 上傳至使用者自己的 Canva 帳號，適用 Canva 的保存規則；本機素材由使用者保留，不宣稱自動刪除。
