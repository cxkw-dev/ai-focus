import { db } from '@/lib/db'
import { emit } from '@/lib/events'

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'mistral:7b'

const PROMPT = `You are a performance review assistant. A developer just completed a task. Decide if it belongs in their performance review and write it up professionally.

## Rules
1. ONLY reject truly trivial tasks: typos, tiny config tweaks, version bumps, dependency updates, routine chores.
2. When in doubt, INCLUDE it. It is better to capture an accomplishment that can be deleted than to miss one.
3. ANY learning, training, skill development, or technology exploration IS an accomplishment under GROWTH.
4. ANY feature work, bug fix, PR, or technical contribution IS an accomplishment under DELIVERY.
5. ANY interview, mentoring, onboarding, or collaboration IS an accomplishment under its respective category.

## Categories
- DELIVERY: Features, PRs, technical contributions, bug fixes
- HIRING: Interviews, candidate evaluation, hiring process improvements
- MENTORING: Onboarding, coaching, code review guidance, helping team members grow
- COLLABORATION: Cross-team work, stakeholder coordination, driving alignment
- GROWTH: Learning new technologies, certifications, skill development, conference talks, courses, reading, exploration

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

function emitEval(stage: string, task: CompletedTaskInfo, outcome?: Record<string, unknown>) {
  const payload: Record<string, unknown> = { stage, todoId: task.id, taskTitle: task.title }
  if (outcome) payload.outcome = outcome
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
        stream: false,
        options: { temperature: 0.1 },
      }),
    })
  } catch {
    console.error('[accomplishment-agent] Cannot reach Ollama at', OLLAMA_URL)
    emitEval('result', task, { created: false })
    return
  }

  if (!response.ok) {
    console.error('[accomplishment-agent] Ollama returned', response.status)
    emitEval('result', task, { created: false })
    return
  }

  emitEval('classifying', task)

  const result = await response.json() as { response: string }
  const text = result.response.trim()

  // Extract JSON from the response (handle potential markdown wrapping)
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.error('[accomplishment-agent] Could not parse JSON from:', text)
    emitEval('result', task, { created: false })
    return
  }

  let parsed: { accomplishment: boolean; category?: string; title?: string; description?: string }
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    console.error('[accomplishment-agent] Invalid JSON:', jsonMatch[0])
    emitEval('result', task, { created: false })
    return
  }

  if (!parsed.accomplishment) {
    console.log('[accomplishment-agent] Task not an accomplishment:', task.title)
    emitEval('result', task, { created: false })
    return
  }

  // Race condition defense: re-check that the todo is still COMPLETED
  // The user may have clicked "Undo" while Ollama was thinking
  const currentTodo = await db.todo.findUnique({
    where: { id: task.id },
    select: { status: true },
  })

  if (!currentTodo || currentTodo.status !== 'COMPLETED') {
    console.log('[accomplishment-agent] Task no longer completed, skipping:', task.title)
    emitEval('result', task, { created: false })
    return
  }

  const validCategories = ['DELIVERY', 'HIRING', 'MENTORING', 'COLLABORATION', 'GROWTH'] as const
  const category = validCategories.includes(parsed.category as typeof validCategories[number])
    ? (parsed.category as typeof validCategories[number])
    : 'DELIVERY'

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

  emitEval('result', task, { created: true, title, category })
  console.log(`[accomplishment-agent] Created accomplishment: [${category}] ${title}`)
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}
