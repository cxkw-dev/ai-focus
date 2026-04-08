# Timesheet VPN-Aware Recheck Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the sidebar timesheet button visually disabled when the VPN is off, and clicking the disabled button runs a fresh VPN check that auto-opens the timesheet if the user has since connected (or shows an anchored "still disconnected" tooltip if not).

**Architecture:** All changes are confined to two files. The hook (`use-vpn-status.ts`) gets one line changed to enable tab-focus refetch. The sidebar component (`sidebar.tsx`) gets the timesheet `<a>` converted to a `<button>` with a controlled Radix tooltip that surfaces recheck state. To dodge popup blockers when auto-opening after the async recheck, the click handler synchronously opens an `about:blank` tab inside the user-gesture window and either redirects it (success) or closes it (failure).

**Tech Stack:** Next.js 16, React 19, TanStack React Query (`refetch` / `isFetching`), Radix `Tooltip` (controlled `open`), Tailwind v4.

**Spec:** [`docs/superpowers/specs/2026-04-07-timesheet-vpn-recheck-design.md`](../specs/2026-04-07-timesheet-vpn-recheck-design.md)

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/hooks/use-vpn-status.ts` | Modify | Refetch VPN status when the user tabs back into the app |
| `src/components/layout/sidebar.tsx` | Modify | Replace the timesheet `<a>` with a state-driven `<button>` and a controlled tooltip; render the recheck flow |

No new files. No new dependencies.

---

## Manual Verification Strategy

This change is a small UI flow gated by a network-dependent endpoint (`/api/vpn-status`) that depends on real VPN state. The project does not have a component-test setup for sidebar UI, and the spec explicitly calls for **manual verification only**. Each task ends with:

1. `npm run lint` (must pass clean)
2. `npx tsc --noEmit` (must pass clean)
3. A targeted manual check (described per task) using the local dev server (`npm run dev`, http://localhost:3000)

The user runs `npm run dev` continuously and observes hot reload. Do not rebuild Docker.

The full end-to-end checks from the spec run as Task 7.

---

## Task 1: Refetch VPN status on tab focus

**Files:**
- Modify: `src/hooks/use-vpn-status.ts:1-15`

- [ ] **Step 1: Change `refetchOnWindowFocus` to `true`**

Open `src/hooks/use-vpn-status.ts`. Change the line that reads:

```ts
refetchOnWindowFocus: false,
```

to:

```ts
refetchOnWindowFocus: true,
```

The full file should now be:

```ts
import { useQuery } from '@tanstack/react-query'

export function useVpnStatus() {
  return useQuery({
    queryKey: ['vpn-status'],
    queryFn: async () => {
      const res = await fetch('/api/vpn-status')
      const data = await res.json()
      return data.connected as boolean
    },
    staleTime: Infinity,
    refetchOnWindowFocus: true,
    refetchOnReconnect: false,
  })
}
```

- [ ] **Step 2: Verify lint and typecheck pass**

Run:
```bash
npm run lint && npx tsc --noEmit
```
Expected: both commands exit cleanly with no errors.

- [ ] **Step 3: Manual verification — tab-focus refetch**

With the dev server running:
1. Disconnect from VPN.
2. Reload the app — confirm the dot on the timesheet icon (sidebar) is **red**.
3. Connect to VPN.
4. Switch to a different browser tab, then switch back to the app tab.
5. Confirm the dot turns **green** within a second or two without any user clicks.

If the dot does not turn green, open DevTools → Network and confirm that `/api/vpn-status` was hit when the tab regained focus. If not, the React Query refetch did not fire — check that the `refetchOnWindowFocus: true` change was actually saved.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/use-vpn-status.ts
git commit -m "vpn status: refetch on window focus"
```

---

## Task 2: Extract `TIMESHEET_URL` constant and convert `<a>` to `<button>`

**Goal of this task:** Pure refactor — no observable behavior change. The button still opens the timesheet on click via `window.open`. This task isolates the element-type swap so subsequent tasks can layer on the tooltip and recheck flow against a known-good baseline.

**Files:**
- Modify: `src/components/layout/sidebar.tsx` (top of file + the `timesheetButton` JSX, currently around lines 182–219)

- [ ] **Step 1: Add the `TIMESHEET_URL` constant near the top of the file**

In `src/components/layout/sidebar.tsx`, find the existing module-level `topNavItems` array (around line 36). **Above it**, add:

```ts
const TIMESHEET_URL =
  'https://s4hprd.sap.kyndryl.net/sap/bc/gui/sap/its/webgui#'
```

- [ ] **Step 2: Replace the `timesheetButton` JSX**

Find the existing `timesheetButton` constant inside the `Sidebar` function (currently around lines 182–219). It looks like:

```tsx
const timesheetButton = (
  <a
    href="https://s4hprd.sap.kyndryl.net/sap/bc/gui/sap/its/webgui#"
    target="_blank"
    rel="noopener noreferrer"
    className={`flex items-center rounded-lg py-2.5 text-sm font-medium transition-colors duration-200 ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'}`}
    style={{ color: 'var(--text-muted)' }}
  >
    <span className="relative shrink-0">
      <Clock className="h-5 w-5" />
      <span
        className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border"
        style={{
          borderColor: 'var(--surface)',
          backgroundColor: vpnLoading
            ? 'var(--text-muted)'
            : vpnConnected
              ? '#22c55e'
              : '#ef4444',
        }}
      />
    </span>
    <AnimatePresence mode="wait">
      {!collapsed && (
        <motion.span
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 'auto' }}
          exit={{ opacity: 0, width: 0 }}
          transition={{ duration: 0.15 }}
          className="flex items-center gap-2 overflow-hidden whitespace-nowrap"
        >
          Timesheet
          <ExternalLink className="h-3 w-3 opacity-50" />
        </motion.span>
      )}
    </AnimatePresence>
  </a>
)
```

Replace it with:

```tsx
const timesheetButton = (
  <button
    type="button"
    onClick={() =>
      window.open(TIMESHEET_URL, '_blank', 'noopener,noreferrer')
    }
    className={`flex w-full items-center rounded-lg py-2.5 text-sm font-medium transition-colors duration-200 ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'}`}
    style={{ color: 'var(--text-muted)' }}
  >
    <span className="relative shrink-0">
      <Clock className="h-5 w-5" />
      <span
        className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border"
        style={{
          borderColor: 'var(--surface)',
          backgroundColor: vpnLoading
            ? 'var(--text-muted)'
            : vpnConnected
              ? '#22c55e'
              : '#ef4444',
        }}
      />
    </span>
    <AnimatePresence mode="wait">
      {!collapsed && (
        <motion.span
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 'auto' }}
          exit={{ opacity: 0, width: 0 }}
          transition={{ duration: 0.15 }}
          className="flex items-center gap-2 overflow-hidden whitespace-nowrap"
        >
          Timesheet
          <ExternalLink className="h-3 w-3 opacity-50" />
        </motion.span>
      )}
    </AnimatePresence>
  </button>
)
```

Notes on what changed:
- `<a href target rel>` → `<button type="button" onClick>`
- Added `w-full` to the className so the button stretches to fill the nav width (the `<a>` was a flex child and stretched implicitly; `<button>` does not).
- Inner spans, dot logic, and `AnimatePresence` block are unchanged — copy them verbatim.

- [ ] **Step 3: Verify lint and typecheck pass**

```bash
npm run lint && npx tsc --noEmit
```
Expected: both commands exit cleanly.

- [ ] **Step 4: Manual verification — clicking still opens timesheet**

In the running dev app:
1. Click the Timesheet button in the sidebar.
2. Confirm a new tab opens to the SAP timesheet URL.
3. Confirm the button still looks visually identical to before (full width, same dot, same Clock icon, same hover behavior).

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/sidebar.tsx
git commit -m "sidebar: convert timesheet link to button"
```

---

## Task 3: Add `tooltipState` and the full click handler with recheck flow

**Goal of this task:** Wire up the recheck behavior. After this task, clicking the button when disconnected will run `refetch()`, open a blank tab, and either redirect or close it. The recheck-state tooltip is **not yet rendered** — that's Task 4. The disabled visual style is also not yet present — that's Task 5. So in this interim state, the recheck happens silently from the user's perspective; you verify it via DevTools.

**Files:**
- Modify: `src/components/layout/sidebar.tsx` (the `Sidebar` function body — destructure, state, handler)

- [ ] **Step 1: Destructure `refetch` from `useVpnStatus`**

Find this line in the `Sidebar` function (currently around line 180):

```tsx
const { data: vpnConnected, isLoading: vpnLoading } = useVpnStatus()
```

Change it to:

```tsx
const { data: vpnConnected, isLoading: vpnLoading, refetch: refetchVpn } =
  useVpnStatus()
```

- [ ] **Step 2: Add the `TooltipState` type and `tooltipState` state hook**

Immediately below the `useVpnStatus` line you just changed, add:

```tsx
type TimesheetTooltipState =
  | 'idle'
  | 'checking'
  | 'connected'
  | 'still-disconnected'
const [tooltipState, setTooltipState] =
  React.useState<TimesheetTooltipState>('idle')
```

(`React` is already imported as `import * as React from 'react'` at line 3, so `React.useState` works without changing imports.)

- [ ] **Step 3: Add the `handleTimesheetClick` handler**

Below the `tooltipState` declaration you just added, add:

```tsx
const handleTimesheetClick = React.useCallback(() => {
  // Treat both `true` (connected) and `undefined` (still loading) as
  // "open anyway". Only the explicit `false` (known disconnected)
  // triggers the recheck flow.
  if (vpnConnected !== false) {
    window.open(TIMESHEET_URL, '_blank', 'noopener,noreferrer')
    return
  }
  // Known disconnected — open about:blank synchronously inside the
  // user-gesture window so the popup blocker doesn't bite, then run
  // the recheck and either redirect or close the new tab.
  const newTab = window.open(
    'about:blank',
    '_blank',
    'noopener,noreferrer',
  )
  setTooltipState('checking')
  refetchVpn().then((result) => {
    if (result.data === true) {
      setTooltipState('connected')
      setTimeout(() => {
        if (newTab) newTab.location.href = TIMESHEET_URL
        setTooltipState('idle')
      }, 500)
    } else {
      setTooltipState('still-disconnected')
      if (newTab) newTab.close()
      setTimeout(() => setTooltipState('idle'), 2500)
    }
  })
}, [vpnConnected, refetchVpn])
```

- [ ] **Step 4: Wire the handler to the button**

In the `timesheetButton` JSX from Task 2, change:

```tsx
onClick={() =>
  window.open(TIMESHEET_URL, '_blank', 'noopener,noreferrer')
}
```

to:

```tsx
onClick={handleTimesheetClick}
```

- [ ] **Step 5: Verify lint and typecheck pass**

```bash
npm run lint && npx tsc --noEmit
```
Expected: both commands exit cleanly.

- [ ] **Step 6: Manual verification — recheck flow runs (no visible feedback yet)**

In the running dev app, with VPN **disconnected**:
1. Open DevTools → Network and filter to `vpn-status`.
2. Click the Timesheet button.
3. Confirm a new tab opens to `about:blank` and then **closes** automatically within ~3 seconds (recheck failure path).
4. Confirm a fresh `GET /api/vpn-status` request appears in the Network panel.

With VPN **connected**:
1. Click the Timesheet button.
2. Confirm a new tab opens to the SAP timesheet URL **immediately** (the `vpnConnected !== false` branch — no recheck, no blank tab).

Then disconnect from VPN, reload (so the dot is red), reconnect from VPN, and click:
1. Confirm a new tab opens to `about:blank`.
2. After ~3 seconds the recheck succeeds and the blank tab redirects to the SAP timesheet URL.

Note: there is intentionally no on-screen tooltip yet. That's Task 4.

- [ ] **Step 7: Commit**

```bash
git add src/components/layout/sidebar.tsx
git commit -m "sidebar: add timesheet vpn recheck click handler"
```

---

## Task 4: Replace the collapsed-only tooltip with a single merged controlled tooltip

**Goal of this task:** Render the recheck-state feedback. Use one Radix `Tooltip` that wraps the button always, with a controlled `open` state that fires when `tooltipState !== 'idle'` OR when the sidebar is collapsed and the user is hovering. After this task, the user sees the "Checking VPN…" / "VPN connected — opening timesheet" / "VPN still disconnected" feedback.

**Files:**
- Modify: `src/components/layout/sidebar.tsx` (the `Sidebar` function body — add hover state; the timesheet section JSX, currently around lines 287–302)

- [ ] **Step 1: Add an `isHovering` state for the collapsed-hover fallback**

Immediately below the `tooltipState` declaration from Task 3, add:

```tsx
const [isTimesheetHovered, setIsTimesheetHovered] = React.useState(false)
```

- [ ] **Step 2: Compute the controlled tooltip open and content**

Immediately below the `handleTimesheetClick` declaration from Task 3, add:

```tsx
const tooltipOpen =
  tooltipState !== 'idle' || (collapsed && isTimesheetHovered)

let tooltipMessage: string
if (tooltipState === 'checking') {
  tooltipMessage = 'Checking VPN…'
} else if (tooltipState === 'connected') {
  tooltipMessage = 'VPN connected — opening timesheet'
} else if (tooltipState === 'still-disconnected') {
  tooltipMessage = 'VPN still disconnected'
} else {
  tooltipMessage = `Timesheet ${vpnConnected ? '(VPN connected)' : '(VPN off)'}`
}
```

- [ ] **Step 3: Replace the existing collapsed-only Tooltip block**

Find this block in the JSX (currently around lines 287–302):

```tsx
{/* Timesheet Section */}
<nav
  className={`flex flex-col gap-1 border-t ${collapsed ? 'px-2 py-3' : 'p-3'}`}
  style={{ borderColor: 'var(--border-color)' }}
>
  {collapsed ? (
    <Tooltip>
      <TooltipTrigger asChild>{timesheetButton}</TooltipTrigger>
      <TooltipContent side="right" className="font-medium">
        Timesheet {vpnConnected ? '(VPN connected)' : '(VPN off)'}
      </TooltipContent>
    </Tooltip>
  ) : (
    timesheetButton
  )}
</nav>
```

Replace it with:

```tsx
{/* Timesheet Section */}
<nav
  className={`flex flex-col gap-1 border-t ${collapsed ? 'px-2 py-3' : 'p-3'}`}
  style={{ borderColor: 'var(--border-color)' }}
>
  <Tooltip
    open={tooltipOpen}
    onOpenChange={(next) => {
      // Only let hover toggle the tooltip when the sidebar is collapsed
      // and the recheck flow isn't actively driving the open state.
      if (tooltipState === 'idle' && collapsed) {
        setIsTimesheetHovered(next)
      }
    }}
  >
    <TooltipTrigger asChild>{timesheetButton}</TooltipTrigger>
    <TooltipContent side="right" className="font-medium">
      {tooltipMessage}
    </TooltipContent>
  </Tooltip>
</nav>
```

What this does:
- The `Tooltip` is always rendered (no `collapsed ? : :` branch).
- `open={tooltipOpen}` makes it controlled. The tooltip opens when the recheck flow drives it (any non-idle state) OR when the user hovers in the collapsed sidebar.
- `onOpenChange` lets Radix tell us about hover events; we only honor them when we're idle AND collapsed (otherwise the recheck flow owns the open state).
- When idle and the sidebar is expanded, `tooltipOpen` is always `false` (matching today's expanded-sidebar behavior — no hover tooltip).
- The content text is computed once via `tooltipMessage` and includes the original collapsed-hover label as the idle fallback.

- [ ] **Step 4: Verify lint and typecheck pass**

```bash
npm run lint && npx tsc --noEmit
```
Expected: both commands exit cleanly.

- [ ] **Step 5: Manual verification — tooltip feedback renders**

With the dev app running:

**Expanded sidebar, VPN connected:**
1. Hover the Timesheet button → no tooltip (matches today).
2. Click → new tab opens immediately (no tooltip flash).

**Expanded sidebar, VPN disconnected:**
1. Hover the Timesheet button → no tooltip.
2. Click → tooltip appears: "Checking VPN…" → after ~3s, "VPN still disconnected" → auto-dismisses after 2.5s.

**Expanded sidebar, VPN reconnected after page load:**
1. Reload while VPN is off (dot red).
2. Reconnect to VPN.
3. Click the button → tooltip: "Checking VPN…" → "VPN connected — opening timesheet" → blank tab redirects to SAP URL → tooltip closes.

**Collapsed sidebar, VPN connected:**
1. Collapse the sidebar.
2. Hover the Timesheet button → tooltip: "Timesheet (VPN connected)".
3. Mouse away → tooltip closes.

**Collapsed sidebar, VPN disconnected:**
1. Collapse the sidebar with VPN off.
2. Hover → tooltip: "Timesheet (VPN off)".

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/sidebar.tsx
git commit -m "sidebar: merged controlled tooltip for timesheet recheck feedback"
```

---

## Task 5: Add visual disabled state when VPN is known disconnected

**Goal of this task:** When `vpnConnected === false`, show the button as visually disabled (reduced opacity, `cursor-not-allowed`). The button still receives clicks because the click handler needs to fire the recheck.

**Files:**
- Modify: `src/components/layout/sidebar.tsx` (the `timesheetButton` JSX className)

- [ ] **Step 1: Add the conditional disabled styling**

In the `timesheetButton` JSX, find:

```tsx
<button
  type="button"
  onClick={handleTimesheetClick}
  className={`flex w-full items-center rounded-lg py-2.5 text-sm font-medium transition-colors duration-200 ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'}`}
  style={{ color: 'var(--text-muted)' }}
>
```

Replace with:

```tsx
<button
  type="button"
  onClick={handleTimesheetClick}
  className={`flex w-full items-center rounded-lg py-2.5 text-sm font-medium transition-colors duration-200 ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'} ${vpnConnected === false ? 'cursor-not-allowed opacity-60' : ''}`}
  style={{ color: 'var(--text-muted)' }}
>
```

The change adds `cursor-not-allowed opacity-60` to the className only when `vpnConnected === false` (known disconnected). The `loading` and `connected` states leave the button at full opacity with the default pointer cursor.

- [ ] **Step 2: Verify lint and typecheck pass**

```bash
npm run lint && npx tsc --noEmit
```
Expected: both commands exit cleanly.

- [ ] **Step 3: Manual verification — visual disabled state**

With the dev app running:
1. **VPN connected:** Confirm the Timesheet button looks normal (full opacity, pointer cursor on hover).
2. **VPN disconnected:** Confirm the button looks dimmed (reduced opacity) and the cursor changes to `not-allowed` on hover.
3. **Loading state (page reload):** Confirm during the brief gray-dot window the button looks normal — `vpnConnected === undefined`, not `false`.
4. **Click while disconnected:** Confirm the button is still clickable despite the disabled appearance — the recheck flow still runs.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/sidebar.tsx
git commit -m "sidebar: visual disabled style for timesheet when vpn off"
```

---

## Task 6: Pulse the status dot during the recheck

**Goal of this task:** Visual reinforcement that something is happening. While `tooltipState === 'checking'`, the small status dot on the Clock icon pulses.

**Files:**
- Modify: `src/components/layout/sidebar.tsx` (the dot `<span>` inside `timesheetButton`)

- [ ] **Step 1: Add the pulse class conditionally**

In the `timesheetButton` JSX, find the inner status dot span:

```tsx
<span
  className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border"
  style={{
    borderColor: 'var(--surface)',
    backgroundColor: vpnLoading
      ? 'var(--text-muted)'
      : vpnConnected
        ? '#22c55e'
        : '#ef4444',
  }}
/>
```

Replace with:

```tsx
<span
  className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border ${tooltipState === 'checking' ? 'animate-pulse' : ''}`}
  style={{
    borderColor: 'var(--surface)',
    backgroundColor: vpnLoading
      ? 'var(--text-muted)'
      : vpnConnected
        ? '#22c55e'
        : '#ef4444',
  }}
/>
```

- [ ] **Step 2: Verify lint and typecheck pass**

```bash
npm run lint && npx tsc --noEmit
```
Expected: both commands exit cleanly.

- [ ] **Step 3: Manual verification — dot pulses during recheck**

With VPN disconnected:
1. Click the Timesheet button.
2. Confirm the small red dot on the Clock icon **pulses** (Tailwind `animate-pulse` — opacity ramps up and down) during the ~3-second recheck.
3. After the recheck resolves, the pulse stops.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/sidebar.tsx
git commit -m "sidebar: pulse vpn dot during timesheet recheck"
```

---

## Task 7: Final end-to-end manual verification

**Goal of this task:** Walk through every scenario from the spec's Testing section against the integrated implementation. Catch anything that the per-task verifications missed.

**Files:** None (verification only).

- [ ] **Step 1: Run through the five spec scenarios**

With the dev server running and DevTools Network panel open:

1. **Connected path:** VPN on. Click the Timesheet button → new tab opens directly to `https://s4hprd.sap.kyndryl.net/sap/bc/gui/sap/its/webgui#`. No tooltip flash. No `about:blank` step. Confirm the connected click is unchanged from today.

2. **Disconnected → still disconnected:** VPN off. Click the Timesheet button → tooltip "Checking VPN…" appears immediately, the dot pulses, an `about:blank` tab pops open. After ~3s the tooltip changes to "VPN still disconnected" and the blank tab closes. Tooltip auto-dismisses after another ~2.5s.

3. **Disconnected → reconnected mid-session:** Turn VPN off. Reload the app — confirm the dot is red and the button is dimmed. Turn VPN on. Click the Timesheet button → tooltip "Checking VPN…" → after ~3s "VPN connected — opening timesheet" → the previously-blank tab redirects to the SAP timesheet URL. Tooltip closes.

4. **Tab focus refresh:** Turn VPN off. Reload the app (dot red, button dimmed). Turn VPN on. Switch to a different browser tab, then switch back to the app tab. Confirm the dot turns green and the button un-dims **without any clicks**. (This verifies Task 1's `refetchOnWindowFocus: true`.)

5. **Loading state:** Hard-refresh the app (Cmd+Shift+R). During the brief moment the dot is gray (initial fetch in flight), click the Timesheet button. Confirm a new tab opens to the SAP timesheet URL immediately — no recheck flow, no blank tab. (This verifies the `vpnConnected !== false` guard in the click handler.)

- [ ] **Step 2: Verify each scenario passes**

If any scenario fails, fix the underlying issue before proceeding. Common failure modes to check:

- **Scenario 1 fails (connected click triggers recheck):** Check the `if (vpnConnected !== false)` condition in `handleTimesheetClick`. It should fire `window.open` and `return` for both `true` and `undefined`.
- **Scenario 2 fails (no tooltip appears):** Check the `Tooltip`'s `open={tooltipOpen}` prop and the `tooltipOpen` derivation. The tooltip is controlled — it won't open via hover when the recheck flow is the driver.
- **Scenario 3 fails (popup blocked):** Confirm the `about:blank` `window.open` call is the **first** thing that happens in the disconnected branch of `handleTimesheetClick`, before the `refetchVpn().then(...)` chain. If you accidentally moved it inside the `.then`, the browser will block it.
- **Scenario 4 fails (dot stays red after tab focus):** Confirm `refetchOnWindowFocus: true` in `use-vpn-status.ts`. Also check that `staleTime: Infinity` isn't preventing a fresh request — actually, `staleTime: Infinity` is fine here because React Query's window-focus refetch fires regardless of staleTime.
- **Scenario 5 fails (loading-state click triggers recheck):** Same as scenario 1 — the `!== false` guard handles `undefined`.

- [ ] **Step 3: No commit needed if everything passes**

If you had to make code changes during scenario fixes, commit them with a focused message describing the fix. Otherwise, this task produces no commit — the implementation is complete after Task 6.

---

## Out of scope

The spec's "Open considerations (deferred)" lists one item that is intentionally NOT addressed by this plan:

- **Aggressive popup blockers that block even within the gesture window.** If observed in practice, the fallback is "show only the tooltip success message and require a second click." Add a follow-up plan if this becomes a real issue.
