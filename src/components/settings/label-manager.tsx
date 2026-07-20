'use client'

import { Archive } from 'lucide-react'
import { createDraftFromLabel } from './label-billing-codes'
import { useLabelManager } from './use-label-manager'
import { LabelManagerCreateForm } from './label-manager-create-form'
import { LabelManagerItem } from './label-manager-item'
import { LabelManagerArchivedItem } from './label-manager-archived-item'
import type {
  CreateLabelInput,
  Label as TodoLabel,
  UpdateLabelInput,
} from '@/types/todo'

interface LabelManagerProps {
  labels: TodoLabel[]
  archivedLabels?: TodoLabel[]
  onCreateLabel: (data: CreateLabelInput) => Promise<boolean>
  onUpdateLabel: (id: string, data: UpdateLabelInput) => Promise<boolean>
  onDeleteLabel: (id: string) => Promise<boolean>
  onRestoreLabel?: (id: string) => Promise<boolean>
  onPurgeLabel?: (id: string) => Promise<boolean>
  disabled?: boolean
}

export function LabelManager({
  labels,
  archivedLabels = [],
  onCreateLabel,
  onUpdateLabel,
  onDeleteLabel,
  onRestoreLabel,
  onPurgeLabel,
  disabled,
}: LabelManagerProps) {
  const {
    newDraft,
    setNewDraft,
    presetColors,
    drafts,
    isSaving,
    isCompact,
    newDraftError,
    updateDraft,
    updateDraftBillingCode,
    addDraftBillingCode,
    removeDraftBillingCode,
    updateNewBillingCode,
    handleCreate,
    commitUpdate,
    handleDelete,
    handleRestore,
    handlePurge,
  } = useLabelManager({
    labels,
    onCreateLabel,
    onUpdateLabel,
    onDeleteLabel,
    onRestoreLabel,
    onPurgeLabel,
  })

  return (
    <div className="space-y-5">
      <LabelManagerCreateForm
        newDraft={newDraft}
        setNewDraft={setNewDraft}
        presetColors={presetColors}
        newDraftError={newDraftError}
        disabled={disabled}
        isSaving={isSaving}
        updateNewBillingCode={updateNewBillingCode}
        handleCreate={handleCreate}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div
            className="text-xs font-semibold tracking-wide uppercase"
            style={{ color: 'var(--text-muted)' }}
          >
            Existing Labels
          </div>
          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Edit label details and linked billing codes together
          </div>
        </div>

        {labels.length === 0 && (
          <div
            className="rounded-xl border p-4 text-xs"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor:
                'color-mix(in srgb, var(--surface) 70%, transparent)',
              color: 'var(--text-muted)',
            }}
          >
            No labels yet. Create your first label above.
          </div>
        )}

        {labels.map((label) => {
          const draft = drafts[label.id] ?? createDraftFromLabel(label)

          return (
            <LabelManagerItem
              key={label.id}
              label={label}
              draft={draft}
              presetColors={presetColors}
              isCompact={isCompact}
              disabled={disabled}
              isSaving={isSaving}
              updateDraft={updateDraft}
              updateDraftBillingCode={updateDraftBillingCode}
              addDraftBillingCode={addDraftBillingCode}
              removeDraftBillingCode={removeDraftBillingCode}
              commitUpdate={commitUpdate}
              handleDelete={handleDelete}
            />
          )
        })}
      </div>

      {archivedLabels.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase"
              style={{ color: 'var(--text-muted)' }}
            >
              <Archive className="h-3.5 w-3.5" />
              Archived ({archivedLabels.length})
            </div>
            <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              History stays intact — restore anytime
            </div>
          </div>

          {archivedLabels.map((label) => (
            <LabelManagerArchivedItem
              key={label.id}
              label={label}
              onRestoreLabel={onRestoreLabel}
              onPurgeLabel={onPurgeLabel}
              handleRestore={handleRestore}
              handlePurge={handlePurge}
              disabled={disabled}
              isSaving={isSaving}
            />
          ))}
        </div>
      )}
    </div>
  )
}
