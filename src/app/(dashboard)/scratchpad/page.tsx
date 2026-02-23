'use client'

import { ScratchPad } from '@/components/todos/scratch-pad'

export default function ScratchPadPage() {
  return (
    <div className="h-[calc(100vh-120px)]">
      <ScratchPad className="h-full" />
    </div>
  )
}
