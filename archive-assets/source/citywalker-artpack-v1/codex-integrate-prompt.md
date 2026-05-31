你是资深前端工程师。请把 `citywalker-artpack-v1/` 资产包接入项目中的“我的 / 探索者证件 / Profile / Adventurer ID”页面。

重要限制：
- 不要生成 SVG。
- 不要手写 SVG。
- 不要用代码画复杂图标。
- 不要把图片转成 SVG。
- 不要把文字烘焙进图片。
- 只使用这个资产包里的 PNG/WebP 图片；文字、数字、状态仍由代码渲染。

资产包已处理好，不需要人工重命名或抠图：
- `backgrounds/license-card-bg.webp`
- `decorations/city-seal.png`
- `decorations/shanghai-skyline-watermark.png`
- `icons/stats/*.png`
- `badges/*.png`
- `empty-states/badge-empty-state.png`
- `manifest.json`
- `citywalkerAssets.ts`

请执行：

1. 把 `citywalker-artpack-v1/` 复制到项目合适的静态资源目录。
   - Web 项目优先：`public/assets/profile/`
   - 如果项目已有资源规范，请遵守现有目录。
   - 如果使用 bundler import 图片，也可以放到 `src/assets/profile/`。

2. 建立或接入资产索引。
   - 可以直接使用包内的 `citywalkerAssets.ts`。
   - 如果路径策略不同，请调整里面的路径。
   - 不要在组件里散落硬编码路径。

3. 改造证件卡。
   - 使用 `license-card-bg.webp` 作为证件卡背景。
   - 叠加 `city-seal.png` 作为右侧认证章装饰。
   - 叠加 `shanghai-skyline-watermark.png` 作为淡水印。
   - 保留原有头像字母、称号、城市、等级、经验值、状态、进度条。
   - 所有文字继续用代码渲染。
   - 右下角 ID 按钮点击区域至少 44x44。

4. 改造 2x2 stats grid。
   - 完成站点：`icons/stats/completed-spot.png`
   - 隐藏彩蛋：`icons/stats/hidden-egg.png`
   - 历史冒险：`icons/stats/history-adventure.png`
   - 探索评级：`icons/stats/exploration-rating.png`
   - 数字和标签用代码渲染。
   - 卡片圆角、阴影、间距统一。

5. 改造徽章区。
   - 用 `badges/*.png` 显示 12 个徽章。
   - 未解锁显示 `badges/locked.png`。
   - 空状态显示 `empty-states/badge-empty-state.png`。
   - 徽章网格至少 3 列。
   - 显示进度胶囊，例如 `4/12`。
   - 页面底部 padding 必须包含 bottom nav 高度和 `safe-area-inset-bottom`，不要让底栏遮挡内容。

6. 底部导航和整体样式。
   - 当前“我的”tab 使用胶囊高亮。
   - 如果左下角黑色 N 是调试按钮，生产环境隐藏。
   - 普通正文对比度不要太低。
   - 图片装饰设置 aria-hidden；有意义图片设置 alt / accessibilityLabel。
   - 尊重 prefers-reduced-motion。

7. 验收。
   - 页面首屏重点是城市探索者证件。
   - stats grid 统一清晰。
   - badge collection 不被底部导航挡住。
   - 没有新增 SVG 美术。
   - 没有破坏现有数据、路由、tab 状态。
   - 运行项目已有 lint/typecheck/test/build。
   - 最后总结修改文件、验证结果、失败项。
