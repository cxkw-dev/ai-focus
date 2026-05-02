import * as React from 'react'
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
          <a
            href={ensureProtocol(cleanUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary break-all hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {cleanUrl}
          </a>
          {trailing}
        </React.Fragment>
      )
    }
    return part
  })
}
