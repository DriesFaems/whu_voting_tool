import { test, expect } from 'claude-code/testing'

test('explains a call that needs permission, in plain words', async ($, on) => {
  const notices: (string | undefined)[] = []
  on('tool.check', () => ({ decision: 'ask' }))
  on('model.complete', () => ({ value: {
    isAnswered: true,
    text: 'Careful: this deletes the folder "build" and everything in it.',
    usage: { input_tokens: 1, output_tokens: 1 },
  } }) as never)
  on('ui.notice', (_$, e) => { notices.push(e.text); return { value: undefined } as never })
  on('tool.call', () => ({ result: 'ok' }) as never)

  await $.tool.call({ tool: 'Bash', command: 'rm -rf build' } as never)

  expect(notices[0]).toContain('run a command')
  expect(notices.at(-1)).toContain('Careful: this deletes the folder')
})

test('stays quiet when no permission is needed', async ($, on) => {
  const notices: unknown[] = []
  let asked = false
  on('tool.check', () => ({ decision: 'allow' }))
  on('model.complete', () => { asked = true; return { value: { isAnswered: false, reason: 'aborted' } } as never })
  on('ui.notice', (_$, e) => { notices.push(e); return { value: undefined } as never })
  on('tool.call', () => ({ result: 'ok' }) as never)

  await $.tool.call({ tool: 'Read', file_path: '/a.md' } as never)

  expect(notices.length).toBe(0)
  expect(asked).toBe(false)
})
