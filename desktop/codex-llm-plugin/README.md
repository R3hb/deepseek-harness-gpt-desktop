# ChatGPT subscription adapter for DeepSeek Harness

This local Cordis plugin registers the `openai-codex` route on the DeepSeek Harness LLM seam. It uses OpenAI's official `@openai/codex-sdk` and the user's existing Codex **Sign in with ChatGPT** session; it never reads, copies, or stores OAuth tokens itself.

The adapter exposes GPT-5.6 Sol, Terra, and Luna in the Harness model selector. Each first Harness request starts a Codex thread and stores only the opaque thread id as adapter replay metadata. Later turns resume that Codex thread when the latest Harness assistant message carries matching metadata and the host system prompt has not changed.

Codex executes its own tools and sandbox. Ordinary turns forward only real user messages, historical model replies, and tool results; they do not resend the assembled Harness system prompt or plugin-injected tool catalogs because the Codex SDK is an agent runtime rather than a raw Responses API transport. Forwarding those schemas would consume a large prompt without making them callable. Auxiliary title and compaction calls retain their own system and context messages. Harness still owns its visible conversation, full session log, model selector, and desktop UI.

## Configuration

```yaml
- insert:
    - id: llm-codex-chatgpt
      name: '@local/dsh-llm-codex-chatgpt'
      config:
        sandboxMode: workspace-write
        networkAccessEnabled: false
        emitReasoning: true
```

`workingDirectory` defaults to the directory in which `dsh` was launched. Model calls made for titles or compaction always use Codex read-only mode. Credential-shaped environment variables are removed before the Codex subprocess starts; ChatGPT authentication remains owned by Codex's standard account store.

## Known limitations

- Text conversations only. Harness image attachments are rejected before Codex starts.
- Harness tool-call blocks are serialized as conversation context, but new tool calls are executed inside Codex and are not duplicated through the Harness tool pipeline.
- Codex SDK 0.147.0 emits completed reasoning and answer items rather than token-level deltas, so visible streaming is item-granular.
- The ChatGPT plan's Codex usage and rate limits apply.
