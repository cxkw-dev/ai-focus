import DOMPurify from 'isomorphic-dompurify'

const URL_SPLIT_REGEX = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi

// Protocols that are unsafe to expose via href (XSS vectors).
const UNSAFE_PROTOCOL_REGEX = /^\s*(javascript|data|vbscript|file):/i
const SAFE_PROTOCOL_REGEX = /^(https?:|mailto:|tel:)/i

export function cleanUrlEnd(url: string): [string, string] {
  const trailing = /[.,;:!?)]+$/
  const match = url.match(trailing)
  if (match) {
    return [url.slice(0, -match[0].length), match[0]]
  }
  return [url, '']
}

export function ensureProtocol(url: string): string {
  const trimmed = url.trim()
  // Reject anything that already declares an unsafe scheme.
  if (UNSAFE_PROTOCOL_REGEX.test(trimmed)) return '#'
  // Pass through anything that already declares a safe scheme.
  if (SAFE_PROTOCOL_REGEX.test(trimmed)) return trimmed
  // Reject any other scheme-looking input (e.g. `weird:foo`).
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return '#'
  return `https://${trimmed}`
}

// Allow list mirrors what TipTap (StarterKit + Link + TextStyle + FontSize +
// CustomMention + CodeBlockLowlight) can produce. Everything else is stripped
// by DOMPurify before we hand HTML to dangerouslySetInnerHTML.
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'strike',
    'code',
    'pre',
    'blockquote',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'a',
    'span',
    'div',
  ],
  ALLOWED_ATTR: [
    'href',
    'target',
    'rel',
    'class',
    'style',
    'data-type',
    'data-id',
    'data-email',
    'data-label',
  ],
  ALLOWED_URI_REGEXP:
    /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  ADD_ATTR: ['target'],
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
  FORBID_ATTR: [
    'onerror',
    'onload',
    'onclick',
    'onmouseover',
    'onfocus',
    'srcset',
  ],
}

let purifyHooksInstalled = false
function ensurePurifyHooks(): void {
  if (purifyHooksInstalled) return
  purifyHooksInstalled = true
  // Force every anchor to be safe to open in a new tab.
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      const el = node as Element
      const href = el.getAttribute('href') ?? ''
      if (UNSAFE_PROTOCOL_REGEX.test(href)) {
        el.removeAttribute('href')
      }
      el.setAttribute('target', '_blank')
      el.setAttribute('rel', 'noopener noreferrer')
    }
    // Strip inline styles other than font-size to limit CSS-based attacks.
    if (node.hasAttribute && node.hasAttribute('style')) {
      const style = node.getAttribute('style') ?? ''
      const fontSize = style.match(/font-size\s*:\s*[\d.]+\s*(px|em|rem|%|pt)/i)
      if (fontSize) {
        node.setAttribute('style', fontSize[0])
      } else {
        node.removeAttribute('style')
      }
    }
  })
}

export function sanitizeHtml(html: string): string {
  ensurePurifyHooks()
  return DOMPurify.sanitize(html, SANITIZE_CONFIG) as unknown as string
}

export function isHtmlContent(value: string): boolean {
  return value.trim().startsWith('<')
}

export function linkifyHtml(html: string): string {
  const parts = html.split(/(<a\s[^>]*>[\s\S]*?<\/a>)/gi)
  return parts
    .map((part) => {
      if (/^<a\s/i.test(part)) return part
      return part.replace(/(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi, (match) => {
        const [cleanUrl, trailing] = cleanUrlEnd(match)
        const href = ensureProtocol(cleanUrl)
        return `<a href="${href}" target="_blank" rel="noopener noreferrer">${cleanUrl}</a>${trailing}`
      })
    })
    .join('')
}

export function mentionifyHtml(html: string): string {
  return html.replace(
    /<span[^>]*data-type="mention"[^>]*data-email="([^"]*)"[^>]*>([^<]*)<\/span>/gi,
    (_match, email, label) => {
      const teamsUrl = `https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(email)}`
      return `<a href="${teamsUrl}" target="_blank" rel="noopener noreferrer" class="mention">${label}</a>`
    },
  )
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .trim()
}

export function hasMeaningfulText(value: string): boolean {
  if (!value) return false
  if (isHtmlContent(value)) {
    return htmlToPlainText(value).trim().length > 0
  }
  return value.trim().length > 0
}

export function normalizeSubtaskTitle(value: string): string {
  return value.trim()
}
