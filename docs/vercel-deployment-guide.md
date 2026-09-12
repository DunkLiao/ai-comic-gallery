# Vercel 部署指南

本文件說明如何將 `ai-comic-gallery` 部署到 Vercel。此專案是 Next.js 16.3.0 專案，Vercel 可以自動偵測 Next.js 設定，不需要額外新增 `vercel.json`。

## 部署前確認

### 1. 確認程式碼狀態

專案目前已連到 GitHub remote：

```text
https://github.com/DunkLiao/ai-comic-gallery.git
```

部署前建議先確認工作樹與分支狀態：

```powershell
git status --short --branch
```

若有需要同步到 GitHub，執行：

```powershell
git push origin master
```

### 2. 確認本機可以建置

Vercel 預設會執行 `npm run build`。本專案已確認此指令可成功通過：

```powershell
npm run build
```

若本機建置失敗，建議先修正後再部署，避免 Vercel build 階段失敗。

## 匯入 Vercel

1. 開啟 [Vercel New Project](https://vercel.com/new)。
2. 選擇 GitHub repository：`DunkLiao/ai-comic-gallery`。
3. Framework Preset 保持 `Next.js`。
4. Build Command 保持預設：`npm run build`。
5. Install Command 保持預設：`npm install`。
6. Output Directory 留空或保持預設。
7. 先不要按 Deploy，先設定環境變數。

## 設定環境變數

到 Vercel 專案的 Project Settings -> Environment Variables，新增下列變數。建議 Production、Preview、Development 都套用相同設定：

```text
ADMIN_USERNAME
ADMIN_PASSWORD_HASH
SESSION_SECRET
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
```

### 管理員帳號

`ADMIN_USERNAME` 是後台登入帳號，可自行設定，例如：

```text
ADMIN_USERNAME=admin
```

### 管理員密碼雜湊

`ADMIN_PASSWORD_HASH` 必須填 bcrypt hash，不要填明文密碼。

在本機執行：

```powershell
node scripts/hash-password.mjs "你的管理員密碼"
```

將輸出的完整 hash 貼到 Vercel 的 `ADMIN_PASSWORD_HASH`。之後登入 `/login` 時，使用的是原本的明文密碼，不是 hash。

### Session Secret

`SESSION_SECRET` 用於簽署登入 session，請產生 32 bytes 以上的隨機字串：

```powershell
[Convert]::ToBase64String((1..32 | % { Get-Random -Maximum 256 }))
```

將輸出結果填入 `SESSION_SECRET`。

### Cloudinary 變數

從 Cloudinary Dashboard 的 API Keys 或 API Environment variables 取得：

```text
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` 要填與 `CLOUDINARY_CLOUD_NAME` 相同的值。這個變數會被打包到瀏覽器端，因此必須在 Vercel build 前設定完成。

## 開始部署

環境變數設定完成後，回到 Vercel 匯入流程並按 Deploy。

首次部署完成後，Vercel 會提供正式網址，格式通常是：

```text
https://<project-name>.vercel.app
```

若之後有修改環境變數，請在 Vercel Dashboard 重新 Redeploy，確保 build-time 變數重新打包。

## 部署後驗證

部署完成後，依序確認：

1. 開啟首頁 `/`，確認頁面正常載入。
2. 開啟 `/login`，使用 `ADMIN_USERNAME` 與明文密碼登入。
3. 開啟 `/admin`，建立一個測試主題。
4. 開啟 `/admin/upload`，上傳一張測試圖片。
5. 回到首頁與 `/gallery/<slug>`，確認主題與圖片正常顯示。

如果首頁正常但沒有任何主題，通常代表 Cloudinary 尚未建立 `comic-gallery/themes.json`。登入後台新增第一個主題後，程式會自動建立相關資料。

## 後續更新

Vercel 匯入 GitHub repository 後，之後只要推送到 production branch，通常是 `master`，Vercel 就會自動重新 build 與部署：

```powershell
git push origin master
```

也可以到 Vercel Dashboard 手動按 Redeploy。

## 常見問題

### 首頁看不到主題

確認 `CLOUDINARY_CLOUD_NAME`、`CLOUDINARY_API_KEY`、`CLOUDINARY_API_SECRET` 都已在 Vercel 正確設定，且已透過後台建立至少一個主題。

### 上傳卡住或失敗

通常是 `CLOUDINARY_API_SECRET` 錯誤，導致 server 端無法產生有效上傳簽章。請重新檢查 Vercel 環境變數。

### 登入失敗

確認 `ADMIN_PASSWORD_HASH` 是透過 `scripts/hash-password.mjs` 產生的 bcrypt hash，且登入時輸入的是原本明文密碼。

### 修改環境變數後前台仍沒有更新

請在 Vercel Dashboard 重新 Redeploy。尤其 `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` 是 build-time 變數，修改後必須重新建置才會生效。
