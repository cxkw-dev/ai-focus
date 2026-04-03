const URL_SPLIT_REGEX = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi

export function cleanUrlEnd(url: string): [string, string] {
  const trailing = /[.,;:!?)]+$/
  const match = url.match(trailing)
  if (match) {
    return [url.slice(0, -match[0].length), match[0]]
  }
  return [url, '']
}

export function ensureProtocol(url: string): string {
  return url.startsWith('http') ? url : `https://${url}`
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
