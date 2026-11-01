'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { linkifyHtml, mentionifyHtml, sanitizeHtml } from '@/lib/rich-text'
import { renderTextWithLinks } from './linkified-text'

const COLLAPSED_MAX_HEIGHT = 80

interface TodoDescriptionPreviewProps {
  description: string
}

export function TodoDescriptionPreview({
  description,
}: TodoDescriptionPreviewProps) {
  const isHtml = description.startsWith('<')
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = React.useState(false)
  const [overflows, setOverflows] = React.useState(false)

  React.useLayoutEffect(() => {
    const el = contentRef.current
    if (!el) return
    const check = () => {
      setOverflows(el.scrollHeight > COLLAPSED_MAX_HEIGHT + 2)
    }
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [description])

  const collapsed = overflows && !expanded

  return (
    <div>
      <div
        // A collapsed preview fades out through a mask, so it works on any card tone (and its hover).
        className={cn(
          'overflow-hidden',
          collapsed &&
            '[mask-image:linear-gradient(to_bottom,var(--dd-text)_55%,transparent)]',
        )}
        style={{ maxHeight: collapsed ? COLLAPSED_MAX_HEIGHT : undefined }}
      >
        <div ref={contentRef}>
          {isHtml ? (
            <div
              className="rich-text-display break-words"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(linkifyHtml(mentionifyHtml(description))),
              }}
            />
          ) : (
            <p className="text-muted text-xs leading-snug break-words whitespace-pre-wrap">
              {renderTextWithLinks(description)}
            </p>
          )}
        </div>
      </div>
      {overflows && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setExpanded((v) => !v)
          }}
          onPointerDown={(e) => e.stopPropagation()}
          aria-expanded={expanded}
          className="dd-btn dd-btn--link dd-btn--sm text-muted py-0.5"
        >
          <span>{expanded ? 'See less' : 'See more'}</span>
        </button>
      )}
    </div>
  )
}
