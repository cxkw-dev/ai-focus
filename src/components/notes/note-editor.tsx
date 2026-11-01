'use client'

import * as React from 'react'
import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import { TextStyle } from '@tiptap/extension-text-style'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { FontSize } from '@/lib/tiptap-font-size'
import { RichTextToolbar } from '@/components/ui/rich-text-editor'
import { CodeBlockView } from './code-block-view'
import { cn } from '@/lib/utils'
import type { NotebookNote } from '@/types/notebook'

const lowlight = createLowlight(common)

interface NoteEditorProps {
  note: NotebookNote
  onSaveContent: (id: string, content: string) => void
  onSaveTitle: (id: string, title: string) => void
}

export function NoteEditor({
  note,
  onSaveContent,
  onSaveTitle,
}: NoteEditorProps) {
  // The parent keys this component by note.id, so a different note remounts the
  // editor and these refs/state initialise fresh from the new prop. Within a
  // single note's lifetime, local state is the source of truth — never reset
  // from the prop, or echoed server responses (and SSE refetches) will clobber
  // characters the user has typed since the last debounced save.
  const [title, setTitle] = React.useState(note.title)
  const [saveStatus, setSaveStatus] = React.useState<
    'saved' | 'saving' | 'unsaved'
  >('saved')
  const contentTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const titleTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const savedFlashTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const latestContentRef = React.useRef(note.content)
  const latestTitleRef = React.useRef(note.title)
  const lastSavedTitleRef = React.useRef(note.title)
  const lastSavedContentRef = React.useRef(note.content)
  const hasUnsavedTitleRef = React.useRef(false)
  const hasUnsavedContentRef = React.useRef(false)

  const flashSaved = React.useCallback(() => {
    if (savedFlashTimeoutRef.current) clearTimeout(savedFlashTimeoutRef.current)
    savedFlashTimeoutRef.current = setTimeout(() => {
      if (!hasUnsavedTitleRef.current && !hasUnsavedContentRef.current) {
        setSaveStatus('saved')
      }
    }, 300)
  }, [])

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          codeBlock: false,
          heading: { levels: [2, 3] },
        }),
        CodeBlockLowlight.configure({ lowlight }).extend({
          addNodeView() {
            return ReactNodeViewRenderer(CodeBlockView)
          },
        }),
        TextStyle,
        FontSize,
        Link.configure({
          openOnClick: true,
          autolink: true,
          linkOnPaste: true,
          HTMLAttributes: {
            rel: 'noopener noreferrer',
            target: '_blank',
          },
        }),
        Placeholder.configure({
          placeholder: 'Start writing...',
        }),
      ],
      content: note.content || '',
      onUpdate: ({ editor: ed }) => {
        const html = ed.getHTML()
        const value = html === '<p></p>' ? '' : html
        latestContentRef.current = value
        if (value === lastSavedContentRef.current) return
        hasUnsavedContentRef.current = true
        setSaveStatus('unsaved')

        if (contentTimeoutRef.current) clearTimeout(contentTimeoutRef.current)
        contentTimeoutRef.current = setTimeout(() => {
          if (latestContentRef.current === lastSavedContentRef.current) {
            hasUnsavedContentRef.current = false
            return
          }
          setSaveStatus('saving')
          const snapshot = latestContentRef.current
          onSaveContent(note.id, snapshot)
          lastSavedContentRef.current = snapshot
          hasUnsavedContentRef.current = false
          flashSaved()
        }, 600)
      },
      editorProps: {
        attributes: {
          class: 'break-words',
        },
      },
    },
    [note.id],
  )

  // Flush any pending writes when switching notes / unmounting.
  React.useEffect(() => {
    return () => {
      if (contentTimeoutRef.current) clearTimeout(contentTimeoutRef.current)
      if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current)
      if (savedFlashTimeoutRef.current)
        clearTimeout(savedFlashTimeoutRef.current)

      const pendingBody: Record<string, string> = {}
      if (hasUnsavedTitleRef.current) {
        pendingBody.title = latestTitleRef.current.trim() || 'Untitled'
      }
      if (hasUnsavedContentRef.current) {
        pendingBody.content = latestContentRef.current
      }
      if (Object.keys(pendingBody).length > 0) {
        fetch(`/api/notebook/${note.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pendingBody),
          keepalive: true,
        }).catch((err) => console.error('Unmount save failed:', err))
      }
    }
  }, [note.id])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    latestTitleRef.current = newTitle

    const normalized = newTitle.trim() || 'Untitled'
    if (normalized === lastSavedTitleRef.current) {
      // Reverted to last-saved value — drop any pending save.
      if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current)
      hasUnsavedTitleRef.current = false
      if (!hasUnsavedContentRef.current) setSaveStatus('saved')
      return
    }

    hasUnsavedTitleRef.current = true
    setSaveStatus('unsaved')

    if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current)
    titleTimeoutRef.current = setTimeout(() => {
      const toSave = latestTitleRef.current.trim() || 'Untitled'
      if (toSave === lastSavedTitleRef.current) {
        hasUnsavedTitleRef.current = false
        return
      }
      setSaveStatus('saving')
      onSaveTitle(note.id, toSave)
      lastSavedTitleRef.current = toSave
      hasUnsavedTitleRef.current = false
      flashSaved()
    }, 500)
  }

  const statusLabel =
    saveStatus === 'saving'
      ? 'Saving…'
      : saveStatus === 'unsaved'
        ? 'Unsaved changes'
        : 'Saved'

  if (!editor) return null

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 px-5 pt-4 pb-2">
        {/* The note's title is the page's lockup heading, but it's typed text, so it keeps the case you type. */}
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled"
          aria-label="Note title"
          spellCheck={false}
          autoComplete="off"
          className="dd-h3 text-text placeholder:text-quiet min-w-0 flex-1 bg-transparent text-lg leading-tight normal-case outline-none sm:text-xl"
        />
        <span
          aria-live="polite"
          className={cn(
            'dd-status-dot dd-status-dot--sm dd-status-dot--muted shrink-0 text-xs whitespace-nowrap',
            saveStatus === 'saved'
              ? 'dd-status-dot--offline'
              : 'dd-status-dot--info',
          )}
        >
          {statusLabel}
        </span>
      </div>

      <RichTextToolbar editor={editor} className="px-3.5" />

      <EditorContent
        editor={editor}
        className="min-h-0 flex-1 [&>.tiptap]:h-full [&>.tiptap]:overflow-y-auto [&>.tiptap]:px-5 [&>.tiptap]:py-4"
      />
    </div>
  )
}
