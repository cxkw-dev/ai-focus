# Timesheet Button — VPN-Aware Recheck Flow

**Date:** 2026-04-07
**Status:** Draft

## Problem

The timesheet button in the sidebar (`src/components/layout/sidebar.tsx`) currently opens the SAP timesheet URL unconditionally and shows a small green/red dot indicating VPN status. Two issues:

1. When the VPN is disconnected, clicking the button opens the timesheet URL anyway, which then fails to load. The user has no in-app indication that VPN is the problem.
2. The VPN status is fetched once on mount (`staleTime: Infinity`, `refetchOnWindowFocus: false`). If the user connects to VPN after opening the app, the dot stays red until a hard refresh.

## Goals

- Make the timesheet button reflect VPN state visually (disabled when disconnected).
- When the user clicks while disconnected, run a fresh VPN check in case the cached state is stale.
- If the recheck shows VPN is now connected, **automatically open** the timesheet — the user shouldn't need a second click.
- If still disconnected, surface that with anchored, non-intrusive feedback.
- Keep the connected-state click identical to today's behavior.

## Non-goals

- No periodic background polling. Refresh happens on tab focus and on click only.
- No changes to the API route (`src/app/api/vpn-status/route.ts`).
- No retry/backoff logic on the recheck — one HEAD request, single result.
- No changes to the collapsed-sidebar tooltip wrapper or other sidebar nav items.

## UX Specification

### Visual states

| State                          | Dot              | Button opacity         | Cursor        | Click action                                                        |
| ------------------------------ | ---------------- | ---------------------- | ------------- | ------------------------------------------------------------------- |
| `loading` (initial fetch)      | gray             | normal                 | pointer       | opens timesheet                                                     |
| `connected`                    | green            | normal                 | pointer       | opens timesheet                                                     |
| `disconnected`                 | red              | reduced (`opacity-60`) | `not-allowed` | triggers recheck flow                                               |
| `rechecking`                   | pulsing/animated | reduced                | `wait`        | tooltip pinned: "Checking VPN…"                                     |
| `recheck → connected`          | green            | normal                 | pointer       | tooltip flashes "VPN connected — opening timesheet", auto-opens     |
| `recheck → still disconnected` | red              | reduced                | `not-allowed` | tooltip stays: "VPN still disconnected"; auto-dismisses after ~2.5s |

### Click flow

```
user clicks (state = disconnected)
  ↓
synchronously open about:blank in a new tab → hold reference
  ↓
controlled tooltip opens → "Checking VPN…"
  ↓
call refetch() — animated dot
  ↓
  ├─ recheck → connected:
  │     tooltip → "VPN connected — opening timesheet"
  │     wait ~500ms (so the user reads it)
  │     newTab.location.href = TIMESHEET_URL
  │     close tooltip
  │
  └─ recheck → still disconnected:
        tooltip → "VPN still disconnected"
        newTab.close()
        auto-close tooltip after ~2.5s (or on mouse-leave)
```

When state is `connected`, click behavior is unchanged: open `TIMESHEET_URL` directly via the same path used today.

### Why a synchronous blank tab?

`window.open()` can be blocked by the browser when called outside the direct user-gesture window — and our recheck takes up to 3s. To guarantee the new tab opens reliably even on the success path, we open `about:blank` immediately inside the click handler (within the gesture window), then either set its `location.href` (success) or call `.close()` (failure).

Tradeoff: on the failure path, the user briefly sees an empty tab pop open and then close. This is acceptable because the success path is the common case and must be reliable.

## Implementation

### File: `src/hooks/use-vpn-status.ts`

- Change `refetchOnWindowFocus` from `false` → `true`. This satisfies the "refresh when user tabs back" requirement.
- Return the full query result so callers can access `refetch` and `isFetching` (the hook already returns `useQuery(...)` directly, so this is automatic — confirm consumers read these fields).

`isFetching` (not `isLoading`) is what the button uses to know a recheck is in flight, since `isLoading` only fires on the very first fetch.

### File: `src/components/layout/sidebar.tsx`

#### Constant

Move the timesheet URL to a module-level `const TIMESHEET_URL = 'https://s4hprd.sap.kyndryl.net/sap/bc/gui/sap/its/webgui#'` so it can be referenced in both the click handler and the (now-removed) `<a href>`.

#### Element type

Replace the `<a href>` with a `<button type="button">`. The element retains its existing layout/styling. Visual disabled state (when `vpnConnected === false`) sets `opacity-60` and `cursor-not-allowed`, but the button is **not** marked `disabled` because we still need it to receive clicks for the recheck.

#### Click handler

```ts
function handleTimesheetClick() {
  // Treat both `true` (connected) and `undefined` (still loading) as "open anyway".
  // Only the explicit `false` (known disconnected) triggers the recheck flow.
  if (vpnConnected !== false) {
    window.open(TIMESHEET_URL, '_blank', 'noopener,noreferrer')
    return
  }
  // Known disconnected — run recheck flow
  const newTab = window.open('about:blank', '_blank', 'noopener,noreferrer')
  setTooltipState('checking')
  refetch().then((result) => {
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
}
```

`tooltipState` is local component state: `'idle' | 'checking' | 'connected' | 'still-disconnected'`. The `'idle'` state means the recheck-flow tooltip is closed (and the button falls back to its normal hover-tooltip behavior).

#### Tooltip

Use a **single** Radix `Tooltip` wrapping the timesheet button — replacing the current `collapsed`-only tooltip. The tooltip's `open` is controlled and follows this rule:

```
open = tooltipState !== 'idle' || (collapsed && isHovered)
```

(Use Radix's `onOpenChange` to track hover state when `tooltipState === 'idle'`.)

Tooltip content is derived from `tooltipState`:

- `'checking'` → "Checking VPN…"
- `'connected'` → "VPN connected — opening timesheet"
- `'still-disconnected'` → "VPN still disconnected"
- `'idle'` (collapsed-sidebar hover only) → "Timesheet (VPN connected)" or "Timesheet (VPN off)" — same as today

This collapses today's two tooltip behaviors and the new recheck-state tooltip into one component, avoiding nesting concerns.

#### Dot rechecking animation

Add a subtle pulse to the status dot when `tooltipState === 'checking'`. A simple `animate-pulse` Tailwind class keyed off the state is sufficient.

## Testing

Manual verification (no automated test added — this is a small UI flow gated by a network-dependent API):

1. **Connected path:** with VPN on, click the timesheet button → new tab opens to the SAP URL (no tooltip flash). Confirms the connected click is unchanged.
2. **Disconnected → still disconnected:** with VPN off, click the button → tooltip shows "Checking VPN…" → "VPN still disconnected" → auto-dismisses. Brief blank tab opens then closes.
3. **Disconnected → reconnected mid-session:** turn VPN off, load app, turn VPN on, click the button → tooltip shows "Checking VPN…" → "VPN connected — opening timesheet" → blank tab is redirected to the SAP URL.
4. **Tab focus refresh:** turn VPN off, load app (dot red), turn VPN on, switch away from the tab and back → dot turns green without clicking.
5. **Loading state:** on a fresh load, the dot is gray briefly before resolving. During this window `vpnConnected === undefined`, which the click handler treats as "open anyway" (matching today's behavior). Confirm clicking immediately after page load still opens the timesheet without triggering the recheck flow.

## Open considerations (deferred)

- If popup blockers turn out to be aggressive even within the gesture window for some browsers, we may need to fall back to "show only the tooltip success message and require a second click." Defer until observed.
