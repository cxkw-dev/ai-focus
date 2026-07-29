/**
 * A pasted URL is usually the least readable thing on a card — a SharePoint
 * link runs five lines and says nothing. Slack solves this by showing what the
 * link *is* rather than how to get there, so we do the same: keep the href
 * intact and label it with the host plus whatever names the document.
 */
const MAX_LABEL_LENGTH = 36
/** Below this a truncated name is unreadable, so the host is dropped instead. */
const MIN_NAME_LENGTH = 16

/** Params that carry the real name when the path only names the viewer. */
const NAME_PARAMS = ['file', 'filename', 'name', 'title', 'doc', 'document']

/** Path segments that name the viewer rather than the document. */
const GENERIC_SEGMENTS = new Set([
  'default.aspx',
  'doc.aspx',
  'edit',
  'home',
  'index.htm',
  'index.html',
  'index.php',
  'view',
  'viewer',
])

/**
 * Parsed only to be read from — labels never become an href, so the unsafe
 * protocol check that guards links (see rich-text) doesn't belong here. Keeping
 * it out also keeps this module free of a cycle with rich-text.
 */
function parseUrl(rawUrl: string): URL | null {
  // URLs lifted out of stored HTML arrive with their separators escaped, and
  // `&amp;file=` hides the very param that names the document.
  const trimmed = rawUrl.trim().replace(/&amp;/gi, '&')
  const withProtocol = /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`
  try {
    return new URL(withProtocol)
  } catch {
    return null
  }
}

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment)
  } catch {
    // A stray `%` isn't worth losing the segment over.
    return segment
  }
}

/** `abcdefghij` at 7 → `abc…hij`. Keeps both ends, which is where meaning is. */
export function truncateMiddle(value: string, max: number): string {
  if (value.length <= max) return value
  if (max <= 1) return '…'
  const head = Math.ceil((max - 1) / 2)
  const tail = max - 1 - head
  return `${value.slice(0, head)}…${tail > 0 ? value.slice(-tail) : ''}`
}

/**
 * Hosts worth knowing by shape. A generic label would render a pull request as
 * `github.com/pull/1234`, which buries the only part anyone reads.
 */
function knownServiceLabel(host: string, url: URL): string {
  if (host !== 'github.com') return ''
  const [owner, repo, kind, number] = url.pathname.split('/').filter(Boolean)
  if (!owner || !repo) return ''
  if (number && (kind === 'pull' || kind === 'issues')) {
    return `${owner}/${repo}#${number}`
  }
  return `${owner}/${repo}`
}

/** The most specific thing the URL names: a file, a page, or nothing. */
function documentName(url: URL): string {
  for (const key of NAME_PARAMS) {
    const value = url.searchParams.get(key)?.trim()
    // Already decoded by searchParams — decoding again would eat a literal %20.
    if (value) return value
  }

  const segments = url.pathname.split('/').filter(Boolean).map(decodeSegment)
  for (let index = segments.length - 1; index >= 0; index -= 1) {
    const segment = segments[index]
    if (GENERIC_SEGMENTS.has(segment.toLowerCase())) continue
    // A bare id only means something next to what it's an id of.
    if (/^\d+$/.test(segment) && index > 0) {
      return `${segments[index - 1]}/${segment}`
    }
    return segment
  }

  return ''
}

/**
 * A short, human label for a URL. Never throws and never returns empty: the
 * worst case is the URL itself, which is what we'd have shown anyway.
 */
export function prettyLinkLabel(rawUrl: string): string {
  const url = parseUrl(rawUrl)
  if (!url) return rawUrl

  const host = url.hostname.replace(/^www\./i, '')
  const known = knownServiceLabel(host, url)
  if (known) return truncateMiddle(known, MAX_LABEL_LENGTH)

  const name = documentName(url)
  if (!name) return truncateMiddle(host, MAX_LABEL_LENGTH)

  // The name carries the meaning, so the host gives up its room first.
  const room = MAX_LABEL_LENGTH - host.length - 1
  if (room < MIN_NAME_LENGTH) return truncateMiddle(name, MAX_LABEL_LENGTH)
  return `${host}/${truncateMiddle(name, room)}`
}

/** Whether the whole string is one URL — i.e. a paste worth shortening. */
export function isSingleUrl(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed || /\s/.test(trimmed)) return false
  return /^(https?:\/\/|www\.)\S+$/i.test(trimmed)
}
