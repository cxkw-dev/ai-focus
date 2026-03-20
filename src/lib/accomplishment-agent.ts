import { db } from '@/lib/db'
import { emit } from '@/lib/events'

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma3:latest'

const PROMPT = `You are a performance review assistant. A developer just completed a task. Decide if it belongs in their performance review and categorize it.

## Rules
1. EXCLUDE administrative and operational tasks that are NOT meaningful professional contributions:
   - Expense reports, reimbursements, timesheets, time tracking
   - Scheduling meetings, booking travel, booking rooms
   - Ordering supplies, equipment requests
   - Filling out routine forms, paperwork, compliance checklists
   - Password resets, account setup, access requests
   - Routine status updates, standup notes
   - Personal errands, appointments
   - Installing/updating software on your own machine (unless it's a team-wide tooling initiative)
2. Only include tasks that clearly represent meaningful professional contributions. If the task is ambiguous or borderline, do NOT include it.
3. Reject trivial tasks: typos, tiny config tweaks, version bumps, dependency updates.

## Categories
- DELIVERY: Features, PRs, code reviews, PR reviews, technical contributions, bug fixes, architecture work
- HIRING: Interviews, candidate evaluation, hiring process improvements
- MENTORING: Onboarding, coaching, helping team members grow
- COLLABORATION: Cross-team work, stakeholder coordination, driving alignment
- GROWTH: Learning new technologies, certifications, skill development, conference talks, courses, reading, exploration
- OTHER: Meaningful accomplishments that don't fit the above categories

## Response format
Respond with ONLY valid JSON. No markdown, no explanation, no wrapping.

If it IS an accomplishment:
{"accomplishment":true,"category":"DELIVERY","title":"Professional, concise accomplishment title written in past tense (e.g. 'Implemented real-time notification system for user engagement')","description":"A 1-2 sentence professional description of the accomplishment suitable for a performance review. Focus on impact and outcome, not implementation details."}

If it is NOT an accomplishment:
{"accomplishment":false}

## Task info
Title: {TITLE}
Description: {DESCRIPTION}
Labels: {LABELS}`

interface CompletedTaskInfo {
  id: string
  title: string
  description: string | null
  labels: { name: string }[]
  completedAt: Date
}

export function evaluateAccomplishment(task: CompletedTaskInfo): void {
  // Fire and forget — don't await, don't block the response
  doEvaluate(task).catch((err) => {
    console.error('[accomplishment-agent] Error evaluating task:', err)
  })
}

function emitEval(stage: string, task: CompletedTaskInfo, extra?: Record<string, unknown>) {
  const payload: Record<string, unknown> = { stage, todoId: task.id, taskTitle: task.title }
  if (extra) Object.assign(payload, extra)
  console.log('[accomplishment-agent] emitEval:', stage, task.title)
  emit('eval', payload)
}

async function doEvaluate(task: CompletedTaskInfo): Promise<void> {
  const prompt = PROMPT
    .replace('{TITLE}', task.title)
    .replace('{DESCRIPTION}', task.description || '(none)')
    .replace('{LABELS}', task.labels.map(l => l.name).join(', ') || '(none)')

  emitEval('analyzing', task)

  let response: Response
  try {
    response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: true,
        options: { temperature: 0.1 },
      }),
    })
  } catch {
    console.error('[accomplishment-agent] Cannot reach Ollama at', OLLAMA_URL)
    emitEval('result', task, { outcome: { created: false } })
    return
  }

  if (!response.ok || !response.body) {
    console.error('[accomplishment-agent] Ollama returned', response.status)
    emitEval('result', task, { outcome: { created: false } })
    return
  }

  // Stream and collect the response
  const responseText = await streamOllamaResponse(response.body)

  emitEval('classifying', task)

  // Extract JSON from the response text (handle potential markdown wrapping)
  const jsonMatch = responseText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.error('[accomplishment-agent] Could not parse JSON from:', responseText)
    emitEval('result', task, { outcome: { created: false } })
    return
  }

  let parsed: { accomplishment: boolean; category?: string; title?: string; description?: string }
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    console.error('[accomplishment-agent] Invalid JSON:', jsonMatch[0])
    emitEval('result', task, { outcome: { created: false } })
    return
  }

  if (!parsed.accomplishment) {
    console.log('[accomplishment-agent] Task not an accomplishment:', task.title)
    emitEval('result', task, { outcome: { created: false } })
    return
  }

  // Race condition defense: re-check that the todo is still COMPLETED
  const currentTodo = await db.todo.findUnique({
    where: { id: task.id },
    select: { status: true },
  })

  if (!currentTodo || currentTodo.status !== 'COMPLETED') {
    console.log('[accomplishment-agent] Task no longer completed, skipping:', task.title)
    emitEval('result', task, { outcome: { created: false } })
    return
  }

  const validCategories = ['DELIVERY', 'HIRING', 'MENTORING', 'COLLABORATION', 'GROWTH', 'OTHER'] as const
  const category = validCategories.includes(parsed.category as typeof validCategories[number])
    ? (parsed.category as typeof validCategories[number])
    : 'OTHER'

  const date = task.completedAt
  const title = parsed.title || task.title
  const description = parsed.description
    || (task.description ? stripHtml(task.description).slice(0, 500) : null)

  await db.accomplishment.create({
    data: {
      title,
      description,
      category,
      date,
      year: date.getFullYear(),
      todoId: task.id,
    },
  })

  emitEval('result', task, { outcome: { created: true, title, category } })
  console.log(`[accomplishment-agent] Created accomplishment: [${category}] ${title}`)
}

async function streamOllamaResponse(
  body: ReadableStream<Uint8Array>,
): Promise<string> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let fullText = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })

      for (const line of chunk.split('\n')) {
        if (!line.trim()) continue
        try {
          const obj = JSON.parse(line) as { response?: string; done?: boolean }
          if (obj.response) {
            fullText += obj.response
          }
        } catch {
          // skip malformed NDJSON lines
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  return fullText.trim()
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}
