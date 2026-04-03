import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionList } from '@/components/todos/session-list'
import type { Session } from '@/types/todo'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

function createSession(overrides: Partial<Session> = {}): Session {
  return {
    id: overrides.id ?? 'session-1',
    tool: overrides.tool ?? 'codex',
    command: overrides.command ?? 'codex resume 019d4ebb',
    workingPath: overrides.workingPath ?? '/Users/andynguyen/ai-focus',
    createdAt: overrides.createdAt ?? '2026-04-02T12:00:00.000Z',
  }
}

describe('SessionList', () => {
  const writeText = vi.fn()

  beforeEach(() => {
    writeText.mockResolvedValue(undefined)

    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
  })

  afterEach(() => {
    writeText.mockReset()
  })

  it('renders nothing when there are no sessions', () => {
    const { container } = render(<SessionList sessions={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('groups sessions by tool when expanded', async () => {
    const user = userEvent.setup()

    render(
      <SessionList
        sessions={[
          createSession({ id: 'codex-1', tool: 'codex' }),
          createSession({
            id: 'codex-2',
            tool: 'codex',
            command: 'codex continue',
          }),
          createSession({
            id: 'claude-1',
            tool: 'claude',
            command: 'claude --resume 019d4ebb',
          }),
        ]}
      />,
    )

    await user.click(screen.getByRole('button', { name: /sessions/i }))

    expect(screen.getByText('2 sessions')).toBeInTheDocument()
    expect(screen.getByText('1 session')).toBeInTheDocument()
    expect(screen.getByText('claude --resume 019d4ebb')).toBeInTheDocument()
  })

  it('copies the selected session command to the clipboard', async () => {
    const user = userEvent.setup()

    render(
      <SessionList
        sessions={[
          createSession({ id: 'copy-me', command: 'codex resume copy-me' }),
        ]}
      />,
    )

    await user.click(screen.getByRole('button', { name: /sessions/i }))
    await user.click(screen.getByTitle('Copy to terminal'))

    await waitFor(() => {
      expect(screen.getByTitle('Copied!')).toBeInTheDocument()
    })
  })
})
