/**
 * DeepSeek Harness LLM adapter backed by the official Codex SDK. Codex owns
 * its ChatGPT authentication and tool execution; this plugin translates the
 * Harness conversation and Codex JSONL events without handling OAuth tokens.
 */

import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { Codex } from '@openai/codex-sdk'
import z from '@deepseek-ai/schemastery'
import {
  EMPTY_RESPONSE_CODE,
  LlmAdapter,
  LlmError,
  ReasoningEffortId,
} from '@deepseek-ai/dsh-llm'

export const name = 'llm-codex-chatgpt'
export const inject = ['llm']

export const PROVIDER = 'openai-codex'
export const REPLAY_KIND = 'openai-codex-thread'
export const REPLAY_VERSION = 1

const CONTEXT_WINDOW = 1_050_000
const DEFAULT_REASONING_EFFORT = 'medium'
const REASONING_EFFORTS = ['minimal', 'low', 'medium', 'high', 'xhigh']
const SECRET_NAME = /KEY|SECRET|TOKEN|PASSWORD/i

export const MODELS = Object.freeze([
  Object.freeze({
    id: 'gpt-5.6-sol',
    name: 'GPT-5.6 Sol',
    description: 'Frontier GPT model for complex coding and professional work.',
  }),
  Object.freeze({
    id: 'gpt-5.6-terra',
    name: 'GPT-5.6 Terra',
    description: 'Balanced GPT model for capability, latency, and usage.',
  }),
  Object.freeze({
    id: 'gpt-5.6-luna',
    name: 'GPT-5.6 Luna',
    description: 'Efficient GPT model for lighter or high-volume work.',
  }),
])

export const Config = z.object({
  workingDirectory: z.string(),
  sandboxMode: z.union(['read-only', 'workspace-write', 'danger-full-access'])
    .default('workspace-write'),
  networkAccessEnabled: z.boolean().default(false),
  emitReasoning: z.boolean().default(true),
})

/** Remove credential-shaped variables before Codex or its tools see the environment. */
export function codexEnvironment(source = process.env) {
  const result = {}
  for (const [key, value] of Object.entries(source)) {
    if (typeof value !== 'string' || SECRET_NAME.test(key)) continue
    result[key] = value
  }
  delete result.ELECTRON_RUN_AS_NODE
  return result
}

function contentText(blocks) {
  const result = []
  for (const block of blocks) {
    switch (block.type) {
      case 'text':
        result.push({ type: 'text', text: block.text })
        break
      case 'reasoning':
        // Never replay hidden reasoning into a fresh Codex prompt.
        break
      case 'tool-call':
        result.push({
          type: 'tool-call',
          id: block.id,
          name: block.name,
          arguments: block.arguments,
        })
        break
      case 'tool-result':
        result.push({
          type: 'tool-result',
          toolCallId: block.toolCallId,
          isError: block.isError === true,
          content: contentText(block.content),
        })
        break
      case 'image':
        throw new LlmError(
          'The ChatGPT subscription bridge currently accepts text conversations only.',
          'UNSUPPORTED_CONTENT',
        )
      default:
        throw new LlmError(
          `The ChatGPT subscription bridge cannot serialize content block "${String(block.type)}".`,
          'UNSUPPORTED_CONTENT',
        )
    }
  }
  return result
}

function transcript(messages) {
  return messages.map(message => ({
    role: message.role,
    content: contentText(message.content),
  }))
}

/** Keep only durable conversation participants for ordinary Codex turns. */
export function bridgedMessages(options) {
  if (options.purpose !== undefined) return options.messages
  return options.messages.filter(message => [
    'user',
    'model',
    'tool',
  ].includes(message.source?.kind))
}

function systemHash(system) {
  return createHash('sha256').update(system ?? '', 'utf8').digest('hex')
}

function replayFrom(message, expectedSystemHash) {
  if (message?.role !== 'assistant') return undefined
  const source = message.source
  if (source?.kind !== 'model' || source.provider !== PROVIDER) return undefined
  const state = source.replayState?.response
  if (state === null || typeof state !== 'object' || Array.isArray(state)) return undefined
  if (
    state.kind !== REPLAY_KIND
    || state.version !== REPLAY_VERSION
    || typeof state.threadId !== 'string'
    || state.threadId.length === 0
    || state.systemHash !== expectedSystemHash
  ) return undefined
  return { threadId: state.threadId }
}

/** Resolve durable Codex continuation from the latest assistant message only. */
export function continuation(messages, system) {
  const hash = systemHash(system)
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role !== 'assistant') continue
    const replay = replayFrom(messages[index], hash)
    if (replay === undefined) return { systemHash: hash, messages }
    return {
      systemHash: hash,
      threadId: replay.threadId,
      messages: messages.slice(index + 1),
    }
  }
  return { systemHash: hash, messages }
}

const FIRST_TURN_INSTRUCTION = [
  'DeepSeek Harness is delegating this conversation turn to the official Codex runtime.',
  'Follow the host system instructions and conversation below.',
  'Use Codex tools directly when work in the local workspace is required.',
  'Do not emit a DeepSeek Harness tool-call protocol; return the final user-facing answer normally.',
].join(' ')

const CONTINUATION_INSTRUCTION = [
  'Continue the existing DeepSeek Harness conversation with the new messages below.',
  'Use Codex tools directly and return the final user-facing answer normally.',
].join(' ')

/** Build the exact text submitted to a new or resumed Codex thread. */
export function codexPrompt(options, resolvedContinuation) {
  if (resolvedContinuation.threadId !== undefined) {
    return `${CONTINUATION_INSTRUCTION}\n\n${JSON.stringify({
      messages: transcript(resolvedContinuation.messages),
    })}`
  }
  return `${FIRST_TURN_INSTRUCTION}\n\n${JSON.stringify({
    system: options.purpose === undefined ? '' : (options.system ?? ''),
    messages: transcript(resolvedContinuation.messages),
  })}`
}

function normalizeError(value, signal) {
  const cause = value instanceof Error ? value : new Error(String(value))
  const message = cause.message || 'Codex request failed.'
  if (signal?.aborted) return new LlmError('Codex request was cancelled.', 'ABORTED', { cause })
  if (/context.?window|too many tokens|context length/i.test(message)) {
    return new LlmError(message, 'CONTEXT_WINDOW_EXCEEDED', { cause })
  }
  if (/quota|credit|usage limit|rate limit reached/i.test(message)) {
    return new LlmError(message, 'QUOTA', { cause })
  }
  if (/rate.?limit|too many requests/i.test(message)) {
    return new LlmError(message, 'RATE_LIMIT', { cause })
  }
  if (/log.?in|sign.?in|auth|unauthori[sz]ed|\b401\b|\b403\b/i.test(message)) {
    return new LlmError(
      'Codex is not signed in with ChatGPT. Restart the desktop app and complete the browser login.',
      'AUTH',
      { cause },
    )
  }
  return new LlmError(`Codex request failed: ${message}`, 'SERVER', { cause })
}

function mappedUsage(usage) {
  const cacheReadTokens = Math.max(0, usage.cached_input_tokens)
  const cacheWriteTokens = Math.max(0, usage.cache_write_input_tokens)
  return {
    inputTokens: Math.max(0, usage.input_tokens - cacheReadTokens - cacheWriteTokens),
    outputTokens: Math.max(0, usage.output_tokens),
    ...(cacheReadTokens > 0 ? { cacheReadTokens } : {}),
    ...(cacheWriteTokens > 0 ? { cacheWriteTokens } : {}),
    ...(usage.reasoning_output_tokens > 0
      ? { reasoningTokens: usage.reasoning_output_tokens }
      : {}),
  }
}

function resolvedEffort(value) {
  const effort = value === undefined ? DEFAULT_REASONING_EFFORT : String(value)
  if (!REASONING_EFFORTS.includes(effort)) {
    throw new LlmError(
      `Codex does not support reasoning effort "${effort}" through this bridge.`,
      'UNSUPPORTED_REASONING_EFFORT',
    )
  }
  return effort
}

/** Harness adapter that delegates each request to an official Codex thread. */
export class CodexChatGptAdapter extends LlmAdapter {
  constructor(config = {}, createCodex = options => new Codex(options)) {
    super()
    this.config = {
      workingDirectory: config.workingDirectory === undefined
        ? process.cwd()
        : resolve(config.workingDirectory),
      sandboxMode: config.sandboxMode ?? 'workspace-write',
      networkAccessEnabled: config.networkAccessEnabled ?? false,
      emitReasoning: config.emitReasoning ?? true,
    }
    if (!existsSync(this.config.workingDirectory)) {
      throw new Error(
        `llm-codex-chatgpt: workingDirectory does not exist: ${this.config.workingDirectory}`,
      )
    }
    this.createCodex = createCodex
  }

  providerInfo(provider) {
    return { id: provider, name: 'OpenAI Codex (ChatGPT)' }
  }

  listModels(provider) {
    return Promise.resolve(MODELS.map(model => ({
      provider,
      ...model,
      inputModalities: ['text'],
    })))
  }

  resolveModel(provider, model) {
    const known = MODELS.find(item => item.id === model)
    return Promise.resolve({
      provider,
      id: model,
      name: known?.name ?? model,
      ...(known?.description === undefined ? {} : { description: known.description }),
      inputModalities: ['text'],
      context: { contextWindow: CONTEXT_WINDOW },
      reasoning: {
        efforts: REASONING_EFFORTS.map(id => ({
          id: ReasoningEffortId(id),
          name: id === 'xhigh' ? 'Extra high' : id[0].toUpperCase() + id.slice(1),
        })),
        defaultEffort: ReasoningEffortId(DEFAULT_REASONING_EFFORT),
      },
    })
  }

  async *stream(options) {
    // Ordinary turns use Codex's own agent instructions and tools. Re-sending
    // Harness's assembled tool schemas would duplicate tens of thousands of
    // tokens without making those schemas callable through this bridge.
    const forwardedSystem = options.purpose === undefined ? '' : options.system
    const messages = bridgedMessages(options)
    const resolvedContinuation = continuation(messages, forwardedSystem)
    const prompt = codexPrompt({ ...options, messages }, resolvedContinuation)
    const threadOptions = {
      model: options.model,
      workingDirectory: this.config.workingDirectory,
      skipGitRepoCheck: true,
      sandboxMode: options.purpose === undefined ? this.config.sandboxMode : 'read-only',
      approvalPolicy: 'never',
      modelReasoningEffort: resolvedEffort(options.reasoningEffort),
      networkAccessEnabled: this.config.networkAccessEnabled,
      webSearchMode: this.config.networkAccessEnabled ? 'live' : 'disabled',
    }

    let streamed
    let thread
    try {
      const codex = this.createCodex({ env: codexEnvironment() })
      thread = resolvedContinuation.threadId === undefined
        ? codex.startThread(threadOptions)
        : codex.resumeThread(resolvedContinuation.threadId, threadOptions)
      streamed = await thread.runStreamed(
        prompt,
        options.signal === undefined ? undefined : { signal: options.signal },
      )
    } catch (error) {
      throw normalizeError(error, options.signal)
    }

    let nextIndex = 0
    let reasoningIndex
    let reasoningText = ''
    let finalText = ''
    let usage
    let completed = false
    let threadId = resolvedContinuation.threadId

    try {
      for await (const event of streamed.events) {
        switch (event.type) {
          case 'thread.started':
            threadId = event.thread_id
            break
          case 'item.completed':
            if (event.item.type === 'reasoning' && this.config.emitReasoning) {
              if (reasoningIndex === undefined) {
                reasoningIndex = nextIndex++
                yield { type: 'block-start', index: reasoningIndex, blockType: 'reasoning' }
              }
              const separator = reasoningText.length === 0 ? '' : '\n\n'
              const delta = separator + event.item.text
              reasoningText += delta
              yield { type: 'reasoning-delta', index: reasoningIndex, text: delta }
            } else if (event.item.type === 'agent_message') {
              finalText = event.item.text
            }
            break
          case 'turn.completed':
            usage = mappedUsage(event.usage)
            completed = true
            break
          case 'turn.failed':
            throw new Error(event.error.message)
          case 'error':
            throw new Error(event.message)
        }
      }
    } catch (error) {
      throw normalizeError(error, options.signal)
    }

    if (!completed) {
      throw new LlmError('Codex event stream ended before turn completion.', 'STREAM_CLOSED')
    }
    if (reasoningIndex !== undefined) {
      yield {
        type: 'block-end',
        index: reasoningIndex,
        block: { type: 'reasoning', text: reasoningText },
      }
    }
    if (finalText.trim().length === 0) {
      throw new LlmError('Codex completed without a final response.', EMPTY_RESPONSE_CODE)
    }
    const textIndex = nextIndex
    yield { type: 'block-start', index: textIndex, blockType: 'text' }
    yield { type: 'text-delta', index: textIndex, text: finalText }
    yield { type: 'block-end', index: textIndex, block: { type: 'text', text: finalText } }
    if (usage !== undefined) yield { type: 'usage', usage }
    const resolvedThreadId = threadId ?? thread?.id
    if (typeof resolvedThreadId !== 'string' || resolvedThreadId.length === 0) {
      throw new LlmError('Codex completed without a resumable thread id.', 'MALFORMED_RESPONSE')
    }
    yield {
      type: 'finish',
      reason: { kind: 'stop' },
      replayState: {
        response: {
          kind: REPLAY_KIND,
          version: REPLAY_VERSION,
          threadId: resolvedThreadId,
          systemHash: resolvedContinuation.systemHash,
        },
      },
    }
  }
}

/** Register the ChatGPT-backed Codex provider route. */
export function apply(ctx, config = {}) {
  ctx.llm.registerAdapter([PROVIDER], new CodexChatGptAdapter(config))
}
