import type React from 'react'
import { ReactRenderer } from '@tiptap/react'
import tippy, { type Instance as TippyInstance } from 'tippy.js'
import type { SuggestionOptions, SuggestionProps } from '@tiptap/suggestion'
import {
  MentionSuggestionList,
  type MentionSuggestionItem,
} from '@/components/ui/mention-suggestion'

type SuggestionConfig = Omit<SuggestionOptions<MentionSuggestionItem>, 'editor'>

export function createMentionSuggestion(
  peopleRef: React.RefObject<MentionSuggestionItem[]>
): SuggestionConfig {
  return {
    items: ({ query }) => {
      const people = peopleRef.current ?? []
      const q = query.toLowerCase()
      return people
        .filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.email.toLowerCase().includes(q)
        )
        .slice(0, 8)
    },

    render: () => {
      let component: ReactRenderer<
        { onKeyDown: (props: { event: KeyboardEvent }) => boolean }
      >
      let popup: TippyInstance[]

      return {
        onStart: (props: SuggestionProps<MentionSuggestionItem>) => {
          component = new ReactRenderer(MentionSuggestionList, {
            props,
            editor: props.editor,
          })

          if (!props.clientRect) return

          popup = tippy('body', {
            getReferenceClientRect: props.clientRect as () => DOMRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'bottom-start',
          })
        },

        onUpdate(props: SuggestionProps<MentionSuggestionItem>) {
          component?.updateProps(props)

          if (!props.clientRect) return

          popup?.[0]?.setProps({
            getReferenceClientRect: props.clientRect as () => DOMRect,
          })
        },

        onKeyDown(props: { event: KeyboardEvent }) {
          if (props.event.key === 'Escape') {
            popup?.[0]?.hide()
            return true
          }

          return component?.ref?.onKeyDown(props) ?? false
        },

        onExit() {
          popup?.[0]?.destroy()
          component?.destroy()
        },
      }
    },
  }
}
