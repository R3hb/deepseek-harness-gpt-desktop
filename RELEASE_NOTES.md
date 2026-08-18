# v1.1.0

首个公开版本。

- 将 DeepSeek Harness rc.7 封装为 Windows Electron 桌面应用。
- 新增基于 OpenAI Codex SDK 0.147.0 的 `openai-codex` 模型路由。
- 支持使用 ChatGPT 登录调用 GPT-5.6 Sol、Terra 与 Luna。
- 保留 DeepSeek V4 Flash 与 V4 Pro。
- 支持 Harness 会话与 Codex thread 的多轮续接。
- 增加登录检查、运行时补丁生成、子进程清理与敏感环境变量过滤。

已验证 Windows x64 目录版、NSIS 归档完整性、GPT 首轮回复与同会话续接。安装包没有商业代码签名，Windows 可能显示未知发布者。
