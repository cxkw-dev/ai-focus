import Mention from '@tiptap/extension-mention'

export const CustomMention = Mention.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      email: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-email'),
        renderHTML: (attributes: Record<string, string>) => {
          if (!attributes.email) return {}
          return { 'data-email': attributes.email }
        },
      },
    }
  },
})
