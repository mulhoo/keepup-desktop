import { useState, useEffect } from 'react'
import * as RadixToast from '@radix-ui/react-toast'
import { CheckCircle2, XCircle, X } from 'lucide-react'
import { subscribeToast, type ToastItem } from '@/lib/toast'
import { cn } from '@/lib/utils'

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => subscribeToast(item => setToasts(prev => [...prev, item])), [])

  function dismiss(id: string) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <RadixToast.Provider swipeDirection="right" duration={4000}>
      {toasts.map(t => (
        <RadixToast.Root
          key={t.id}
          open
          onOpenChange={open => { if (!open) dismiss(t.id) }}
          className={cn(
            'flex items-start gap-3 w-80 p-4 rounded-xl border shadow-lg',
            'bg-background text-foreground',
            t.variant === 'success'
              ? 'border-green-500/30 bg-green-50 dark:bg-green-950/40'
              : 'border-destructive/30 bg-red-50 dark:bg-red-950/40',
          )}
        >
          <div className="flex-none mt-0.5">
            {t.variant === 'success'
              ? <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
              : <XCircle     className="w-4 h-4 text-destructive" />}
          </div>
          <RadixToast.Description className="flex-1 text-sm leading-snug">
            {t.message}
          </RadixToast.Description>
          <RadixToast.Close asChild>
            <button className="flex-none text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </RadixToast.Close>
        </RadixToast.Root>
      ))}
      <RadixToast.Viewport className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 outline-none" />
    </RadixToast.Provider>
  )
}
