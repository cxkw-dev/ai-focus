'use client'

import * as React from 'react'
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'

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

export function CodeBlockView({
  node,
  updateAttributes,
  extension,
}: NodeViewProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  const currentLang = (node.attrs.language as string) || ''
  const currentLabel =
    LANGUAGES.find((l) => l.value === currentLang)?.label ||
    currentLang ||
    'plain text'

  const filtered = search
    ? LANGUAGES.filter((l) => l.label.includes(search.toLowerCase()))
    : LANGUAGES

  React.useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [open])

  React.useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <NodeViewWrapper className="code-block-wrapper">
      <div className="code-block-language-selector" ref={dropdownRef}>
        <button
          type="button"
          contentEditable={false}
          className="code-block-lang-button"
          onClick={() => {
            setOpen(!open)
            setSearch('')
          }}
        >
          {currentLabel}
        </button>
        {open && (
          <div className="code-block-lang-dropdown" contentEditable={false}>
            <input
              ref={searchInputRef}
              type="text"
              className="code-block-lang-search"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setOpen(false)
                  setSearch('')
                }
              }}
            />
            <div className="code-block-lang-list">
              {filtered.map((lang) => (
                <button
                  key={lang.value}
                  type="button"
                  className={`code-block-lang-option ${lang.value === currentLang ? 'active' : ''}`}
                  onClick={() => {
                    updateAttributes({ language: lang.value })
                    setOpen(false)
                    setSearch('')
                  }}
                >
                  {lang.label}
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="code-block-lang-empty">No matches</div>
              )}
            </div>
          </div>
        )}
      </div>
      <pre>
        <NodeViewContent as="div" className="code-block-content" />
      </pre>
    </NodeViewWrapper>
  )
}
