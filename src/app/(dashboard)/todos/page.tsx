'use client'

import { ScratchPad } from '@/components/todos/scratch-pad'

/**
 * Landing page: nothing but the scratch pad for quick, unstructured notes.
 * Browsing, creating, and managing todos all live on project boards
 * (/projects/<id>) — this page intentionally shows nothing else.
 */
export default function TodosPage() {
  return (
    <div className="flex h-[calc(100vh-120px)] flex-col">
      <ScratchPad className="h-full" />
    </div>
  )
}
