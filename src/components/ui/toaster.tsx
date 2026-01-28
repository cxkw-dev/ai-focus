'use client'

import { Undo2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  ToastAction,
} from '@/components/ui/toast'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="flex-1 min-w-0 flex items-center gap-2">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <>
                  <span className="text-muted-foreground/50">·</span>
                  <ToastDescription>{description}</ToastDescription>
                </>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {action}
              <ToastClose />
            </div>
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
