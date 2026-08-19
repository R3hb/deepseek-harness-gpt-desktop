# 社区插件兼容性记录

这份记录来自 2026 年 8 月 19 日的本机验证。测试环境使用 Windows x64、Node.js 24.14.0、DeepSeek Harness 0.1.0-rc.7 和本项目的 Codex 桌面补丁。Web 验证使用普通 Node.js 运行时，随后另用 Electron 桌面运行时复测。核对入口来自 [DSH 插件全景指南](https://www.bilibili.com/opus/1238092080534781961)。

这里记录兼容性和来源。桌面安装包没有预装这些第三方插件，也不会替用户启用 SSH、Computer Use 等高权限能力。

## 验证结果

| 检查 | 结果 |
| --- | --- |
| Web 扩展依赖 | 31 个 |
| DSH 组合 bundle | Web 验证 31 项，桌面安全配置 30 项，均含 2 个官方基础 bundle |
| 独立组件 | DSH TUI、dsh-doctor、Anchored Standard |
| 首页和设置页 | 正常渲染 |
| 插件页面 | 正常打开，显示 206 个 DSH 内部及扩展组件 |
| 前端日志 | 干净会话没有 error 或 warn |
| dsh-doctor | 9 项全部通过 |
| 生产依赖审计 | 0 个 high，0 个 critical，1 个 moderate |

## Web 扩展版本

| 包 | 验证版本 | 来源 |
| --- | --- | --- |
| `@anionex/dsh-turn-rewind` | 0.1.1 | [Anionex/dsh-turn-rewind](https://github.com/Anionex/dsh-turn-rewind) |
| `@anionex/dsh-vision-toolkit` | 0.1.34 | [Anionex/dsh-vision-toolkit](https://github.com/Anionex/dsh-vision-toolkit) |
| `@choi-p/dsh-deepseek-balance` | 0.4.0 | [Choi-Peng/dsh-deepseek-balance](https://github.com/Choi-Peng/dsh-deepseek-balance) |
| `@dsh-community/dsh-paste-input` | 0.1.3 | [lhh010/dsh-paste-input](https://github.com/lhh010/dsh-paste-input) |
| `@dsh-external/dsh-client-ui-skin-maid-atelier` | 0.0.1 | [Small-tailqwq/dsh-deep-whale](https://github.com/Small-tailqwq/dsh-deep-whale) |
| `@dsh-external/dsh-client-ui-skin-orca-link` | 0.0.1 | [Small-tailqwq/dsh-deep-whale](https://github.com/Small-tailqwq/dsh-deep-whale) |
| `@dsh-external/workflow` | 0.1.2 | [omdsh-dev/dsh_workflow](https://github.com/omdsh-dev/dsh_workflow) |
| `@linxin666/dsh-web-ui-all` | 0.2.2 | [zhu1090093659/dsh-web-ui](https://github.com/zhu1090093659/dsh-web-ui) |
| `@liustack/modlens` | 3.17.2 | [liustack/modlens](https://github.com/liustack/modlens) |
| `@liustack/modsearch` | 5.4.3 | [liustack/modsearch](https://github.com/liustack/modsearch) |
| `@max-null/dsh-memory` | 0.2.2 | [Max-Null/dsh-memory](https://github.com/Max-Null/dsh-memory) |
| `@omdsh-dev/dsh-genui` | 0.8.7 | [omdsh-dev/dsh-genui](https://github.com/omdsh-dev/dsh-genui) |
| `@ysyyhhh/dsh-pet` | 0.3.0，桌面端停用 | [ysyyhhh/dsh-pet](https://github.com/ysyyhhh/dsh-pet) |
| `dsh-at-file` | 0.6.4 | [omdsh-dev/dsh-at-file](https://github.com/omdsh-dev/dsh-at-file) |
| `dsh-better-sidebar` | 0.13.1 | [omdsh-dev/DSH-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) |
| `dsh-builtin-browser` | 0.1.15 | [wqty123/dsh-browser](https://github.com/wqty123/dsh-browser) |
| `dsh-chat-import` | 0.6.1 | [Nwflower/dsh-chat-import](https://github.com/Nwflower/dsh-chat-import) |
| `dsh-computer-use` | 0.1.0 | [NPM 包](https://www.npmjs.com/package/dsh-computer-use) |
| `dsh-context` | 0.13.0 | [bowenliang123/dsh-context](https://github.com/bowenliang123/dsh-context) |
| `dsh-cost-dashboard` | 0.1.0 | [SIMON-WORLD/dsh-toolkit](https://github.com/SIMON-WORLD/dsh-toolkit) |
| `dsh-files` | 0.2.0 | [taxueseek/dsh-files](https://github.com/taxueseek/dsh-files) |
| `dsh-find-plugin` | 0.3.7 | [awesome-dsh-plugin/dsh-find-plugin](https://github.com/awesome-dsh-plugin/dsh-find-plugin) |
| `dsh-mobile-ui` | 0.1.1 | [TZHR-invest/dsh-plugins](https://github.com/TZHR-invest/dsh-plugins) |
| `dsh-notification` | 0.1.2 | [omdsh-dev/dsh-notification](https://github.com/omdsh-dev/dsh-notification) |
| `dsh-pomodoro` | 0.4.1 | [causebefore/dsh-pomodoro](https://github.com/causebefore/dsh-pomodoro) |
| `dsh-qqbot` | 1.0.1 | [NPM 包](https://www.npmjs.com/package/dsh-qqbot) |
| `dsh-ssh` | 0.3.0-pre | [UynajGI/dsh-ssh](https://github.com/UynajGI/dsh-ssh) |
| `dsh-sticky-notes` | 0.1.0 | [flyhigao/dsh-sticky-notes](https://github.com/flyhigao/dsh-sticky-notes) |
| `dsh-vision-router` | 1.6.2 | [ysr666/dsh-vision-router](https://github.com/ysr666/dsh-vision-router) |
| `dsh-window` | 0.1.0 | [ZichengGurrr/dsh-window](https://github.com/ZichengGurrr/dsh-window) |
| `dshmarket` | 1.14.1 | [dsh-market/dsh-market](https://github.com/dsh-market/dsh-market) |

## 独立组件

| 组件 | 验证版本或快照 | 来源 |
| --- | --- | --- |
| DSH TUI | 0.8.2 | [ccch1mneyyy/dsh-TUI](https://github.com/ccch1mneyyy/dsh-TUI) |
| dsh-doctor | 2026 年 8 月 19 日源码快照 | [SIMON-WORLD/dsh-toolkit](https://github.com/SIMON-WORLD/dsh-toolkit) |
| Anchored Standard | 2026 年 8 月 19 日源码快照 | [xiaobright/dsh-anchored-standard](https://github.com/xiaobright/dsh-anchored-standard) |

## rc.7 兼容性处理

`@ysyyhhh/dsh-pet` 和 `@liustack/modlens` 的设置卡片需要为 `settings.plugin.item` 注册补上稳定的 `key`。这项最小修补能让两者在普通 Node.js Web 运行时完成加载。

Electron 桌面运行时还有一项独立问题。`@ysyyhhh/dsh-pet@0.3.0` 创建 Windows 原生句柄时会触发 N-API 致命错误，DSH 子进程随后以 code 134 退出。桌面安全配置保留插件源码和依赖，但从自动加载 bundle 中移除了这一项。`@linxin666/dsh-web-ui-all` 自带的鲸鱼娘仍可使用。

这项处理只存在于本轮本地测试副本。上游发布新版本后，应当优先使用上游修复，避免长期维护分叉。

## 没有纳入的项目

下面八个包名在核对时没有找到可安装的 NPM 发布物或明确源码入口。

- `@dsh-office/plugin`
- `@dsh-imagegen/plugin`
- `@dsh-memory/evolve`
- `@dsh-browser/panel`
- `@dsh-agent-teams/plugin`
- `dsh-deep-research`
- `@dsh-llm/fallbacks`
- `@dsh-feishu/bot`

`@wnjxyk/dsh-codex-oauth` 没有加入测试组合。本项目已经通过官方 Codex SDK 复用 ChatGPT 登录，同时启用另一套 OAuth 桥接会造成重复路由和配置歧义。

`deepseek-harness-desktop` 属于另一套桌面应用。当前仓库已经提供 Windows 与 macOS 桌面封装，因此没有重复安装。

## 安全说明

第三方 DSH 插件与桌面应用拥有相同的本机权限。SSH、Computer Use、浏览器、文件读写和远程控制类插件应当在理解权限后再启用。

生产依赖审计发现一个 moderate 问题。依赖路径为 `dsh-vision-router`、`potrace`、`jimp`、`phin@2.9.3`，对应 [GHSA-x565-32qp-m3vf](https://github.com/advisories/GHSA-x565-32qp-m3vf)。当前没有 high 或 critical 项。上游依赖修复后应及时升级。

所有项目的许可证、商标和使用条件仍由各自仓库与发布包决定。作者和维护者名单见 [NOTICE.md](NOTICE.md)。
