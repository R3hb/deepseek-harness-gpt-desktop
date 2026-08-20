# v1.5.0

- 将桌面内置 DeepSeek Harness 从 0.1.0-rc.7 升级到官方预发布版 0.1.0-rc.8。
- Codex 适配器升级到 0.3.0，并在 rc.8 的 `dsh-llm` 公共接口上通过 7 项测试。
- 补齐 rc.8 运行时所需的 18 个必需 peer 包，构建时使用精确版本并跳过 npm 11 的重复 peer 求解。
- 实机验证旧会话读取、现有社区插件组合和 GPT-5.6 Sol 真实响应，确认 `RC8_GPT_OK` 返回成功。
- 整理桌面侧栏底部插件入口，隐藏无意义的 `no-api-key` 竖排状态，将更新、移动端和番茄钟收成紧凑图标按钮。
- rc.8 的 SQLite 数据结构与 rc.7 不兼容，升级前必须停止应用并备份 `DSH_HOME`。
- 记录官方品牌规范。项目说明可以准确描述与 DeepSeek Harness 的关系，项目命名建议使用 `DSH` 缩写。

- 增加 DeepSeek Harness rc.7 社区插件兼容性记录，列出 31 个 Web 扩展依赖和 3 个独立组件的验证版本。
- 记录 Pet 与 ModLens 的 rc.7 设置卡片兼容性处理，以及生产依赖审计结果。
- 标注 `@ysyyhhh/dsh-pet@0.3.0` 在 Electron Windows 运行时的 N-API 崩溃问题，桌面配置应停用该 bundle。
- 扩充第三方项目说明，逐项鸣谢本轮验证涉及的社区仓库作者和 NPM 维护者。

# v1.4.0

- 使用用户提供的蓝色角色与鲸鱼插画替换桌面应用图标。
- Windows EXE、NSIS 安装包、快捷方式和任务栏图标使用新的多尺寸 ICO。
- macOS App、Dock、DMG 和 ZIP 包使用新的 1024 像素图标。
- README 顶部同步展示新版图标。

# v1.3.0

- 为 GPT-5.6 Sol、Terra、Luna 声明图片输入能力，修复前端误报“当前模型不支持图片”。
- 将 Harness 的 PNG、JPEG、WebP、GIF 附件转为 Codex SDK 的本地图片输入。
- 图片临时文件仅在当前模型请求期间存在，响应结束或失败后自动清理。
- 增加图片能力声明、附件字节转发和临时文件清理测试。

# v1.2.0

- 新增 macOS Apple Silicon 与 Intel 双架构安装包。
- 增加 GitHub Actions macOS 原生构建流程，分别生成 DMG 与 ZIP。
- 首次启动时自动创建本地数据目录，避免新 Mac 因目录不存在而启动失败。
- macOS 使用临时签名，尚未经过 Apple 公证。

# v1.1.0

首个公开版本。

- 将 DeepSeek Harness rc.7 封装为 Windows Electron 桌面应用。
- 新增基于 OpenAI Codex SDK 0.147.0 的 `openai-codex` 模型路由。
- 支持使用 ChatGPT 登录调用 GPT-5.6 Sol、Terra 与 Luna。
- 保留 DeepSeek V4 Flash 与 V4 Pro。
- 支持 Harness 会话与 Codex thread 的多轮续接。
- 增加登录检查、运行时补丁生成、子进程清理与敏感环境变量过滤。

已验证 Windows x64 目录版、NSIS 归档完整性、GPT 首轮回复与同会话续接。安装包没有商业代码签名，Windows 可能显示未知发布者。
