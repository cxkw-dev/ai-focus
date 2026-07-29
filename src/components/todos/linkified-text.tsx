import * as React from 'react'
import { prettyLinkLabel } from '@/lib/link-label'
import { cleanUrlEnd, ensureProtocol } from '@/lib/rich-text'

const URL_SPLIT_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi
const URL_MATCH_REGEX = /^(https?:\/\/[^\s]+|www\.[^\s]+)$/i

export function renderTextWithLinks(text: string) {
  const parts = text.split(URL_SPLIT_REGEX)

  return parts.map((part, index) => {
    if (URL_MATCH_REGEX.test(part)) {
      const [cleanUrl, trailing] = cleanUrlEnd(part)
      return (
        <React.Fragment key={index}>
          {/* The full URL stays in the href and the tooltip — only the text
              shortens, so nothing is lost by making it readable. */}
          <a
            href={ensureProtocol(cleanUrl)}
            target="_blank"
            rel="noopener noreferrer"
            title={cleanUrl}
            className="link-chip"
            onClick={(e) => e.stopPropagation()}
          >
            {prettyLinkLabel(cleanUrl)}
          </a>
          {trailing}
        </React.Fragment>
      )
    }
    return part
  })
}
