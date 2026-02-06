'use client'

import * as React from 'react'
import { useEditor, useEditorState, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Heading2,
  Link as LinkIcon,
  Code,
  Undo,
  Redo,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NotebookNote } from '@/types/notebook'

const lowlight = createLowlight(common)

interface NoteEditorProps {
  note: NotebookNote
  onSaveContent: (id: string, content: string) => void
  onSaveTitle: (id: string, title: string) => void
}

function ToolbarButton({
  onClick,
  isActive,
  disabled,
  children,
  title,
}: {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  children: React.ReactNode
  title: string
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'p-1.5 rounded transition-colors',
        isActive
          ? 'bg-[color-mix(in_srgb,var(--primary)_20%,transparent)] text-[var(--primary)]'
          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[color-mix(in_srgb,var(--text-muted)_10%,transparent)]',
        disabled && 'opacity-30 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  )
}

export function NoteEditor({ note, onSaveContent, onSaveTitle }: NoteEditorProps) {
  const [title, setTitle] = React.useState(note.title)
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const titleTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const latestContentRef = React.useRef(note.content)
  const hasUnsavedChangesRef = React.useRef(false)
  const [saveStatus, setSaveStatus] = React.useState<'saved' | 'saving' | 'unsaved'>('saved')

  // Sync title when note changes
  React.useEffect(() => {
    setTitle(note.title)
  }, [note.id, note.title])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [2, 3] },
      }),
      CodeBlockLowlight.configure({ lowlight }),
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
      hasUnsavedChangesRef.current = true
      setSaveStatus('unsaved')

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => {
        setSaveStatus('saving')
        onSaveContent(note.id, value)
        hasUnsavedChangesRef.current = false
        // Small delay to show "saving" briefly
        setTimeout(() => setSaveStatus('saved'), 300)
      }, 1000)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm prose-invert max-w-none focus:outline-none break-words',
      },
    },
  }, [note.id])

  const editorState = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) return { isBold: false, isItalic: false, isStrike: false, isHeading2: false, isBulletList: false, isOrderedList: false, isLink: false, isCodeBlock: false, canUndo: false, canRedo: false }
      return {
        isBold: e.isActive('bold'),
        isItalic: e.isActive('italic'),
        isStrike: e.isActive('strike'),
        isHeading2: e.isActive('heading', { level: 2 }),
        isBulletList: e.isActive('bulletList'),
        isOrderedList: e.isActive('orderedList'),
        isLink: e.isActive('link'),
        isCodeBlock: e.isActive('codeBlock'),
        canUndo: e.can().undo(),
        canRedo: e.can().redo(),
      }
    },
  })

  // Save on unmount if dirty
  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current)
      if (hasUnsavedChangesRef.current) {
        fetch(`/api/notebook/${note.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: latestContentRef.current }),
          keepalive: true,
        }).catch(err => console.error('Unmount save failed:', err))
      }
    }
  }, [note.id])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current)
    titleTimeoutRef.current = setTimeout(() => {
      onSaveTitle(note.id, newTitle || 'Untitled')
    }, 500)
  }

  const getStatusColor = () => {
    if (saveStatus === 'saving') return 'var(--status-in-progress)'
    if (saveStatus === 'unsaved') return 'var(--status-in-progress)'
    return 'var(--text-muted)'
  }

  const getStatusText = () => {
    if (saveStatus === 'saving') return 'saving...'
    if (saveStatus === 'unsaved') return 'unsaved changes'
    return 'saved'
  }

  if (!editor) return null

  return (
    <div className="flex flex-col h-full">
      {/* Title */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled"
          className="flex-1 bg-transparent text-lg font-semibold outline-none placeholder:opacity-40"
          style={{ color: 'var(--text-primary)' }}
        />
        <span
          className="text-[10px] italic tracking-wide transition-colors duration-300 shrink-0"
          style={{ color: getStatusColor() }}
        >
          {getStatusText()}
        </span>
      </div>

      {/* Toolbar */}
      <div
        className="flex items-center gap-0.5 px-3 py-1.5 border-y flex-wrap"
        style={{ borderColor: 'var(--border-color)', backgroundColor: 'color-mix(in srgb, var(--surface) 50%, transparent)' }}
      >
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editorState?.isBold} title="Bold (Ctrl+B)">
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editorState?.isItalic} title="Italic (Ctrl+I)">
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editorState?.isStrike} title="Strikethrough">
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className="w-px h-4 mx-1" style={{ backgroundColor: 'var(--border-color)' }} />

        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editorState?.isHeading2} title="Heading">
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editorState?.isBulletList} title="Bullet List">
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editorState?.isOrderedList} title="Numbered List">
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className="w-px h-4 mx-1" style={{ backgroundColor: 'var(--border-color)' }} />

        <ToolbarButton
          onClick={() => {
            const previousUrl = editor.getAttributes('link').href as string | undefined
            const url = window.prompt('Enter link URL', previousUrl || '')
            if (url === null) return
            if (url.trim() === '') {
              editor.chain().focus().extendMarkRange('link').unsetLink().run()
              return
            }
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
          }}
          isActive={editorState?.isLink}
          title="Insert Link"
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editorState?.isCodeBlock} title="Code Block">
          <Code className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className="w-px h-4 mx-1" style={{ backgroundColor: 'var(--border-color)' }} />

        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editorState?.canUndo} title="Undo (Ctrl+Z)">
          <Undo className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editorState?.canRedo} title="Redo (Ctrl+Shift+Z)">
          <Redo className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0 flex flex-col">
        <EditorContent editor={editor} className="flex-1 min-h-0 [&>.tiptap]:h-full [&>.tiptap]:overflow-y-auto [&>.tiptap]:px-4 [&>.tiptap]:py-3" />
      </div>
    </div>
  )
}
