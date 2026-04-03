'use client'

import { ReceiptText, Tags } from 'lucide-react'
import { LabelManager } from '@/components/settings/label-manager'
import { useLabels } from '@/hooks/use-labels'

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div
        className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
        style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
      />
    </div>
  )
}

export default function LabelsPage() {
  const {
    labels,
    isLoading,
    isMutating,
    handleCreate,
    handleUpdate,
    handleDelete,
  } = useLabels()

  const labelsWithBillingCodes = labels.filter(
    (label) => label.billingCodes.length > 0,
  )
  const totalBillingCodes = labels.reduce(
    (count, label) => count + label.billingCodes.length,
    0,
  )

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <section
        className="overflow-hidden rounded-xl border"
        style={{
          borderColor: 'var(--border-color)',
          backgroundColor: 'color-mix(in srgb, var(--surface) 82%, transparent)',
        }}
      >
        <div
          className="border-b px-4 py-5 sm:px-6"
          style={{
            borderColor: 'var(--border-color)',
            background:
              'linear-gradient(135deg, color-mix(in srgb, var(--primary) 14%, transparent), color-mix(in srgb, var(--accent) 12%, transparent))',
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <Tags className="h-5 w-5" style={{ color: 'var(--primary)' }} />
                <h2
                  className="text-lg font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Labels & Billing Codes
                </h2>
              </div>
              <p className="max-w-2xl text-sm" style={{ color: 'var(--text-muted)' }}>
                Manage reusable labels and the SAP HANA billing codes linked to
                each one. Tasks can expose those codes from a dedicated billing
                drawer so you can open the list and copy the exact one you need.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <div
                className="rounded-full px-3 py-1 text-[10px] font-semibold tracking-wide uppercase"
                style={{
                  backgroundColor:
                    'color-mix(in srgb, var(--surface-2) 70%, transparent)',
                  color: 'var(--text-muted)',
                }}
              >
                {labels.length} total labels
              </div>
              <div
                className="rounded-full px-3 py-1 text-[10px] font-semibold tracking-wide uppercase"
                style={{
                  backgroundColor:
                    'color-mix(in srgb, var(--primary) 14%, transparent)',
                  color: 'var(--primary)',
                }}
              >
                {labelsWithBillingCodes.length} with billing codes
              </div>
              <div
                className="rounded-full px-3 py-1 text-[10px] font-semibold tracking-wide uppercase"
                style={{
                  backgroundColor:
                    'color-mix(in srgb, var(--accent) 14%, transparent)',
                  color: 'var(--accent)',
                }}
              >
                {totalBillingCodes} total codes
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-b px-4 py-4 sm:grid-cols-2 sm:px-6">
          <div
            className="rounded-xl border p-4"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor:
                'color-mix(in srgb, var(--surface-2) 70%, transparent)',
            }}
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Tags className="h-4 w-4" style={{ color: 'var(--primary)' }} />
              <span style={{ color: 'var(--text-primary)' }}>Label identity</span>
            </div>
            <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              Each label keeps its name and color so your todo columns and chips
              stay familiar.
            </p>
          </div>

          <div
            className="rounded-xl border p-4"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor:
                'color-mix(in srgb, var(--surface-2) 70%, transparent)',
            }}
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ReceiptText
                className="h-4 w-4"
                style={{ color: 'var(--primary)' }}
              />
              <span style={{ color: 'var(--text-primary)' }}>
                Billing copy target
              </span>
            </div>
            <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              Add one or more billing codes with a type and optional
              description when that label needs SAP-ready copy targets.
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <LabelManager
              labels={labels}
              onCreateLabel={handleCreate}
              onUpdateLabel={handleUpdate}
              onDeleteLabel={handleDelete}
              disabled={isMutating}
            />
          )}
        </div>
      </section>
    </div>
  )
}
