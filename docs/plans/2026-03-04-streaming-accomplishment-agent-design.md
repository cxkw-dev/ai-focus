# Streaming Accomplishment Agent Design

## Summary
Switch from mistral:7b to qwen3.5:latest and add streaming UI that shows the agent's thinking process in a floating card.

## Model Change
- Default model: `mistral:7b` -> `qwen3.5:latest`
- Updated in: `accomplishment-agent.ts`, `api/ollama/route.ts`

## Backend: Streaming Ollama
- Change Ollama call to `stream: true`
- Parse NDJSON stream, accumulate tokens
- Extract `<think>...</think>` content separately from final JSON
- Emit SSE events with partial thinking text (~100ms throttle)
- On stream complete, parse JSON from non-think portion, proceed as before

## New SSE stage: `thinking`
- New stage in `EvalStage`: `thinking`
- New field on `EvalEntry`: `thinkingText`
- Emitted incrementally: `{ stage: 'thinking', todoId, taskTitle, thinkingText: "accumulated..." }`

## Frontend: Floating card (bottom-right)
- Replaces top-center pill
- During thinking: ~320px card, header with task title + spinner, body with streaming text (max ~6 lines, auto-scroll)
- On result: transitions to show result (accomplishment + category badge, or "not an accomplishment"), auto-dismiss after 4s
- Framer Motion animations

## Files to change
1. `src/lib/accomplishment-agent.ts` - streaming + think parsing + SSE
2. `src/app/api/ollama/route.ts` - model default
3. `src/lib/eval-store.ts` - add thinkingText, thinking stage
4. `src/components/ui/eval-pill.tsx` - replace with floating card
