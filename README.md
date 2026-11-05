# Social Visual Canva Bridge

把社群視覺 Skill 的選定方案，轉成 Canva 可編輯圖層。

## 本機測試

```powershell
npm test
```

## 安裝 Skill

下載 `skill/social-visual-canva/SKILL.md` 到你的 Codex Skills 目錄。Skill 會先給三張完成成品；使用者選定後才會建立 Canva 圖層資料。

## 真正建立 Canva 草稿

此 repository 的離線測試不會登入 Canva。要建立真實草稿，仍需註冊 Canva 開發者 App、設定 OAuth、安裝 Canva App，並依 Canva 的公開整合規則完成審核。沒有這些帳號設定時，系統只能驗證圖層資料與操作順序，不能宣稱已建立真實 Canva 草稿。

## 隱私

橋接工作只保存驗證後的圖層資料與素材參照，24 小時後清除；不保存原始提示詞或客戶識別資料。
