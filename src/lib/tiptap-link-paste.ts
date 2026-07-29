import type { EditorView } from '@tiptap/pm/view'
import { isSingleUrl, prettyLinkLabel } from './link-label'
import { ensureProtocol } from './rich-text'

/**
 * Slack-style paste: a bare URL lands as a short labelled link rather than a
 * line of address bar. Anything else returns false so TipTap's own handling
 * still applies — notably linking a selection, where the user has already
 * written the label they want.
 */
export function handleLinkPaste(
  view: EditorView,
  event: ClipboardEvent,
): boolean {
  const text = event.clipboardData?.getData('text/plain') ?? ''
  if (!isSingleUrl(text)) return false

  const { state } = view
  const linkMark = state.schema.marks.link
  if (!linkMark || !state.selection.empty) return false

  const url = text.trim()
  const href = ensureProtocol(url)
  if (href === '#') return false

  const link = state.schema.text(prettyLinkLabel(url), [
    linkMark.create({ href, target: '_blank', rel: 'noopener noreferrer' }),
  ])

  view.dispatch(
    state.tr
      .replaceSelectionWith(link, false)
      // Whatever gets typed next is a new thought, not part of the link.
      .removeStoredMark(linkMark)
      .scrollIntoView(),
  )
  return true
}
