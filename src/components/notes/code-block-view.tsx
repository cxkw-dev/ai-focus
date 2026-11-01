'use client'

import * as React from 'react'
import * as Popover from '@radix-ui/react-popover'
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { Icon } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const LANGUAGES = [
  { value: '', label: 'plain text' },
  { value: 'arduino', label: 'arduino' },
  { value: 'bash', label: 'bash' },
  { value: 'c', label: 'c' },
  { value: 'cpp', label: 'c++' },
  { value: 'csharp', label: 'c#' },
  { value: 'css', label: 'css' },
  { value: 'diff', label: 'diff' },
  { value: 'go', label: 'go' },
  { value: 'graphql', label: 'graphql' },
  { value: 'ini', label: 'ini' },
  { value: 'java', label: 'java' },
  { value: 'javascript', label: 'javascript' },
  { value: 'json', label: 'json' },
  { value: 'kotlin', label: 'kotlin' },
  { value: 'less', label: 'less' },
  { value: 'lua', label: 'lua' },
  { value: 'makefile', label: 'makefile' },
  { value: 'markdown', label: 'markdown' },
  { value: 'objectivec', label: 'objective-c' },
  { value: 'perl', label: 'perl' },
  { value: 'php', label: 'php' },
  { value: 'python', label: 'python' },
  { value: 'r', label: 'r' },
  { value: 'ruby', label: 'ruby' },
  { value: 'rust', label: 'rust' },
  { value: 'scss', label: 'scss' },
  { value: 'shell', label: 'shell' },
  { value: 'sql', label: 'sql' },
  { value: 'swift', label: 'swift' },
  { value: 'typescript', label: 'typescript' },
  { value: 'vbnet', label: 'vb.net' },
  { value: 'wasm', label: 'wasm' },
  { value: 'xml', label: 'xml' },
  { value: 'yaml', label: 'yaml' },
]

/**
 * A TipTap code block with its language picker: a quiet mono button in the corner that opens a filterable list
 * (the system's listbox in a Radix popover, so it layers correctly inside dialogs and drawers).
 */
export function CodeBlockView({ node, updateAttributes }: NodeViewProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [activeIndex, setActiveIndex] = React.useState(0)
  // A modal dialog or drawer locks wheel scrolling to its own DOM, so the list portals into the dialog the editor
  // sits in (when it sits in one) rather than onto <body>.
  const [portalContainer, setPortalContainer] =
    React.useState<HTMLElement | null>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLUListElement>(null)
  const listId = React.useId()

  const currentLang = (node.attrs.language as string) || ''
  const currentLabel =
    LANGUAGES.find((l) => l.value === currentLang)?.label ||
    currentLang ||
    'plain text'

  const filtered = search
    ? LANGUAGES.filter((l) => l.label.includes(search.toLowerCase()))
    : LANGUAGES
  const active = filtered[activeIndex]

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setPortalContainer(
        triggerRef.current?.closest<HTMLElement>('[role="dialog"]') ?? null,
      )
    }
    setOpen(next)
    setSearch('')
    setActiveIndex(
      Math.max(
        0,
        LANGUAGES.findIndex((l) => l.value === currentLang),
      ),
    )
  }

  const choose = (value: string) => {
    updateAttributes({ language: value })
    handleOpenChange(false)
  }

  const moveActive = (index: number) => {
    if (filtered.length === 0) return
    const next = (index + filtered.length) % filtered.length
    setActiveIndex(next)
    listRef.current
      ?.querySelector(`[data-index="${next}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      moveActive(activeIndex + 1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      moveActive(activeIndex - 1)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (active) choose(active.value)
    }
  }

  return (
    <NodeViewWrapper className="app-code-block">
      <div className="app-code-block__lang" contentEditable={false}>
        <Popover.Root open={open} onOpenChange={handleOpenChange}>
          <Popover.Trigger asChild>
            <button
              ref={triggerRef}
              type="button"
              aria-label={`Code language: ${currentLabel}`}
              className="dd-btn dd-btn--ghost dd-btn--sm text-quiet hover:text-muted font-mono font-normal"
            >
              {currentLabel}
              <Icon name="chevron-down" />
            </button>
          </Popover.Trigger>
          <Popover.Portal container={portalContainer}>
            <Popover.Content
              align="end"
              sideOffset={4}
              collisionPadding={10}
              onOpenAutoFocus={(event) => {
                event.preventDefault()
                inputRef.current?.focus()
                listRef.current
                  ?.querySelector('.is-active')
                  ?.scrollIntoView({ block: 'nearest' })
              }}
              // Positioned, so its z-index counts: Radix lifts the popper above dialogs and drawers with it.
              className="dd-listbox dd-listbox--static app-code-lang relative z-[70] w-52 pt-1.5"
            >
              <div className="px-1.5 pb-1.5">
                <Input
                  ref={inputRef}
                  size="sm"
                  role="combobox"
                  aria-label="Search languages"
                  aria-expanded="true"
                  aria-controls={listId}
                  aria-autocomplete="list"
                  aria-activedescendant={
                    active ? `${listId}-${activeIndex}` : undefined
                  }
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="Search"
                  leading={<Icon name="search" />}
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value)
                    setActiveIndex(0)
                  }}
                  onKeyDown={handleKeyDown}
                />
              </div>
              <ul
                ref={listRef}
                id={listId}
                role="listbox"
                aria-label="Languages"
                className="max-h-60 overflow-y-auto overscroll-contain"
              >
                {filtered.map((lang, index) => (
                  <li
                    key={lang.value}
                    id={`${listId}-${index}`}
                    data-index={index}
                    role="option"
                    aria-selected={lang.value === currentLang}
                    className={cn(
                      'dd-listbox__option py-1.5 font-mono',
                      index === activeIndex && 'is-active',
                    )}
                    onMouseMove={() => setActiveIndex(index)}
                    onClick={() => choose(lang.value)}
                  >
                    <span className="dd-listbox__text">{lang.label}</span>
                    <span className="dd-listbox__check">
                      <Icon name="check" />
                    </span>
                  </li>
                ))}
                {filtered.length === 0 && (
                  <li className="dd-listbox__empty" role="presentation">
                    No matches
                  </li>
                )}
              </ul>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
      <pre>
        <NodeViewContent as="div" className="app-code-block__content" />
      </pre>
    </NodeViewWrapper>
  )
}
