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
