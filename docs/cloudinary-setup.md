# Cloudinary 完整申請與設定

本檔從零開始說明如何申請 Cloudinary 免費帳號、取得 API 憑證，並接到本專案。

---

## 1. 什麼是 Cloudinary？為什麼用它？

Cloudinary 是圖片／影片的雲端託管與 CDN 服務。本專案用它來：

- **儲存**漫畫圖片（免費 25 credits/月，個人站夠用）
- **自動轉檔與壓縮**（`f_auto` / `q_auto`，依瀏覽器給 WebP/AVIF）
- **即時縮圖**（列表用小圖、燈箱用大圖，省流量）
- **CDN 全球加速**
- **EXIF 自動轉正**（手機拍的圖方向不會歪）

本站**不用資料庫**：主題清單存成 Cloudinary 上的 `comic-gallery/themes.json`，圖片用資料夾分主題。

---

## 2. 申請免費帳號

1. 開啟 [Cloudinary 免費註冊頁](https://cloudinary.com/users/register/free)。
2. 填寫：
   - **Email**
   - **Password**
   - **First name / Last name**（可用真實或暱稱）
3. 勾選服務條款 → 點 **Create Account**。
4. 到信箱點擊驗證信中的連結（未驗證前部分功能可能受限）。
5. 首次登入會出現 **Product Environment** 設定：
   - **Cloud name** 可自訂（例如 `ai-comic-gallery`），之後很難改，建議用好記的英文。
   - 若跳過，系統會自動給一個隨機 cloud name（例如 `dxxxxabc`），也能用。
6. 進入 [Cloudinary Console](https://console.cloudinary.com/)。

> 免費方案（Free）無需綁信用卡。額度：約 25 credits/月（儲存 + 流量 + 轉換合計）。個人漫畫站通常遠低於此。

---

## 3. 取得 API 憑證（三件套）

登入後在 Console 首頁，或走：

**Settings（齒輪）→ API Keys**

你會看到：

| 欄位 | 對應本專案環境變數 | 說明 |
|---|---|---|
| **Cloud name** | `CLOUDINARY_CLOUD_NAME` 與 `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | 公開，會出現在圖片 URL 裡 |
| **API Key** | `CLOUDINARY_API_KEY` | 公開程度中等，仍勿提交到 git |
| **API Secret** | `CLOUDINARY_API_SECRET` | **機密**，只放伺服器端環境變數，絕不下瀏覽器 |

### 操作步驟

1. 左側選單點 **Settings**（或右上角頭像 → Settings）。
2. 左側選 **API Keys**（或 **Product Environment Settings → API Keys**）。
3. 若還沒有 Key，點 **Generate New API Key**。
4. 複製：
   - **Cloud name**（頁面上方也會顯示）
   - **API Key**
   - **API Secret**（點 **Reveal** / 眼睛圖示才會顯示）
5. 建議把這三個值先暫存在密碼管理器，等下要貼進 `.env.local`。

> **安全提醒**
> - `API Secret` 等同帳號密碼，外洩後別人可刪你全部圖、耗光額度。
> - 不要截圖發到公開頻道、不要 commit 進 git。
> - 本專案 `.gitignore` 已忽略 `.env.local`，但推送前仍請確認。

---

## 4. 接到本專案（本地）

### 4.1 寫入 `.env.local`

專案根目錄：

```bash
cp .env.example .env.local
```

用編輯器打開 `.env.local`，填入（範例值請換成你的）：

```env
# 管理員（與 Cloudinary 無關，但一併設定）
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=          # 用 node scripts/hash-password.mjs "密碼" 產生
SESSION_SECRET=              # 隨機 32+ 字元

# Cloudinary（從 Dashboard 複製）
CLOUDINARY_CLOUD_NAME=dxxxxabc
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dxxxxabc
```

注意：

- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` **必須與** `CLOUDINARY_CLOUD_NAME` **相同**（前者給瀏覽器端 image loader 用）。
- 值兩側不要加引號，除非值本身含空白（通常不會）。
- 改完 `.env.local` 後若 `npm run dev` 已在跑，**請重啟**一次才會讀到新變數。

### 4.2 驗證是否接上

```bash
npm run dev
```

1. 開 `http://localhost:3000` → 首頁應能載入（尚無主題時顯示空狀態）。
2. 登入 `/login` → `/admin` 新增一個主題。
3. 到 `/admin/upload` 上傳 1～2 張測試圖。
4. 回到 Cloudinary Console → **Media Library**，應看到：
   - 資料夾 `comic-gallery/`
   - 其下有 `<你的主題 slug>/` 與圖片
   - 以及 raw 檔 `themes`（或 `themes.json`，public_id 為 `comic-gallery/themes`）

若上傳失敗，見文末「常見問題」。

---

## 5. 接到 Vercel 部署

1. 開啟 [Vercel Dashboard](https://vercel.com) → 你的專案 → **Settings → Environment Variables**。
2. 新增下列變數（建議 Production / Preview / Development 都勾選）：

   | Name | Value |
   |---|---|
   | `CLOUDINARY_CLOUD_NAME` | 你的 cloud name |
   | `CLOUDINARY_API_KEY` | 你的 API Key |
   | `CLOUDINARY_API_SECRET` | 你的 API Secret |
   | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | 與 cloud name 相同 |
   | （另需）`ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH` / `SESSION_SECRET` | 見 `docs/setup-and-deploy.md` |

3. 儲存後到 **Deployments** → 最新一筆 → **⋯ → Redeploy**（`NEXT_PUBLIC_*` 必須重新 build 才會進前端 bundle）。
4. 部署完成後用正式網址登入後台，再上傳一張測試圖確認。

---

## 6. Console 建議設定（可選但實用）

以下皆在 Cloudinary Console 操作，**本專案預設不依賴 Upload Preset**（走 server 簽章直傳），但下列設定有助於管理與安全。

### 6.1 確認 Media Library 可見

**Media Library** → 左側資料夾樹。上傳成功後應出現 `comic-gallery`。若看不到，右上角確認是否選對 **Product Environment**（有多個環境時容易搞錯）。

### 6.2 上傳限制（建議）

**Settings → Security**（或 Upload）：

- 可限制允許的檔案類型為圖片（image）。
- 可設定最大檔案大小（例如 10–20 MB），避免誤傳超大原圖吃光額度。

本專案上傳是 **signed upload**（每次由自家 server 簽章），即使有人拿到 API Key 也無法任意上傳，仍須通過你的管理員 session。

### 6.3 不需要手動建 Upload Preset

本站流程：

```
瀏覽器 → POST /api/upload/signature（需登入）→ 取得簽章
瀏覽器 → 直傳 https://api.cloudinary.com/v1_1/<cloud>/image/upload
```

因此**不必**在 Console 建立 unsigned upload preset。若你之後要改成 unsigned 直傳，才需要 Preset；目前不建議。

### 6.4 備份與刪除

- 刪主題：請用本站 `/admin` 的「刪除」按鈕，會一併清 Cloudinary 該資料夾圖片與 `themes.json` 記錄。
- 勿在 Media Library 手動亂刪 `comic-gallery/themes`，否則前台主題清單會空掉（圖片還在但對應不到）。
- 若誤刪 `themes`：可到 `/admin` 重新「新增主題」寫回清單；既有圖片 public_id 仍在，可手動在 Console 把封面 public_id 抄回後台編輯封面欄（進階）。

### 6.5 用量監控

**Dashboard → Account → Usage**（或 Billing / Usage）：

- 查看本月 credits、儲存空間、頻寬。
- 接近 25 credits 時，可：刪除測試圖、列表少用超大圖、或升級方案。

---

## 7. 本專案在 Cloudinary 上的資料結構

了解結構有助於排查問題：

```
comic-gallery/                          ← 根資料夾（public_id 前綴）
├── themes                              ← raw JSON，主題清單（public_id: comic-gallery/themes）
├── midnight-city/                      ← 主題 slug = 資料夾名
│   ├── 1712345678901-001               ← 單頁圖片
│   └── 1712345678901-002
└── robot-dreams/
    └── ...
```

- **主題中繼資料**（標題、簡介、封面 public_id、氛圍色、建立日期）存在 `comic-gallery/themes` 這支 raw JSON。
- **每頁說明與排序**存在該圖片的 **context** metadata：
  - `order`：數字，愈小愈前面
  - `caption`：說明文字（可空）
- 圖片 URL 範例（由本站 loader 產生）：

  ```
  https://res.cloudinary.com/<cloud_name>/image/upload/f_auto,a_exif,c_limit,w_800,q_auto/comic-gallery/midnight-city/1712345678901-001
  ```

---

## 8. 常見問題

### Q1：註冊後找不到 API Secret？

Settings → API Keys → 對應那一列點 **Reveal** / 眼睛。若是舊帳號且 Secret 遺失，可 **Generate New API Key** 產生一組新的，並作廢舊 Key。

### Q2：上傳回報簽章失敗 / 401？

依序檢查：

1. `CLOUDINARY_API_SECRET` 是否完整、無多餘空白或換行。
2. `CLOUDINARY_API_KEY` 與 Secret 是否同一組 Key。
3. `CLOUDINARY_CLOUD_NAME` 是否正確（區分大小寫）。
4. 本地有改 `.env.local` 是否已重啟 `npm run dev`。
5. Vercel 是否已 Redeploy（改 env 後）。

### Q3：上傳成功但前台沒圖？

1. Media Library 確認檔案在 `comic-gallery/<slug>/`。
2. `/admin` 是否有該主題；封面是否選到存在的 public_id。
3. 瀏覽器開 F12 → Network，看圖片 URL 的 cloud name 是否正確（應來自 `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`）。
4. 硬重新整理或等 ISR 更新（上傳後本站會呼叫 revalidate；若仍舊，可在後台再儲存一次主題）。

### Q4：首頁一直空白、後台也建不了主題？

多半是 server 端三個 `CLOUDINARY_*` 沒設齊。建主題時會寫 `themes.json` 到 Cloudinary，沒憑證會失敗。看終端機或 Vercel Function Logs 錯誤訊息。

### Q5：免費額度會不會突然用完？

個人站通常不會。耗 credits 的主要是：

- 儲存空間（圖很多、每張都是未壓縮原圖）
- 頻寬（分享出去後大量人造訪）
- 轉換次數（每次請求不同尺寸會算 transform；本站用 CDN 快取 + 固定 transform 參數，可重用）

建議：上傳前在本地先壓到合理解析度（長邊 2000px 內已足夠螢幕閱讀）。

### Q6：可以換 Cloudinary 帳號嗎？

可以。換新的三件套寫進環境變數並 redeploy。**舊帳號的圖不會自動搬過去**；需要的話用 Cloudinary 的 migration 工具或重新上傳。

### Q7：要開「Restricted media types」或「Strict transformations」嗎？

初學者建議維持預設即可。進階安全可之後再開：

- **Strict transformations**：只允許已簽章的 transform，可防他人亂組 URL 刷轉換額度；但要確認本站 loader 產生的 transform 都在允許清單（目前用 signed upload 管寫入、讀取走公開 URL，一般免費帳預設已夠用）。

### Q8：一個 Cloudinary 帳號能給多個網站用嗎？

可以。用不同根資料夾前綴即可。本專案固定用 `comic-gallery/`，其他專案用別的前綴就不會撞。

---

## 9. 檢查清單（做完請勾）

- [ ] 已註冊並驗證 Email
- [ ] 已記下 Cloud name / API Key / API Secret
- [ ] `.env.local`（或 Vercel Env）六個變數都已填（含管理員三個）
- [ ] `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` = `CLOUDINARY_CLOUD_NAME`
- [ ] `npm run dev` 可開首頁
- [ ] 能登入 `/admin` 並建立主題
- [ ] 能上傳至少一張圖，Media Library 看得到
- [ ] 前台 `/gallery/<slug>` 看得到圖
- [ ] （若上 Vercel）Redeploy 後正式網址同樣可上傳

完成以上即表示 Cloudinary 已完整接入本專案。更完整的啟動／部署流程見 [`setup-and-deploy.md`](./setup-and-deploy.md)。
