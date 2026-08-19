import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  CodexChatGptAdapter,
  PROVIDER,
  REPLAY_KIND,
  REPLAY_VERSION,
  codexEnvironment,
  continuation,
  codexPrompt,
  bridgedMessages,
} from './index.js'

function message(role, content, source = { kind: 'user' }) {
  return { id: `${role}-${Math.random()}`, role, content: [{ type: 'text', text: content }], source }
}

function eventStream(events) {
  return (async function *generate() {
    for (const event of events) yield event
  })()
}

function fakeCodex(events, calls, onRun) {
  const thread = {
    id: null,
    async runStreamed(prompt) {
      calls.push({ operation: 'run', prompt })
      await onRun?.(prompt)
      return { events: eventStream(events) }
    },
  }
  return {
    startThread(options) {
      calls.push({ operation: 'start', options })
      return thread
    },
    resumeThread(id, options) {
      calls.push({ operation: 'resume', id, options })
      return thread
    },
  }
}

async function collect(stream) {
  const chunks = []
  for await (const chunk of stream) chunks.push(chunk)
  return chunks
}

test('scrubs credential-shaped environment variables', () => {
  assert.deepEqual(codexEnvironment({
    PATH: 'bin',
    HOME: 'home',
    OPENAI_API_KEY: 'secret',
    CODEX_ACCESS_TOKEN: 'secret',
    ELECTRON_RUN_AS_NODE: '1',
  }), { PATH: 'bin', HOME: 'home' })
})

test('omits the Harness tool prompt from ordinary turns but keeps auxiliary instructions', () => {
  const base = {
    provider: PROVIDER,
    model: 'gpt-5.6-sol',
    system: 'large harness tool schema',
    messages: [message('user', 'Hello.')],
  }
  const ordinary = codexPrompt(base, continuation(base.messages, ''))
  assert.doesNotMatch(ordinary, /large harness tool schema/)
  const auxiliaryOptions = { ...base, purpose: 'session-title' }
  const auxiliary = codexPrompt(
    auxiliaryOptions,
    continuation(auxiliaryOptions.messages, auxiliaryOptions.system),
  )
  assert.match(auxiliary, /large harness tool schema/)
})

test('ordinary turns omit Harness plugin context but auxiliary calls retain it', () => {
  const user = message('user', 'Actual request.')
  const injected = message('user', 'Large tool catalog.', {
    kind: 'plugin',
    plugin: 'skill-catalog',
    form: 'catalog',
  })
  const ordinary = {
    provider: PROVIDER,
    model: 'gpt-5.6-sol',
    messages: [injected, user],
  }
  assert.deepEqual(bridgedMessages(ordinary), [user])
  assert.deepEqual(
    bridgedMessages({ ...ordinary, purpose: 'compaction' }),
    [injected, user],
  )
})

test('streams a Codex answer, usage, and durable thread replay state', async () => {
  const calls = []
  const events = [
    { type: 'thread.started', thread_id: 'thread-1' },
    { type: 'turn.started' },
    { type: 'item.completed', item: { id: 'r', type: 'reasoning', text: 'Checked.' } },
    { type: 'item.completed', item: { id: 'a', type: 'agent_message', text: 'Done.' } },
    {
      type: 'turn.completed',
      usage: {
        input_tokens: 12,
        cached_input_tokens: 2,
        cache_write_input_tokens: 1,
        output_tokens: 4,
        reasoning_output_tokens: 1,
      },
    },
  ]
  const adapter = new CodexChatGptAdapter(
    { workingDirectory: process.cwd() },
    () => fakeCodex(events, calls),
  )
  const chunks = await collect(adapter.stream({
    provider: PROVIDER,
    model: 'gpt-5.6-sol',
    system: 'Be exact.',
    messages: [message('user', 'Do it.')],
  }))

  assert.equal(calls[0].operation, 'start')
  assert.equal(chunks.find(chunk => chunk.type === 'block-end' && chunk.block.type === 'text').block.text, 'Done.')
  assert.deepEqual(chunks.find(chunk => chunk.type === 'usage').usage, {
    inputTokens: 9,
    outputTokens: 4,
    cacheReadTokens: 2,
    cacheWriteTokens: 1,
    reasoningTokens: 1,
  })
  const finish = chunks.at(-1)
  assert.equal(finish.type, 'finish')
  assert.equal(finish.replayState.response.threadId, 'thread-1')
})

test('resumes only when the latest assistant carries matching replay state', async () => {
  const system = 'Same system.'
  const initial = continuation([], '')
  const assistant = message('assistant', 'Earlier answer.', {
    kind: 'model',
    provider: PROVIDER,
    model: 'gpt-5.6-sol',
    replayState: {
      response: {
        kind: REPLAY_KIND,
        version: REPLAY_VERSION,
        threadId: 'thread-9',
        systemHash: initial.systemHash,
      },
    },
  })
  const calls = []
  const adapter = new CodexChatGptAdapter(
    { workingDirectory: process.cwd(), emitReasoning: false },
    () => fakeCodex([
      { type: 'item.completed', item: { id: 'a', type: 'agent_message', text: 'Next.' } },
      {
        type: 'turn.completed',
        usage: {
          input_tokens: 1,
          cached_input_tokens: 0,
          cache_write_input_tokens: 0,
          output_tokens: 1,
          reasoning_output_tokens: 0,
        },
      },
    ], calls),
  )
  await collect(adapter.stream({
    provider: PROVIDER,
    model: 'gpt-5.6-sol',
    system,
    messages: [message('user', 'First.'), assistant, message('user', 'Continue.')],
  }))

  assert.deepEqual(calls[0], {
    operation: 'resume',
    id: 'thread-9',
    options: calls[0].options,
  })
  assert.match(calls[1].prompt, /Continue\./)
  assert.doesNotMatch(calls[1].prompt, /First\./)
})

test('advertises image input for every ChatGPT-backed model', async () => {
  const adapter = new CodexChatGptAdapter({ workingDirectory: process.cwd() })
  const listed = await adapter.listModels(PROVIDER)
  assert.ok(listed.length > 0)
  assert.ok(listed.every(model => model.inputModalities.includes('image')))
  const resolved = await adapter.resolveModel(PROVIDER, 'gpt-5.6-sol')
  assert.deepEqual(resolved.inputModalities, ['text', 'image'])
})

test('materializes Harness image attachments as Codex local image inputs', async () => {
  const calls = []
  const attachment = {
    attachmentId: 'image-1',
    mediaType: 'image/png',
    bytes: 4,
    width: 1,
    height: 1,
    name: 'pixel.png',
  }
  let materializedPath
  const adapter = new CodexChatGptAdapter(
    {
      workingDirectory: process.cwd(),
      resolveAttachments: () => ({
        async readImage(ref) {
          assert.equal(ref, attachment)
          return { ref, data: new Uint8Array([1, 2, 3, 4]) }
        },
      }),
    },
    () => fakeCodex([
      { type: 'thread.started', thread_id: 'thread-image' },
      { type: 'item.completed', item: { id: 'a', type: 'agent_message', text: 'I see it.' } },
      {
        type: 'turn.completed',
        usage: {
          input_tokens: 1,
          cached_input_tokens: 0,
          cache_write_input_tokens: 0,
          output_tokens: 1,
          reasoning_output_tokens: 0,
        },
      },
    ], calls, async input => {
      materializedPath = input[1].path
      assert.deepEqual([...await readFile(materializedPath)], [1, 2, 3, 4])
    }),
  )
  await collect(adapter.stream({
    provider: PROVIDER,
    model: 'gpt-5.6-sol',
    messages: [{
      id: 'image',
      role: 'user',
      source: { kind: 'user' },
      content: [
        { type: 'image', attachment },
        { type: 'text', text: 'What is this?' },
      ],
    }],
  }))

  const input = calls.find(call => call.operation === 'run').prompt
  assert.ok(Array.isArray(input))
  assert.equal(input[0].type, 'text')
  assert.match(input[0].text, /What is this\?/)
  assert.match(input[0].text, /"imageIndex":0/)
  assert.equal(input[1].type, 'local_image')
  assert.match(input[1].path, /\.png$/)
  await assert.rejects(access(materializedPath))
})
