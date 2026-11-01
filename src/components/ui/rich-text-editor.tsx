'use client'

import * as React from 'react'
import {
  useEditor,
  useEditorState,
  EditorContent,
  ReactNodeViewRenderer,
  type Editor,
} from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import { TextStyle } from '@tiptap/extension-text-style'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { common, createLowlight } from 'lowlight'
import { handleLinkPaste } from '@/lib/tiptap-link-paste'
import { FontSize } from '@/lib/tiptap-font-size'
import { CodeBlockView } from '@/components/notes/code-block-view'
import { Icon } from '@/components/ui/icon'
import { Select } from '@/components/ui/select'
import { Tip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { CustomMention } from '@/lib/tiptap-mention'
import { createMentionSuggestion } from '@/lib/mention-suggestion'
import type { MentionSuggestionItem } from '@/components/ui/mention-suggestion'

const lowlight = createLowlight(common)

const FONT_SIZES = [
  { value: '', label: 'Size' },
  { value: '12px', label: 'Small' },
  { value: '14px', label: 'Normal' },
  { value: '18px', label: 'Large' },
  { value: '24px', label: 'XL' },
]

interface ToolbarButtonProps {
  label: string
  shortcut?: string
  /** Toggle state; leave undefined for plain actions (undo, clear formatting). */
  pressed?: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}

function ToolbarButton({
  label,
  shortcut,
  pressed,
  disabled,
  onClick,
  children,
}: ToolbarButtonProps) {
  return (
    <Tip label={shortcut ? `${label} · ${shortcut}` : label}>
      <button
        type="button"
        aria-label={label}
        aria-pressed={pressed}
        disabled={disabled}
        // Keep the editor's selection: the click must not move focus out of the document.
        onMouseDown={(event) => event.preventDefault()}
        onClick={onClick}
        className={cn(
          // Sized up from the small button's caption type so marks and icons read at a glance.
          'dd-btn dd-btn--ghost dd-btn--sm dd-btn--icon min-w-6.5 text-sm',
          pressed === undefined && 'text-muted hover:text-text',
        )}
      >
        {children}
      </button>
    </Tip>
  )
}

/** A formatting mark with no icon in the set (B, I, H2…), set as type in the button. */
function Glyph({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <span aria-hidden="true" className={cn('leading-none', className)}>
      {children}
    </span>
  )
}

function ToolbarDivider() {
  return (
    <hr
      aria-orientation="vertical"
      className="dd-divider dd-divider--vertical mx-1 my-1.5"
    />
  )
}

interface RichTextToolbarProps {
  editor: Editor
  disabled?: boolean
  /** Show the checklist button (the editor must load TaskList/TaskItem). */
  checklist?: boolean
  /** Show the clear-formatting button. */
  clearFormatting?: boolean
  className?: string
}

/**
 * The editor's formatting row: ghost icon buttons in groups (toggles carry aria-pressed), hairlines between the
 * groups, and a small native select for the font size. Shared by RichTextEditor and the notebook's NoteEditor.
 */
export function RichTextToolbar({
  editor,
  disabled = false,
  checklist = false,
  clearFormatting = false,
  className,
}: RichTextToolbarProps) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      isBold: e.isActive('bold'),
      isItalic: e.isActive('italic'),
      isStrike: e.isActive('strike'),
      isHeading2: e.isActive('heading', { level: 2 }),
      isBulletList: e.isActive('bulletList'),
      isOrderedList: e.isActive('orderedList'),
      isTaskList: e.isActive('taskList'),
      isLink: e.isActive('link'),
      isCodeBlock: e.isActive('codeBlock'),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
      fontSize: (e.getAttributes('textStyle').fontSize as string) || '',
    }),
  })

  const editLink = () => {
    const previousUrl = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Enter link URL', previousUrl || '')
    if (url === null) return
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div
      className={cn(
        'app-rte__toolbar flex flex-wrap items-center gap-y-1 px-1.5 py-1',
        className,
      )}
    >
      <div className="dd-btn-group" role="group" aria-label="Text style">
        <ToolbarButton
          label="Bold"
          shortcut="Ctrl+B"
          pressed={state.isBold}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Glyph className="font-bold">B</Glyph>
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          shortcut="Ctrl+I"
          pressed={state.isItalic}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Glyph className="font-semibold italic">I</Glyph>
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          pressed={state.isStrike}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Glyph className="font-semibold line-through">S</Glyph>
        </ToolbarButton>
      </div>

      <ToolbarDivider />

      <Select
        size="sm"
        aria-label="Font size"
        title="Font size"
        value={state.fontSize}
        disabled={disabled}
        options={FONT_SIZES}
        onChange={(event) => {
          const value = event.target.value
          if (value) {
            editor.chain().focus().setFontSize(value).run()
          } else {
            editor.chain().focus().unsetFontSize().run()
          }
        }}
        boxClassName="w-auto bg-transparent hover:bg-wash-strong"
      />

      <ToolbarDivider />

      <div className="dd-btn-group" role="group" aria-label="Blocks">
        <ToolbarButton
          label="Heading"
          pressed={state.isHeading2}
          disabled={disabled}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Glyph className="font-display font-extrabold">H2</Glyph>
        </ToolbarButton>
        <ToolbarButton
          label="Bullet list"
          pressed={state.isBulletList}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <Icon name="list" />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          pressed={state.isOrderedList}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <Glyph className="font-mono">1.</Glyph>
        </ToolbarButton>
        {checklist && (
          <ToolbarButton
            label="Checklist"
            pressed={state.isTaskList}
            disabled={disabled}
            onClick={() => editor.chain().focus().toggleTaskList().run()}
          >
            <Glyph className="font-mono">[x]</Glyph>
          </ToolbarButton>
        )}
      </div>

      <ToolbarDivider />

      <div className="dd-btn-group" role="group" aria-label="Insert">
        <ToolbarButton
          label="Link"
          pressed={state.isLink}
          disabled={disabled}
          onClick={editLink}
        >
          <Icon name="link" />
        </ToolbarButton>
        <ToolbarButton
          label="Code block"
          pressed={state.isCodeBlock}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Icon name="code" />
        </ToolbarButton>
      </div>

      <ToolbarDivider />

      <div className="dd-btn-group" role="group" aria-label="History">
        {clearFormatting && (
          <ToolbarButton
            label="Clear formatting"
            disabled={disabled}
            onClick={() =>
              editor.chain().focus().unsetAllMarks().clearNodes().run()
            }
          >
            <Glyph className="font-semibold">
              T<span className="align-sub text-xs">x</span>
            </Glyph>
          </ToolbarButton>
        )}
        <ToolbarButton
          label="Undo"
          shortcut="Ctrl+Z"
          disabled={disabled || !state.canUndo}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Icon name="arrow-left" />
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          shortcut="Ctrl+Shift+Z"
          disabled={disabled || !state.canRedo}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Icon name="arrow-right" />
        </ToolbarButton>
      </div>
    </div>
  )
}

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  compact?: boolean
  /** Fill the parent and drop the field box: for document surfaces (scratch pad, note drawer). */
  fullHeight?: boolean
  mentions?: MentionSuggestionItem[]
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

  // The suggestion config captures `peopleRef` and reads `.current` inside tiptap
  // event callbacks (not during render). Memoize once per mount so tiptap doesn't
  // re-register the suggestion plugin; the ref pointer stays stable.
  const hasMentions = Boolean(mentions)
  const mentionSuggestion = React.useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs -- peopleRef is captured for later read by tiptap, not read here
      hasMentions ? createMentionSuggestion(peopleRef) : null,
    [hasMentions],
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
      TaskList,
      TaskItem.configure({
        nested: true,
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
          'overflow-y-auto px-3 py-2 break-words',
          compact ? 'min-h-12 max-h-24' : 'min-h-20 max-h-50',
          fullHeight && 'h-full max-h-none min-h-full',
        ),
      },
      handlePaste: handleLinkPaste,
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
        fullHeight
          ? 'flex h-full min-h-0 w-full flex-col'
          : // The tonal field box, so the editor reads like the inputs around it (hover, focus, disabled).
            'dd-input flex-col gap-0 p-0',
        disabled && !fullHeight && 'is-disabled',
      )}
    >
      <RichTextToolbar
        editor={editor}
        disabled={disabled}
        checklist
        clearFormatting
      />
      <EditorContent
        editor={editor}
        className={cn(fullHeight && 'min-h-0 flex-1 overflow-y-auto')}
      />
    </div>
  )
}
