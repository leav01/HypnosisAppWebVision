# 规划：动画速度统一 + 强度 10 档细化 + 常识改变性能优化

**日期：** 2026-04-18
**作者：** Claude (planner)
**状态：** 待审核

---

## 1. 需求复述（Requirement Restatement）

用户提出三项密切相关的诉求：

1. **跨模式观感统一**：`催眠 / 发情 / 拘束 / 常识改变` 四种模式目前各自有不同的速度尺度，在同一强度值下"看起来的快慢"差别很大，需要让它们在视觉上感觉**同等强度**。
2. **强度档位细化 + 影响加强**：
   - 强度 1~10 共 10 档，但当前只有 4 个速度分级（1-3 / 4-6 / 7-9 / 10），中间拖动几乎没有可见变化；
   - 强度 **5 = 正常速度**（作为基准）；
   - 强度 **10 = 非常快**（要比当前"极限"档更激进）；
   - 每一档都应带来可感知的速度差异（线性或指数曲线）。
3. **"常识改变"模式卡顿优化**：矩阵雨 + 大脑脉动当前在中低配机器上明显卡顿，需在不损失观感的前提下降低渲染压力。

---

## 2. 现状分析（Current State）

### 2.1 强度配置表（`js/config.js:45-50`）
仅 4 个离散档位，强度 4 与 6 完全相同，10 为单独一档：

| 档位 | 范围 | heartbeatSpeed | expandSpeed | rotationSpeed |
| ---- | ---- | -------------- | ----------- | ------------- |
| 低   | 1-3  | 1.5s           | 2.5         | 4s            |
| 中   | 4-6  | 1.2s           | 1.6         | 2.5s          |
| 高   | 7-9  | 0.8s           | 1.0         | 1.5s          |
| 极限 | 10   | 0.6s           | 0.6         | 1s            |

`saturation` 字段定义了但**没有任何地方使用**（死字段）。

### 2.2 各模式实际动画时长（当前，强度 5 时）

| 模式     | 主动画                | 周期（强度 5）            | 基本频率   |
| -------- | --------------------- | ------------------------- | ---------- |
| 催眠     | 螺旋 canvas 旋转      | 2.5s / 圈                 | ~24 转/分  |
| 发情     | 心跳缩放 + 心形外扩环 | 1.2s 心跳 / 4.8s 外扩     | 50 BPM     |
| 拘束     | 同心圆向外扩散        | 1.6s / 周期               | 37 周期/分 |
| 常识改变 | 大脑脉动 + 矩阵雨     | 1.2s 脉动 / 5.4~9.4s 下落 | 不一致     |

### 2.3 已发现的问题

1. **矩阵雨速度公式反向**（`js/animation.js:259`）：
   ```js
   baseSpeed = 4 + (1 - parseFloat(expandSpeed) / 3) * 3
   ```
   `expandSpeed` 越小（强度越高），`baseSpeed` 越大（下落越慢）。强度 10 时矩阵比强度 1 还慢 —— 直接 bug。
2. **心形环用了 3× 系数**（`animation.js:189`），使发情模式外扩节奏明显慢于拘束，观感不统一。
3. **中间档无变化**：拖动 4→5→6 强度滑块，动画毫无差异，用户感知不到调节效果。
4. **10 档与 9 档落差过小**：expandSpeed 1.0→0.6，仅 40% 加速；用户期望 10 是"质变级别"的快。

### 2.4 常识改变卡顿根源（`js/animation.js:254-318` + `css/animation.css:177-207`）

| 问题                          | 细节                                                                    | 影响                        |
| ----------------------------- | ----------------------------------------------------------------------- | --------------------------- |
| 列数过多                      | `innerWidth / 14` ≈ 1366 屏幕 98 列，1920 屏幕 137 列                   | DOM 3000+ 节点              |
| 每列独立 `setInterval`        | 每 100-300ms 触发一次 DOM 修改（`textContent` + `classList`）           | 每秒 300+ 次 DOM 修改       |
| span 上挂 CSS transition      | `transition: opacity 0.15s, color 0.15s, text-shadow 0.15s` 在每个 span | 每次高亮触发 3 条合成层动画 |
| 每高亮 span 都创建 setTimeout | 移除 `.bright` 用 `setTimeout`，高频创建销毁                            | GC 压力                     |
| `writing-mode: vertical-rl`   | 竖排文字渲染成本高于普通流                                              | 每列渲染开销                |
| 大脑图标 3 层 drop-shadow     | 每 1.2s 6 帧全部重绘 filter                                             | GPU filter 成本             |
| 随机毛刺闪屏（glitch）        | `setInterval` 每 2s + `mix-blend-mode: screen` 全屏混合                 | 合成层重算                  |

---

## 3. 解决方案（Design）

### 3.1 统一速度模型（核心设计）

用**两部分**取代现有离散档位：

**(A) 各模式基准时长（强度 5 = 1.0×）**
针对"观感统一"目标，选取让 4 个模式在强度 5 都感觉"正常节奏"的基准值：

```js
HypnoApp.BASE_DURATIONS = {
  heartbeat:     1.0,   // 秒，心跳 / 脑脉动 (= 60 BPM 静息心率)
  rotation:      3.0,   // 秒，螺旋旋转 1 圈
  ringExpand:    1.8,   // 秒，拘束同心圆 1 周期
  heartRingExpand: 2.4, // 秒，发情爱心环完全展开（降低原 3× 系数为 1.33×）
  matrixFall:    5.0,   // 秒，矩阵列从顶到底
  matrixSwap:    0.18,  // 秒，矩阵字符平均替换周期
  glitchCheck:   2.0,   // 秒，毛刺触发检查间隔
};
```

**(B) 强度 → 速度倍率函数**

采用指数曲线：`multiplier = Math.pow(base, intensity - 5)`

- `base = 1.28` 时 → 强度 1 = 0.37×，强度 10 = 3.44×（约 9 倍速差异）

每档逐值倍率表：

| 强度   | 倍率      | 心跳周期  | 螺旋圈速  | 拘束周期  | 矩阵下落  |
| ------ | --------- | --------- | --------- | --------- | --------- |
| 1      | 0.37×     | 2.70s     | 8.10s     | 4.86s     | 13.5s     |
| 2      | 0.48×     | 2.10s     | 6.30s     | 3.78s     | 10.5s     |
| 3      | 0.61×     | 1.64s     | 4.92s     | 2.95s     | 8.2s      |
| 4      | 0.78×     | 1.28s     | 3.84s     | 2.30s     | 6.4s      |
| **5**  | **1.00×** | **1.00s** | **3.00s** | **1.80s** | **5.0s**  |
| 6      | 1.28×     | 0.78s     | 2.34s     | 1.41s     | 3.91s     |
| 7      | 1.64×     | 0.61s     | 1.83s     | 1.10s     | 3.05s     |
| 8      | 2.10×     | 0.48s     | 1.43s     | 0.86s     | 2.38s     |
| 9      | 2.68×     | 0.37s     | 1.12s     | 0.67s     | 1.87s     |
| **10** | **3.44×** | **0.29s** | **0.87s** | **0.52s** | **1.45s** |

✅ 每档变化明显、5 为基准、10 显著加速、跨模式同档位"节奏密度"一致。

**(C) 新 API 设计**

`js/config.js` 新增：
```js
HypnoApp.INTENSITY_CURVE = Object.freeze({
  base: 1.28,
  reference: 5,
  durations: HypnoApp.BASE_DURATIONS,
});

HypnoApp.getSpeedMultiplier = function(intensity) { ... };
HypnoApp.getAnimationDurations = function(intensity) { ... };
HypnoApp.getIntensityLabel = function(intensity) { ... }; // 保留中文标签逻辑
```

`js/animation.js` 替换 `getIntensityConfig()` 为 `getAnimationDurations()`。

### 3.2 常识改变性能优化

采用**渐进式策略**（不用重写成 canvas，保留 DOM 文字观感）：

| #   | 优化点                             | 改动                                                                                                         | 预期收益                   |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------- |
| 1   | 列密度减半                         | 列间距 `14px → 22px`（可根据 `devicePixelRatio` 自适应，移动端 28px）                                        | DOM 减少 ~35%              |
| 2   | 共享字符交换调度                   | 废弃每列独立 `setInterval`，改为单个 `requestAnimationFrame` 循环，每帧按 `matrixSwap` 概率选 ~5 列执行 swap | setInterval 数从 98 降至 2 |
| 3   | 移除 span 上的 transition          | CSS `.matrix-column span { transition: none; }`，`.bright` 瞬时切换，不靠过渡                                | 合成层动画数大幅下降       |
| 4   | 高亮移除改用 rAF 队列              | 维护 `brightSpans[] = { span, expireAt }`，主循环统一 sweep 过期；删除每次 `setTimeout`                      | GC 压力下降                |
| 5   | 大脑 drop-shadow 合并              | 3 层 → 2 层，其中一层改为静态外发光（box-shadow 替代），只让最里层 filter 跟随脉动                           | GPU filter 成本 ~40% ↓     |
| 6   | `will-change` 定向                 | `.matrix-column { will-change: transform }` （不加在 span 上，避免 100+ 合成层）                             | 合成层预算受控             |
| 7   | 字体栈简化 + `font-display: block` | `font-family: monospace` 优先，避免 `MS Gothic` 在无字体的 Windows 降级时字形重排                            | 首帧减少重排               |
| 8   | glitch 触发降频                    | 2s → 3s 检查间隔，概率 0.3 → 0.25                                                                            | 混合模式重绘 ↓             |
| 9   | 列节点回收                         | 动画结束不删除列，只重置 `animation` 重启（循环利用）                                                        | DOM 抖动 ↓                 |
| 10  | 移动端降级                         | 检测 `innerWidth < 640` 时，列间距 28px + 大脑不加 filter（改为 `box-shadow`）                               | 手机流畅                   |

**性能目标**（Chrome DevTools Performance）：
- 桌面 60 FPS 稳定、主线程长任务 < 5ms/帧
- 移动端（模拟 Slow 4G + 4× CPU throttle）≥ 45 FPS

### 3.3 UI 微调

- `intensity` 滑块提示文本动态显示当前倍率：`"强度 7/10 · 1.64× 速度"`（可选）
- `SLIDER_CONFIG.intensity.details` 文案需要同步更新以反映新的连续曲线（去掉"1-3 / 4-6 / 7-9 / 10"这种分段描述，改为连续表达）。

---

## 4. 实施步骤（Phases）

### Phase 1 — 配置与计算层（无视觉改动）
- [ ] `js/config.js`：引入 `BASE_DURATIONS`、`INTENSITY_CURVE`、三个 helper 函数
- [ ] 保留旧 `INTENSITY_LEVELS` 字段引用做兼容过渡，但内部 getter 走新曲线
- [ ] 更新 `intensity` 的 `details` 文案为连续描述

### Phase 2 — 动画调度层重构
- [ ] `js/animation.js`：`startAnimation` 使用 `getAnimationDurations(intensity)` 统一注入 CSS 变量
- [ ] 新增 CSS 变量：`--matrix-fall-speed`、`--heart-ring-expand`（与 `--expand-speed` 解耦）
- [ ] 修复矩阵速度反向 bug：直接使用 `durations.matrixFall / multiplier`
- [ ] 移除 `startHeartRings` 中的 `× 3` 魔法系数，改用独立 `heartRingExpand` 基准

### Phase 3 — 常识改变性能重构
- [ ] 重写 `startMatrixRain`：共享 rAF 循环、复用列节点
- [ ] `css/animation.css:193`：移除 span 上的 transition
- [ ] `css/animation.css:228-238`：简化 brain-pulse 的 drop-shadow
- [ ] 列间距自适应（桌面 22 / 移动 28）
- [ ] 添加桌面/移动分支降级逻辑

### Phase 4 — 联调与自测
- [ ] 四种模式分别拉强度 1 / 5 / 10 手测，确认节奏统一
- [ ] Chrome DevTools Performance 录制 10s 常识改变模式，核对 FPS ≥ 60
- [ ] 移动端模拟器 + 4×CPU 节流，录制 10s，核对 FPS ≥ 45
- [ ] 所有模式的"退出"按钮仍可立即响应

### Phase 5 — 提交
- [ ] `git commit -m "feat: unify cross-mode animation speeds with continuous intensity curve"`
- [ ] `git commit -m "perf: optimize mindRewrite matrix rain for smooth 60fps"`

---

## 5. 风险与取舍（Risks & Tradeoffs）

| 风险                                 | 等级 | 应对                                                                                           |
| ------------------------------------ | ---- | ---------------------------------------------------------------------------------------------- |
| 强度 10 速度过快引起不适             | 中   | 3.44× 上限是保守选择（原"极限"也只是 2.5×）；如测试后仍觉激进可回调 base 到 1.25（10 = 3.05×） |
| 常识改变优化后观感变淡               | 中   | 只减列密度不减列内字符数 + 保留字体颜色字符切换；主观观感应保留                                |
| 旧 `INTENSITY_LEVELS` 字段被外部引用 | 低   | 全仓 grep 仅 `animation.js` 内部用；保留导出但标注 `@deprecated`                               |
| CSS `@property --ring-offset` 兼容   | 低   | 已存在于现 code，不改动                                                                        |
| 循环列节点引发的残留字符             | 低   | 每次循环重生成 innerHTML，无跨周期污染                                                         |

---

## 6. 复杂度评估

- **代码改动量**：中等（`config.js` ~60 行新增，`animation.js` ~80 行修改，`animation.css` ~20 行修改）
- **测试工作量**：低（无新测试依赖，纯肉眼 + DevTools 验证）
- **风险总评**：LOW-MEDIUM
- **预估耗时**：1.5~2.5 小时

---

## 7. 待确认项（Open Questions）

请确认或选择：

1. **速度曲线陡度 base 值**：推荐 `1.28`（10 档 = 3.44×）；如希望 10 档更激进可用 `1.35`（10 档 = 4.48×），更温和可用 `1.22`（10 档 = 2.70×）。
   按照推荐进行
2. **强度滑块 UI 是否显示倍率数字**（例如 "7/10 · 1.64×"）？
   不需要
3. **是否保留 `saturation` 字段**并真正接入为 CSS `filter: saturate()`？（当前定义但未使用）
   你自己决定
4. **是否需要记忆用户上次拖动位置**（与本次需求无关，可选项）。
   不需要

---

**确认后请回复 `proceed` 或提出修改意见。**
