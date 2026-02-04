'use client'

import * as React from 'react'
import { useEditor, useEditorState, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Heading2,
  Link as LinkIcon,
  Undo,
  Redo,
  RemoveFormatting,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  compact?: boolean
  fullHeight?: boolean
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
        'p-1 rounded transition-colors',
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

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Add more details...',
  disabled = false,
  compact = false,
  fullHeight = false,
}: RichTextEditorProps) {
  const isInternalUpdate = React.useRef(false)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
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
        placeholder,
      }),
    ],
    content: value || '',
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      isInternalUpdate.current = true
      onChange(html === '<p></p>' ? '' : html)
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm prose-invert max-w-none focus:outline-none break-words',
          compact ? 'min-h-[60px] max-h-[120px]' : 'min-h-[100px] max-h-[250px]',
          fullHeight && 'min-h-full max-h-none h-full',
          'overflow-y-auto px-3 py-2'
        ),
      },
    },
  })

  const editorState = useEditorState({
    editor,
    selector: ({ editor: editorInstance }) => {
      if (!editorInstance) {
        return {
          isBold: false,
          isItalic: false,
          isStrike: false,
          isHeading2: false,
          isBulletList: false,
          isOrderedList: false,
          isLink: false,
          canUndo: false,
          canRedo: false,
          isFocused: false,
        }
      }

        return {
          isBold: editorInstance.isActive('bold'),
          isItalic: editorInstance.isActive('italic'),
          isStrike: editorInstance.isActive('strike'),
          isHeading2: editorInstance.isActive('heading', { level: 2 }),
          isBulletList: editorInstance.isActive('bulletList'),
          isOrderedList: editorInstance.isActive('orderedList'),
          isLink: editorInstance.isActive('link'),
          canUndo: editorInstance.can().undo(),
          canRedo: editorInstance.can().redo(),
          isFocused: editorInstance.isFocused,
        }
    },
  })

  // Only sync when value changes externally (e.g. form reset, loading a todo)
  React.useEffect(() => {
    if (!editor) return
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false
      return
    }
    editor.commands.setContent(value || '', { emitUpdate: false })
  }, [value, editor])

  React.useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled)
    }
  }, [disabled, editor])

  if (!editor) return null

  return (
    <div
      className={cn(
        'rounded-md border overflow-hidden transition-colors duration-150',
        fullHeight && 'flex h-full w-full flex-col',
      )}
      style={{
        backgroundColor: 'var(--background)',
        borderColor: editorState?.isFocused ? 'var(--primary)' : 'var(--border-color)',
        boxShadow: editorState?.isFocused ? '0 0 0 1px var(--primary)' : 'none',
      }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center gap-0.5 px-2 py-1 border-b flex-wrap transition-colors duration-150"
        style={{ borderColor: editorState?.isFocused ? 'color-mix(in srgb, var(--primary) 40%, transparent)' : 'var(--border-color)', backgroundColor: 'color-mix(in srgb, var(--surface) 50%, transparent)' }}
      >
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editorState?.isBold}
          disabled={disabled}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editorState?.isItalic}
          disabled={disabled}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editorState?.isStrike}
          disabled={disabled}
          title="Strikethrough"
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className="w-px h-4 mx-1" style={{ backgroundColor: 'var(--border-color)' }} />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editorState?.isHeading2}
          disabled={disabled}
          title="Heading"
        >
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editorState?.isBulletList}
          disabled={disabled}
          title="Bullet List"
        >
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editorState?.isOrderedList}
          disabled={disabled}
          title="Numbered List"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>

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
          disabled={disabled}
          title="Insert Link"
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className="w-px h-4 mx-1" style={{ backgroundColor: 'var(--border-color)' }} />

        <ToolbarButton
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          disabled={disabled}
          title="Clear Formatting"
        >
          <RemoveFormatting className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={disabled || !editorState?.canUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={disabled || !editorState?.canRedo}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} className={cn(fullHeight && 'flex-1')} />
    </div>
  )
}
