import type { Register } from 'claude-code'

const PREFIX = '💡 In plain words: '

const SYSTEM = `You explain computer actions to someone with no technical background.
Given a tool call an AI assistant wants to make, reply with ONE short sentence (max 30 words)
saying what it will actually do and whether it changes, deletes, or sends anything.
No jargon, no code, no quotes. If it is risky (deletes files, pushes code, sends data online, installs software), start with "Careful:".`

// Instant, rough explanation shown while the model writes a better one.
const quickGuess = (tool: string, input: Record<string, unknown>): string => {
  const file = typeof input.file_path === 'string' ? input.file_path.split('/').pop() : undefined
  switch (tool) {
    case 'Bash': return 'it wants to run a command on the computer (explaining…)'
    case 'Edit': return `it wants to change the file "${file}"`
    case 'Write': return `it wants to create or overwrite the file "${file}"`
    case 'Read': return `it wants to look at the file "${file}"`
    case 'WebFetch': return `it wants to open the web page ${input.url}`
    case 'WebSearch': return `it wants to search the internet for "${input.query}"`
    default: return tool.startsWith('mcp__')
      ? `it wants to use the connected service "${tool.split('__')[1]}" (explaining…)`
      : `it wants to use the "${tool}" tool (explaining…)`
  }
}

export const register: Register = on => {
  on('tool.call', async ($, e, next) => {
    const id = e.tool_use_id
    if (!id) return next(e)

    const { tool, ...rest } = e as { tool: string } & Record<string, unknown>
    let verdict
    try {
      verdict = await $.tool.check({ tool, input: rest } as never)
    } catch {
      return next(e)
    }
    if (verdict.decision !== 'ask') return next(e)

    $.ui.notice(id, PREFIX + quickGuess(tool, rest))

    const input = JSON.stringify(rest).slice(0, 3000)
    void $.model
      .complete({
        model: 'haiku',
        system: SYSTEM,
        prompt: `Tool: ${tool}\nInput: ${input}`,
        maxTokens: 120,
        effort: 'low',
        timeoutMs: 15000,
      })
      .then(r => {
        if (!r.isAnswered) return
        const line = r.text.replace(/\s+/g, ' ').trim()
        if (line) $.ui.notice(id, PREFIX + line)
      })
      .catch(() => {}) // the dialog may already be answered

    return next(e)
  })
}
