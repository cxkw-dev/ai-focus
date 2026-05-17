'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { linkifyHtml, mentionifyHtml } from '@/lib/rich-text'
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
    <div className="mt-1.5">
      <div
        className="relative overflow-hidden"
        style={{
          maxHeight: collapsed ? COLLAPSED_MAX_HEIGHT : undefined,
        }}
      >
        <div ref={contentRef}>
          {isHtml ? (
            <div
              className="rich-text-display leading-snug break-words"
              dangerouslySetInnerHTML={{
                __html: linkifyHtml(mentionifyHtml(description)),
              }}
            />
          ) : (
            <p
              className="text-[11px] leading-snug break-words whitespace-pre-wrap"
              style={{ color: 'var(--text-muted)' }}
            >
              {renderTextWithLinks(description)}
            </p>
          )}
        </div>
        {collapsed && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-8"
            style={{
              background:
                'linear-gradient(to bottom, transparent, color-mix(in srgb, var(--background) 50%, transparent))',
            }}
          />
        )}
      </div>
      {overflows && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setExpanded((v) => !v)
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className={cn(
            'mt-1 text-[11px] font-medium transition-colors hover:underline',
          )}
          style={{ color: 'var(--primary)' }}
        >
          {expanded ? 'See less' : 'See more'}
        </button>
      )}
    </div>
  )
}
