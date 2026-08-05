# 啟動與部署

本檔說明如何在本地啟動 AI 漫畫藝廊，以及部署到 Vercel 的完整步驟。

---

## 1. 必要前置

- **Node.js** 20.9 以上（專案使用 Next.js 16，最低需求 20.9 LTS）
- **npm** 10 以上（或相容的 pnpm / yarn）
- 一個 **Cloudinary** 免費帳號（[註冊](https://cloudinary.com/users/register/free)）。免費額度：25 credits/月，個人漫畫站綽綽有餘。
- 終端機可執行 `node`、`npx` 指令。

---

## 2. 安裝依賴

```bash
npm install
```

---

## 3. 設定環境變數

複製範本後填入實際值：

```bash
cp .env.example .env.local
```

`.env.local` 需填寫 6 個變數：

| 變數 | 說明 | 取得方式 |
|---|---|---|
| `ADMIN_USERNAME` | 管理員帳號（自訂） | 自行命名，例如 `admin` |
| `ADMIN_PASSWORD_HASH` | 管理員密碼的 bcrypt 雜湊 | 見下方「產生密碼雜湊」 |
| `SESSION_SECRET` | Session 簽章密鑰（32+ 字元隨機字串） | 見下方「產生密鑰」 |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary 雲端名稱 | Cloudinary Dashboard 左上角 |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | Dashboard → Settings → API Keys |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | 同上（點 Reveal 顯示） |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | 給瀏覽器端 image loader 用，與 `CLOUDINARY_CLOUD_NAME` 相同 | 同上 |

> **重要**：`ADMIN_PASSWORD_HASH` 存的是**雜湊**，不是明文密碼。明文密碼不需要寫進任何檔案。

### 產生密碼雜湊

```bash
node scripts/hash-password.mjs "你想要的密碼"
```

輸出類似 `$2b$10$abcd...`，整段貼到 `ADMIN_PASSWORD_HASH`。

### 產生 Session 密鑰

PowerShell：

```powershell
[Convert]::ToBase64String((1..32 | % { Get-Random -Maximum 256 }))
```

或使用 OpenSSL（若有安裝）：

```bash
openssl rand -base64 32
```

### Cloudinary 憑證

登入 [Cloudinary Console](https://console.cloudinary.com/)，在 Dashboard 首頁的 **API Environment variables** 或 **Settings → API Keys** 區塊即可找到上述三個值。

---

## 4. 本地啟動

```bash
npm run dev
```

預設網址 `http://localhost:3000`。

- `/` 公開首頁（主題展間牆）
- `/login` 管理員登入
- `/admin` 主題管理（需登入）
- `/admin/upload` 作品上傳（需登入）

### 首次上架作品流程

1. 開啟 `/login`，用剛才設定的帳號 + **明文密碼** 登入（不是雜湊值）。
2. 進入 `/admin`，點「＋ 新增主題」，輸入標題、簡介、氛圍色。
3. 進入 `/admin/upload`，選擇剛建立的主題，拖曳圖片或點擊選檔。
4. 可用 ↑↓ 調整順序、填寫每頁說明文字。
5. 點「開始上傳」，圖片會直接傳到 Cloudinary（不經過伺服器檔案系統）。
6. 上傳完成後前台會自動 revalidate，到 `/` 或 `/gallery/<slug>` 即可看到新展間。

---

## 5. 生產建置（自架 Node 伺服器）

```bash
npm run build
npm run start
```

預設監聯 `http://localhost:3000`。環境變數必須在執行環境中設定（不能只靠 `.env.local`，那個檔案不會進 production）。可用 `NODE_ENV=production` 並透過系統環境變數或啟動指令注入：

```bash
# 範例（Linux/macOS）
NODE_ENV=production ADMIN_USERNAME=admin ADMIN_PASSWORD_HASH='...' \
SESSION_SECRET='...' CLOUDINARY_CLOUD_NAME='...' \
CLOUDINARY_API_KEY='...' CLOUDINARY_API_SECRET='...' \
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME='...' npm run start
```

---

## 6. 部署到 Vercel（推薦）

Vercel 是 Next.js 官方平台，免費方案即可跑此專案。

### 步驟

1. **推送程式碼到 GitHub / GitLab / Bitbucket**
   專案已 init 為 git repo，建立 remote 後 `git push`。

2. **在 Vercel 匯入專案**
   登入 [vercel.com](https://vercel.com) → New Project → 選擇此 repo。
   Framework Preset 會自動偵測為 Next.js，**無需更改任何 Build/Output 設定**（Turbopack 預設啟用）。

3. **設定環境變數**
   在 Project Settings → Environment Variables 新增以下 6 個，**所有環境**（Production / Preview / Development）都加上：

   ```
   ADMIN_USERNAME
   ADMIN_PASSWORD_HASH
   SESSION_SECRET
   CLOUDINARY_CLOUD_NAME
   CLOUDINARY_API_KEY
   CLOUDINARY_API_SECRET
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
   ```

   > `NEXT_PUBLIC_*` 變數會被打包進用戶端，**建置時就讀取**。其餘在執行時讀取。建議設好後重新 redeploy 一次。

4. **部署**
   點 Deploy。首次 build 約 1–2 分鐘。完成後會拿到 `https://<你的專案>.vercel.app` 網址。

5. **驗證**
   - 開首頁（無 Cloudinary 設定也可載入，只是會顯示空狀態）
   - 開 `/login` 用明文密碼登入
   - 上傳一張測試圖，確認前台能即時看到

### 後續更新

只要 `git push` 到同步的 branch，Vercel 會自動 re-build 與部署。也可在 Dashboard 手動 Redeploy。

---

## 7. Cloudinary 使用注意事項

- **儲存結構**：
  - 圖片資料夾：`comic-gallery/<主題 slug>/`
  - 主題清單：`comic-gallery/themes.json`（raw 檔，由程式自動維護，勿手動改）
  - 每張圖的排序與說明存在圖片的 `context` metadata（`order` 與 `caption` 欄位）
- **刪除主題**會透過 Admin API 同時刪除資料夾內所有圖片。
- **免費額度**：每月 25 credits（儲存 + 流量 + 轉檔合計）。前台列表用縮圖、燈箱才取大圖，能有效省額度。可在 Cloudinary Dashboard → Usage 查看用量。
- **Admin API 限速**：每小時 500 次。前台用 ISR 快取（1 小時過期，上傳後 on-demand revalidate）避免撞限制。

---

## 8. 變更管理員帳密

- **改帳號**：改 `ADMIN_USERNAME` 環境變數後 redeploy。
- **改密碼**：重新跑 `node scripts/hash-password.mjs "新密碼"`，把新雜湊貼到 `ADMIN_PASSWORD_HASH`，redeploy。舊 session 會在新部署後失效（cookie 驗證靠 `SESSION_SECRET`，但密碼比對靠 hash，hash 一換舊密碼就登不進去）。

---

## 9. 常見問題

**Q: 首頁空白、看不到主題？**
A: 確認 `CLOUDINARY_*` 三個變數都填了，且 `comic-gallery/themes.json` 已存在（會在你用後台建立第一個主題時自動產生）。

**Q: 上傳卡在「uploading」？**
A: 多半是 `CLOUDINARY_API_SECRET` 填錯，server 簽不出有效簽章。檢查 Vercel 環境變數是否正確。

**Q: 登入一直失敗、但又沒報「密碼錯誤」？**
A: 可能是 `ADMIN_PASSWORD_HASH` 為空或格式錯誤（必須以 `$2b$` 開頭）。重新跑 hash-password 腳本。

**Q: 部署後前台沒更新？**
A: 前台走 ISR 快取（1 小時）。後台上傳/改主題會自動觸發 revalidate；若想立即刷新，可在 `/admin` 做任意一次編輯儲存。