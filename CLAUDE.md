# GrowthHabit

習慣視覺化網站。每個習慣是一株珊瑚礁，在海底生長、發光、吸引生命。

## 核心原則

- 絕對不顯示表格或傳統打卡格
- 每次完成 → 有感的視覺生長（不只是加數字）
- 第 7 / 30 / 100 天里程碑有獨特特效
- 遵循 Karpathy 原則：最小可行，不超前設計

## 技術選型

| 層面 | 選擇 | 原因 |
|------|------|------|
| 渲染 | Canvas API | 動畫控制精準，無框架依賴 |
| JS | Vanilla JS | 零建置工具，直接開啟 index.html |
| 樣式 | Plain CSS | 不需要 preprocessor |
| 資料 | localStorage | MVP 夠用；後端等真正需要再加 |
| 部署 | Vercel | 靜態網站，git push 即部署 |

**無建置工具**。開發時直接 `open index.html`，不需要 npm、webpack、vite。

## 視覺隱喻

**已選：珊瑚礁生態系統**（Phase 0 確認）

一個習慣 = 一株珊瑚礁，生長在海底 Canvas 畫布上。

| 狀態 | 視覺表現 |
|------|----------|
| 每日打卡 | 珊瑚向上生長一節，頂端亮起一個發光息肉（Polyp） |
| 連續 7 天 | 珊瑚開始擺動（CSS wave），第一隻發光小魚繞著游 |
| 連續 30 天 | 珊瑚大開花，釋放發光孢子粒子特效，背景浮現巨型水母 |
| 連續 100 天 | 「亞特蘭提斯覺醒」— 海底浮現古代遺跡發光符文 |

**視覺色調**：深海藍黑（`#050D1A`）底，珊瑚用暖橘/粉紅系，發光用青白色 glow，符文用冷金色。

## 資料模型

```json
{
  "habits": [
    {
      "id": "uuid-string",
      "name": "習慣名稱",
      "color": "#FF6B6B",
      "createdAt": "2026-06-28",
      "completions": ["2026-06-28", "2026-06-29"],
      "streak": 2
    }
  ],
  "milestones": [
    {
      "habitId": "uuid-string",
      "type": "fish | jellyfish | atlantis",
      "unlockedAt": "2026-07-05"
    }
  ]
}
```

`milestone.type` 對應視覺層：
- `fish` → 7 天，發光小魚出現
- `jellyfish` → 30 天，巨型水母 + 孢子特效
- `atlantis` → 100 天，遺跡符文層淡入

localStorage key: `growthhabit_data`

## 檔案結構

```
index.html              ← 唯一入口，無 build step
src/
  main.js               ← 初始化，事件綁定
  habits.js             ← 資料 CRUD + localStorage
  milestones.js         ← 里程碑偵測（streak 計算）
  visual/
    canvas.js           ← Canvas loop + resize handler
    ocean.js            ← 深海背景、光線、水波紋
    coral.js            ← 珊瑚生長渲染、Polyp 發光
    particles.js        ← 孢子粒子特效（30天）
    creatures.js        ← 魚、水母移動邏輯
    ruins.js            ← 亞特蘭提斯符文層（100天）
  styles/
    main.css            ← 全域樣式（UI overlay）
    animations.css      ← 珊瑚擺動等 CSS 動畫
assets/
  favicon.svg
```

Phase 1 只需建 `canvas.js` + `ocean.js` + `coral.js`，其餘按 Phase 遞增加入。

## 開發流程

```bash
# ES module 需要 HTTP server，不能直接開 file://
cd /home/jay/claude_code
python3 -m http.server 8080
# 然後瀏覽 http://localhost:8080
```

也可用 VS Code Live Server extension（右鍵 index.html → Open with Live Server）。

里程碑測試（Phase 3 開始）：在 console 手動設置 `streak = 7` 觸發里程碑，不要等真實 7 天。

## Skill / Agent / Hook 引進時機

| 階段 | 引進 | 目的 |
|------|------|------|
| Phase 1 | `/run skill` | 預覽 Canvas 動畫效果 |
| Phase 1 | `Monitor tool` | 監聽 dev server log |
| Phase 2 | `/verify skill` | 端對端測試習慣完成流程 |
| Phase 3 | `/code-review skill` | 里程碑邏輯複雜度上升前審查 |
| Phase 3 | `after-save hook` | 自動 git commit 進度 |
| Phase 4 | `/security-review skill` | 部署前安全審查 |
| Phase 4 | `pre-push hook` | Lighthouse CI 檢查 |
| Phase 5+ | Supabase MCP | 雲端同步（localStorage 不夠才加） |
| Phase 5+ | `CronCreate` | 每日提醒 Agent |
| Phase 5+ | `Workflow` | 多 Agent 整合測試 |

## 不做的事

- 不加任何 JS 框架（React/Vue/Svelte）直到明確需要
- 不加後端直到 localStorage 真的不夠
- 不做用戶認證直到需要多裝置同步
- 不加測試框架直到邏輯複雜到手動難以驗證
