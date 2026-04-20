'use client'

import * as React from 'react'
import {
  useEditor,
  useEditorState,
  EditorContent,
  ReactNodeViewRenderer,
} from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import { TextStyle } from '@tiptap/extension-text-style'
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
import { FontSize } from '@/lib/tiptap-font-size'
import { CodeBlockView } from './code-block-view'
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
        'rounded p-1.5 transition-colors',
        isActive
          ? 'bg-[color-mix(in_srgb,var(--primary)_20%,transparent)] text-[var(--primary)]'
          : 'text-[var(--text-muted)] hover:bg-[color-mix(in_srgb,var(--text-muted)_10%,transparent)] hover:text-[var(--text-primary)]',
        disabled && 'cursor-not-allowed opacity-30',
      )}
    >
      {children}
    </button>
  )
}

export function NoteEditor({
  note,
  onSaveContent,
  onSaveTitle,
}: NoteEditorProps) {
  const [title, setTitle] = React.useState(note.title)
  const [prevNoteTitle, setPrevNoteTitle] = React.useState(note.title)
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const titleTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const latestContentRef = React.useRef(note.content)
  const hasUnsavedChangesRef = React.useRef(false)
  const [saveStatus, setSaveStatus] = React.useState<
    'saved' | 'saving' | 'unsaved'
  >('saved')

  // Reset local title when the note prop changes externally (React 19 reset-on-prop pattern)
  if (prevNoteTitle !== note.title) {
    setPrevNoteTitle(note.title)
    setTitle(note.title)
  }

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
          class:
            'prose prose-sm prose-invert max-w-none focus:outline-none break-words',
        },
      },
    },
    [note.id],
  )

  const editorState = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e)
        return {
          isBold: false,
          isItalic: false,
          isStrike: false,
          isHeading2: false,
          isBulletList: false,
          isOrderedList: false,
          isLink: false,
          isCodeBlock: false,
          canUndo: false,
          canRedo: false,
          fontSize: null as string | null,
        }
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
        fontSize: (e.getAttributes('textStyle').fontSize as string) || null,
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
        }).catch((err) => console.error('Unmount save failed:', err))
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
    <div className="flex h-full flex-col">
      {/* Title */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled"
          className="flex-1 bg-transparent text-lg font-semibold uppercase outline-none placeholder:opacity-40"
          style={{ color: 'var(--text-primary)' }}
        />
        <span
          className="shrink-0 text-[10px] tracking-wide italic transition-colors duration-300"
          style={{ color: getStatusColor() }}
        >
          {getStatusText()}
        </span>
      </div>

      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center gap-0.5 border-y px-3 py-1.5"
        style={{
          borderColor: 'var(--border-color)',
          backgroundColor:
            'color-mix(in srgb, var(--surface) 50%, transparent)',
        }}
      >
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editorState?.isBold}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editorState?.isItalic}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editorState?.isStrike}
          title="Strikethrough"
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div
          className="mx-1 h-4 w-px"
          style={{ backgroundColor: 'var(--border-color)' }}
        />

        <select
          title="Font size"
          value={editorState?.fontSize || ''}
          onChange={(e) => {
            const val = e.target.value
            if (val) {
              editor.chain().focus().setFontSize(val).run()
            } else {
              editor.chain().focus().unsetFontSize().run()
            }
          }}
          className="h-7 rounded border px-1 text-xs outline-none"
          style={{
            backgroundColor: 'transparent',
            borderColor: 'var(--border-color)',
            color: 'var(--text-muted)',
          }}
        >
          <option value="">Size</option>
          <option value="12px">Small</option>
          <option value="14px">Normal</option>
          <option value="18px">Large</option>
          <option value="24px">XL</option>
        </select>

        <div
          className="mx-1 h-4 w-px"
          style={{ backgroundColor: 'var(--border-color)' }}
        />

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          isActive={editorState?.isHeading2}
          title="Heading"
        >
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editorState?.isBulletList}
          title="Bullet List"
        >
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editorState?.isOrderedList}
          title="Numbered List"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div
          className="mx-1 h-4 w-px"
          style={{ backgroundColor: 'var(--border-color)' }}
        />

        <ToolbarButton
          onClick={() => {
            const previousUrl = editor.getAttributes('link').href as
              | string
              | undefined
            const url = window.prompt('Enter link URL', previousUrl || '')
            if (url === null) return
            if (url.trim() === '') {
              editor.chain().focus().extendMarkRange('link').unsetLink().run()
              return
            }
            editor
              .chain()
              .focus()
              .extendMarkRange('link')
              .setLink({ href: url })
              .run()
          }}
          isActive={editorState?.isLink}
          title="Insert Link"
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editorState?.isCodeBlock}
          title="Code Block"
        >
          <Code className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div
          className="mx-1 h-4 w-px"
          style={{ backgroundColor: 'var(--border-color)' }}
        />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editorState?.canUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editorState?.canRedo}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      {/* Editor */}
      <div className="flex min-h-0 flex-1 flex-col">
        <EditorContent
          editor={editor}
          className="min-h-0 flex-1 [&>.tiptap]:h-full [&>.tiptap]:overflow-y-auto [&>.tiptap]:px-4 [&>.tiptap]:py-3"
        />
      </div>
    </div>
  )
}
