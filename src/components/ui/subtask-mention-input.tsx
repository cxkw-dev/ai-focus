'use client'

import * as React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import { cn } from '@/lib/utils'
import { CustomMention } from '@/lib/tiptap-mention'
import { createMentionSuggestion } from '@/lib/mention-suggestion'
import type { MentionSuggestionItem } from '@/components/ui/mention-suggestion'

interface SubtaskMentionInputProps {
  value: string
  onChange: (value: string) => void
  onCommit?: () => void
  commitOnBlur?: boolean
  onFocusChange?: (focused: boolean) => void
  placeholder?: string
  disabled?: boolean
  mentions?: MentionSuggestionItem[]
  completed?: boolean
  className?: string
  ariaLabel?: string
}

export function SubtaskMentionInput({
  value,
  onChange,
  onCommit,
  commitOnBlur = true,
  onFocusChange,
  placeholder = 'Add a subtask...',
  disabled = false,
  mentions,
  completed = false,
  className,
  ariaLabel,
}: SubtaskMentionInputProps) {
  const isInternalUpdate = React.useRef(false)
  const suppressBlurCommit = React.useRef(false)
  const onCommitRef = React.useRef(onCommit)
  const onFocusChangeRef = React.useRef(onFocusChange)
  const peopleRef = React.useRef<MentionSuggestionItem[]>(mentions ?? [])
  const mentionActiveRef = React.useRef(false)

  React.useEffect(() => {
    onCommitRef.current = onCommit
  }, [onCommit])

  React.useEffect(() => {
    onFocusChangeRef.current = onFocusChange
  }, [onFocusChange])

  React.useEffect(() => {
    peopleRef.current = mentions ?? []
  }, [mentions])

  const mentionSuggestion = React.useMemo(
    () => (mentions ? createMentionSuggestion(peopleRef, mentionActiveRef) : null),
    // Only compute once based on whether mentions is provided
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [!!mentions]
  )

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        code: false,
        codeBlock: false,
        bulletList: false,
        orderedList: false,
        horizontalRule: false,
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
    onUpdate: ({ editor: editorInstance }) => {
      const html = editorInstance.getHTML()
      isInternalUpdate.current = true
      onChange(html === '<p></p>' ? '' : html)
    },
    onBlur: () => {
      onFocusChangeRef.current?.(false)
      if (commitOnBlur) {
        if (suppressBlurCommit.current) {
          suppressBlurCommit.current = false
          return
        }
        // Don't commit if a mention was just selected (popup closing causes blur)
        if (mentionActiveRef.current) return
        onCommitRef.current?.()
      }
    },
    onFocus: () => {
      onFocusChangeRef.current?.(true)
    },
    editorProps: {
      attributes: {
        class: cn(
          'subtask-mention-editor w-full bg-transparent px-0 py-0 focus:outline-none',
          '[&>p]:my-0 [&>*+*]:mt-0',
          completed && 'line-through',
          className
        ),
        ...(ariaLabel ? { 'aria-label': ariaLabel } : {}),
      },
      handleKeyDown: (_view, event) => {
        // Let the mention suggestion dropdown handle keys when it's active
        if (mentionActiveRef.current) {
          return false
        }
        if (event.key === 'Enter') {
          event.preventDefault()
          onCommitRef.current?.()
          if (commitOnBlur) {
            suppressBlurCommit.current = true
            _view.dom.blur()
          }
          return true
        }
        return false
      },
    },
  })

  React.useEffect(() => {
    if (!editor) return
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false
      return
    }
    editor.commands.setContent(value || '', { emitUpdate: false })
  }, [editor, value])

  React.useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled)
    }
  }, [disabled, editor])

  if (!editor) return null

  return <EditorContent editor={editor} className="flex-1 min-w-0" />
}
