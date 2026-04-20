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
  RemoveFormatting,
} from 'lucide-react'
import { FontSize } from '@/lib/tiptap-font-size'
import { CodeBlockView } from '@/components/notes/code-block-view'
import { cn } from '@/lib/utils'
import { CustomMention } from '@/lib/tiptap-mention'
import { createMentionSuggestion } from '@/lib/mention-suggestion'
import type { MentionSuggestionItem } from '@/components/ui/mention-suggestion'

const lowlight = createLowlight(common)

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  compact?: boolean
  fullHeight?: boolean
  mentions?: MentionSuggestionItem[]
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
        'rounded p-1 transition-colors',
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

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Add more details...',
  disabled = false,
  compact = false,
  fullHeight = false,
  mentions,
}: RichTextEditorProps) {
  const isInternalUpdate = React.useRef(false)
  const peopleRef = React.useRef<MentionSuggestionItem[]>(mentions ?? [])

  React.useEffect(() => {
    peopleRef.current = mentions ?? []
  }, [mentions])

  const mentionSuggestion = React.useMemo(
    () => (mentions ? createMentionSuggestion(peopleRef) : null),
    // Only compute once based on whether mentions is provided
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [!!mentions],
  )

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: {
          levels: [2, 3],
        },
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
        placeholder,
      }),
      ...(mentionSuggestion
        ? [
            CustomMention.configure({
              HTMLAttributes: {
                class: 'mention',
              },
              suggestion: mentionSuggestion,
            }),
          ]
        : []),
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
          compact
            ? 'min-h-[60px] max-h-[120px]'
            : 'min-h-[100px] max-h-[250px]',
          fullHeight && 'min-h-full max-h-none h-full',
          'overflow-y-auto px-3 py-2',
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
          isCodeBlock: false,
          canUndo: false,
          canRedo: false,
          isFocused: false,
          fontSize: null as string | null,
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
        isCodeBlock: editorInstance.isActive('codeBlock'),
        canUndo: editorInstance.can().undo(),
        canRedo: editorInstance.can().redo(),
        isFocused: editorInstance.isFocused,
        fontSize:
          (editorInstance.getAttributes('textStyle').fontSize as string) ||
          null,
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
        'overflow-hidden rounded-md border transition-colors duration-150',
        fullHeight && 'flex h-full w-full flex-col',
      )}
      style={{
        backgroundColor: 'var(--background)',
        borderColor: editorState?.isFocused
          ? 'var(--primary)'
          : 'var(--border-color)',
        boxShadow: editorState?.isFocused ? '0 0 0 1px var(--primary)' : 'none',
      }}
    >
      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center gap-0.5 border-b px-2 py-1 transition-colors duration-150"
        style={{
          borderColor: editorState?.isFocused
            ? 'color-mix(in srgb, var(--primary) 40%, transparent)'
            : 'var(--border-color)',
          backgroundColor:
            'color-mix(in srgb, var(--surface) 50%, transparent)',
        }}
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
          className="h-6 rounded border px-1 text-[10px] outline-none"
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
          disabled={disabled}
          title="Insert Link"
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editorState?.isCodeBlock}
          disabled={disabled}
          title="Code Block"
        >
          <Code className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div
          className="mx-1 h-4 w-px"
          style={{ backgroundColor: 'var(--border-color)' }}
        />

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().unsetAllMarks().clearNodes().run()
          }
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
      <EditorContent
        editor={editor}
        className={cn(fullHeight && 'min-h-0 flex-1 overflow-y-auto')}
      />
    </div>
  )
}
