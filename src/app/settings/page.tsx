'use client'

import * as React from 'react'
import { Tags } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { LabelManager } from '@/components/settings/label-manager'
import { useToast } from '@/components/ui/use-toast'
import type { Label } from '@/types/todo'

export default function SettingsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: labels = [], isLoading } = useQuery({
    queryKey: ['labels'],
    queryFn: async () => {
      const res = await fetch('/api/labels')
      if (!res.ok) throw new Error('Failed to fetch labels')
      return res.json() as Promise<Label[]>
    },
  })

  const createLabel = useMutation({
    mutationFn: async (data: Pick<Label, 'name' | 'color'>) => {
      const res = await fetch('/api/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create label')
      return res.json() as Promise<Label>
    },
    onSuccess: (newLabel) => {
      queryClient.setQueryData<Label[]>(['labels'], (prev = []) =>
        [...prev, newLabel].sort((a, b) => a.name.localeCompare(b.name))
      )
      toast({ title: 'Label created', description: newLabel.name })
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create label.', variant: 'destructive' })
    },
  })

  const updateLabel = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Pick<Label, 'name' | 'color'>> }) => {
      const res = await fetch(`/api/labels/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update label')
      return res.json() as Promise<Label>
    },
    onSuccess: (updatedLabel) => {
      queryClient.setQueryData<Label[]>(['labels'], (prev = []) =>
        prev
          .map((l) => (l.id === updatedLabel.id ? updatedLabel : l))
          .sort((a, b) => a.name.localeCompare(b.name))
      )
      toast({ title: 'Label updated', description: updatedLabel.name })
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update label.', variant: 'destructive' })
    },
  })

  const deleteLabel = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/labels/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete label')
      return id
    },
    onSuccess: (id) => {
      queryClient.setQueryData<Label[]>(['labels'], (prev = []) =>
        prev.filter((l) => l.id !== id)
      )
      toast({ title: 'Label deleted' })
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete label.', variant: 'destructive' })
    },
  })

  const handleCreateLabel = async (data: Pick<Label, 'name' | 'color'>) => {
    try {
      await createLabel.mutateAsync(data)
      return true
    } catch {
      return false
    }
  }

  const handleUpdateLabel = async (id: string, data: Partial<Pick<Label, 'name' | 'color'>>) => {
    try {
      await updateLabel.mutateAsync({ id, data })
      return true
    } catch {
      return false
    }
  }

  const handleDeleteLabel = async (id: string) => {
    try {
      await deleteLabel.mutateAsync(id)
      return true
    } catch {
      return false
    }
  }

  const isMutating = createLabel.isPending || updateLabel.isPending || deleteLabel.isPending

  return (
    <DashboardLayout title="Settings">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        <div
          className="rounded-xl border overflow-hidden"
          style={{
            borderColor: 'var(--border-color)',
            backgroundColor: 'color-mix(in srgb, var(--surface) 80%, transparent)',
          }}
        >
          <div
            className="px-6 py-5 border-b"
            style={{
              borderColor: 'var(--border-color)',
              background:
                'linear-gradient(135deg, color-mix(in srgb, var(--primary) 12%, transparent), color-mix(in srgb, var(--accent) 12%, transparent))',
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Tags className="h-5 w-5" style={{ color: 'var(--primary)' }} />
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Labels
                </h2>
              </div>
              <div
                className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--surface-2) 70%, transparent)',
                  color: 'var(--text-muted)',
                }}
              >
                {labels.length} total
              </div>
            </div>
            <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>
              Manage reusable labels for your tasks. Colors show up as chips on the card.
            </p>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div
                  className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
                  style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
                />
              </div>
            ) : (
              <LabelManager
                labels={labels}
                onCreateLabel={handleCreateLabel}
                onUpdateLabel={handleUpdateLabel}
                onDeleteLabel={handleDeleteLabel}
                disabled={isMutating}
              />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
