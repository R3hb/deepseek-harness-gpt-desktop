# DeepSeek Harness GPT Desktop

<p align="center">
  <img src="desktop/assets/icon.png" alt="DeepSeek Harness GPT Desktop" width="180">
</p>

手上已经买了 ChatGPT 会员，DeepSeek API 又觉得有点贵。于是我给刚开源的 DeepSeek Harness 接上了 OpenAI 官方 Codex 登录，再把它包成 Windows 和 macOS 桌面应用。

模型下拉框里，DeepSeek V4 和 GPT-5.6 都在。中美两家 SOTA 模型一起伺候，岂不美哉。

![DeepSeek Harness 同时选择 GPT 与 DeepSeek 模型](assets/model-selector.png)

## 和官方 DSH、Codex 怎么选

这个项目没有打算替代 DeepSeek Harness 或 Codex。它更适合已经在用 ChatGPT 计划，同时又喜欢 DSH 工作区、会话管理和模型切换方式的人。你可以在同一个桌面应用里调用 GPT，也可以随时切回 DeepSeek。

| 对比项 | **DeepSeek Harness GPT Desktop** | 官方 DeepSeek Harness | 官方 Codex |
| --- | --- | --- | --- |
| 产品定位 | **把 DSH 工作台和 Codex 接到一起的社区桌面版** | DeepSeek 官方开源 Agent Harness，强调一切皆插件 | OpenAI 官方编码 Agent，围绕代码理解、修改、测试和交付 |
| 软件价格 | **代码与安装包免费** | 源码免费，MIT License | Codex 随 ChatGPT Free、Go、Plus、Pro、Business、Edu、Enterprise 提供 |
| 模型费用 | GPT 路线复用现有 ChatGPT 计划和 Codex 用量，**不需要另配 OpenAI API Key**。切换到 DeepSeek 时仍按 DeepSeek 账号计费 | 模型费用跟随所选提供方，使用 DeepSeek 在线模型时需要对应 API Key 和额度 | Free 每月 0 美元，Go 每月 8 美元，Plus 每月 20 美元，Pro 每月 100 美元起。不同计划有各自用量和速率限制 |
| 开箱即用的模型 | **GPT-5.6 Sol、Terra、Luna，加上 DeepSeek V4 Flash、V4 Pro** | 官方默认以 DeepSeek 模型为主，其他路线取决于已安装的提供方插件和配置 | GPT-5.6 系列与 Codex 专用模型，不提供 DeepSeek 模型切换 |
| 模型切换体验 | **同一个下拉框切换 GPT 与 DeepSeek，继续使用 DSH 工作区和会话列表** | 能否切换更多提供方取决于插件和配置 | 在 OpenAI 提供的模型范围内选择，工作流以 Codex 为中心 |
| 图片输入 | **支持 PNG、JPEG、WebP、GIF，图片可直接交给 GPT 识别** | 取决于模型与适配器是否声明图片能力 | 官方支持图片输入和视觉理解 |
| 插件与扩展 | 保留 DSH 插件宿主。GPT 回合使用 Codex 自带工具、Skills、插件和 MCP，**一套界面连接两套扩展体系** | Cordis 插件架构是核心优势，官方仓库提供 `dsh-plugin` 生态入口 | 支持 Skills、插件、MCP、Tool Search，官方集成范围更完整 |
| Agent 与工具 | GPT 路线由 Codex 执行文件、Shell、沙箱等工具，DSH 继续负责界面、会话和附件 | 工具能力由 DSH 插件和所选模型共同决定 | OpenAI 官方 Agent 工具、权限、沙箱、云任务与代码审查能力最完整 |
| 桌面体验 | **提供 Windows EXE、Apple Silicon Mac 与 Intel Mac 安装包** | 官方入口以 `npx @deepseek-ai/dsh web` 启动本地 Web UI | 提供 ChatGPT/Codex 官方产品、Web、CLI、IDE 扩展和云端入口 |
| 会话与工作区 | 保留 DSH 的工作区、会话记录和附件，同时用 Codex thread 续接 GPT 多轮上下文 | 原生 DSH 工作区和会话体系 | 原生 Codex 项目、聊天和云任务体系 |
| 上手门槛 | **下载桌面包，登录 ChatGPT 后即可用 GPT。DeepSeek 按需再配 Key** | 需要 Node.js、命令行启动和模型提供方配置 | 官方客户端最省配置，开发者也可以选择 CLI、IDE 或 SDK |
| 主要优势 | **适合已经买了 ChatGPT、又想在 DSH 里同时用中美两家模型的人** | 官方插件底层最原生，适合 Harness 开发者和插件作者 | 官方能力更新最快，Codex 功能覆盖最完整 |
| 当前限制 | 社区桥接需要跟随 DSH 与 Codex 两边升级。音频、视频尚未接入，安装包没有商业签名 | 仍处于 Developer Preview，官方明确提示可能出现兼容性破坏 | 不提供 DSH 界面，也不能在同一模型菜单里切换到 DeepSeek |

本项目的优势很具体。已经付费的 ChatGPT 用户可以把现有 Codex 用量放进 DSH，不必为了 GPT 路线再维护一套 OpenAI API Key。工作区、会话记录、附件和 DeepSeek 模型仍留在原来的界面里，减少了在两套工具之间反复切换的麻烦。

对比依据更新于 2026 年 8 月 19 日。产品能力、价格和用量限制会调整，请以 [DeepSeek Harness 官方仓库](https://github.com/deepseek-ai/deepseek-harness)、[Codex 价格与计划](https://learn.chatgpt.com/docs/pricing)、[Codex CLI](https://learn.chatgpt.com/docs/codex/cli) 和 [Codex SDK](https://learn.chatgpt.com/docs/codex-sdk) 的最新说明为准。

## 它做了什么

- 保留 DeepSeek Harness 原来的界面、工作区和会话记录。
- 增加 `OpenAI Codex (ChatGPT)` 模型提供方。
- 支持 GPT-5.6 Sol、Terra 和 Luna。
- 直接复用 Codex 的 ChatGPT 登录，无需另外填写 OpenAI API Key。
- 支持在 Harness 中粘贴或添加 PNG、JPEG、WebP、GIF 图片并交给 GPT 识别。
- 使用 Electron 打包成 Windows 和 macOS 桌面应用，关闭窗口时一并清理本地服务。
- DeepSeek V4 Flash 与 V4 Pro 仍然保留，需要时可以随时切回。

官方 Codex CLI 支持使用 ChatGPT 登录，Codex SDK 也允许嵌入本地应用。ChatGPT 计划中的 Codex 用量、模型权限与速率限制仍按 OpenAI 当前规则执行。

- [Codex CLI](https://learn.chatgpt.com/docs/codex/cli)
- [Codex SDK](https://learn.chatgpt.com/docs/codex-sdk)
- [ChatGPT 与 Codex 计划](https://learn.chatgpt.com/docs/pricing)

## 下载和使用

安装包会放在仓库的 Releases 页面。Windows 下载 `.exe`，Apple Silicon Mac 下载 `mac-arm64.dmg`，Intel Mac 下载 `mac-x64.dmg`。首次启动时，如果本机还没有 Codex 登录状态，应用会打开 OpenAI 官方登录页。登录完成后会自动进入 DeepSeek Harness。

已经安装并登录 Codex 的电脑会直接复用现有登录状态。应用不会读取、复制或提交 OAuth Token。

macOS 安装包目前使用临时签名，没有经过 Apple 公证。系统拦截时，可以在“系统设置 → 隐私与安全性”中选择“仍要打开”。如果仍提示应用已损坏，可以在终端执行下面的命令后重新打开。

```bash
xattr -dr com.apple.quarantine "/Applications/DeepSeek Harness GPT.app"
```

## 从源码构建

需要 Node.js 24 和 npm。Windows 安装包应在 Windows 上构建，macOS 安装包应在对应架构的 Mac 上构建。

```powershell
git clone https://github.com/R3hb/deepseek-harness-gpt-desktop.git
cd deepseek-harness-gpt-desktop\desktop
npm install
npm test
npm run dist
```

`npm run dist` 会先准备 DeepSeek Harness rc.7、Codex SDK 0.147.0 与本地适配器，再生成 NSIS 安装包。

macOS 使用下面的命令。Apple Silicon 选择 `--arm64`，Intel Mac 选择 `--x64`。

```bash
cd deepseek-harness-gpt-desktop/desktop
npm install
npm test
npm run dist:mac -- --arm64
```

开发运行可以使用下面的命令。

```powershell
npm start
```

默认工作区是系统文档目录。已有 `E:\DeepSeekHarness\workspace` 时会继续使用它，也可以通过 `DSH_WORKSPACE` 指定目录。`DSH_HOME` 和 `DSH_APP_DIR` 同样可以覆盖默认位置。

## 实现方式

`desktop/codex-llm-plugin` 注册了 `openai-codex` 模型路由。每次 Harness 对话通过官方 `@openai/codex-sdk` 进入 Codex，认证与工具执行都由 Codex 管理。

普通对话转发用户消息、图片附件、历史模型回复与工具结果。图片从 Harness 的附件存储中校验读取，临时写入本地文件交给 Codex SDK，模型响应结束后立即删除。Harness 注入的整套工具目录会留在自己的会话日志里，不会重复发给 Codex。这样可以少耗一部分输入 token，同时避免让模型误以为那批 Harness 工具可以直接调用。

适配器会把 Codex thread id 写入 Harness 的回放元数据。同一会话下一轮会续接原 thread，多轮上下文不会丢。

## 已知限制

- 当前只支持图片输入，不支持音频和视频附件。
- Codex 自带 Agent 指令和工具，单轮仍有较大的上下文基线。
- 本机实测 GPT-5.6 Sol 首次响应约需五十到六十秒，速度会受账号、网络与任务复杂度影响。
- 自行构建的安装包没有商业代码签名证书，Windows 可能显示未知发布者。
- macOS 安装包使用临时签名且未经过 Apple 公证，首次打开时会触发 Gatekeeper 提示。
- DeepSeek 模型仍需要自己的 API Key 与额度。ChatGPT 会员不会替 DeepSeek 接口付费。

## 安全边界

- 仓库不包含 API Key、OAuth Token、Cookie、会话数据或个人工作区。
- 传给 Codex 子进程的环境变量会移除名称中含有 `KEY`、`SECRET`、`TOKEN` 或 `PASSWORD` 的项目。
- ChatGPT 登录状态由 Codex 的标准账号目录管理，本适配器只检查是否已经登录。

## 致谢

- [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)
- [openai/codex](https://github.com/openai/codex)

这是个人做的社区版本，和 DeepSeek、深度求索、OpenAI 都没有官方关系。欢迎提 Issue，也欢迎一起把这个桥接做得更顺手。

## License

本仓库新增代码采用 MIT License。第三方组件保留各自许可证，详情见 [NOTICE.md](NOTICE.md)。
