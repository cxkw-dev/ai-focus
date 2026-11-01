'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from '@/components/ui/dialog'
import { Icon } from '@/components/ui/icon'
import { createDraftFromLabel } from './label-billing-codes'
import { useLabelManager } from './use-label-manager'
import { LabelManagerCreateForm } from './label-manager-create-form'
import { LabelEditDrawer, LabelManagerItem } from './label-manager-item'
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
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [purgeTarget, setPurgeTarget] = React.useState<TodoLabel | null>(null)
  const activeTitleId = React.useId()
  const archivedTitleId = React.useId()

  const editingLabel = labels.find((label) => label.id === editingId) ?? null
  const editingDraft = editingLabel
    ? (drafts[editingLabel.id] ?? createDraftFromLabel(editingLabel))
    : null

  // Each edit starts from the saved label; closing without saving drops the draft.
  const startEdit = (label: TodoLabel) => {
    updateDraft(label.id, createDraftFromLabel(label))
    setEditingId(label.id)
  }

  return (
    <div className="flex flex-col gap-12">
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

      <section aria-labelledby={activeTitleId}>
        <header className="dd-table-header">
          <h2 className="dd-table-header__title" id={activeTitleId}>
            in use
          </h2>
          <span className="dd-table-header__meta">{labels.length}</span>
        </header>
        {labels.length === 0 ? (
          <div className="dd-surface">
            <div className="dd-empty-state dd-empty-state--compact">
              <div className="dd-empty-state__icon">
                <Icon name="tag" />
              </div>
              <p className="dd-empty-state__title">No labels yet</p>
              <p className="dd-empty-state__text">
                Labels you add above show up here, ready to tag todos.
              </p>
            </div>
          </div>
        ) : (
          <div
            className="dd-table dd-table--compact dd-table--mono"
            tabIndex={0}
            role="region"
            aria-labelledby={activeTitleId}
          >
            <table>
              <thead>
                <tr>
                  <th scope="col">Label</th>
                  <th scope="col" className="hidden sm:table-cell">
                    Repository
                  </th>
                  <th scope="col" className="is-num">
                    Codes
                  </th>
                  <th scope="col" className="is-shrink">
                    <span className="dd-visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {labels.map((label) => (
                  <LabelManagerItem
                    key={label.id}
                    label={label}
                    disabled={disabled}
                    isSaving={isSaving}
                    onEdit={startEdit}
                    handleDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="dd-caption mt-2">
          Archiving keeps a label’s history and hides it from active lists.
        </p>
      </section>

      {archivedLabels.length > 0 && (
        <section aria-labelledby={archivedTitleId}>
          <header className="dd-table-header">
            <h2 className="dd-table-header__title" id={archivedTitleId}>
              archived
            </h2>
            <span className="dd-table-header__meta">
              {archivedLabels.length}
            </span>
          </header>
          <div
            className="dd-table dd-table--compact dd-table--mono"
            tabIndex={0}
            role="region"
            aria-labelledby={archivedTitleId}
          >
            <table>
              <thead>
                <tr>
                  <th scope="col">Label</th>
                  <th scope="col" className="is-num hidden sm:table-cell">
                    Archived
                  </th>
                  <th scope="col" className="is-num">
                    Codes
                  </th>
                  <th scope="col" className="is-shrink">
                    <span className="dd-visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {archivedLabels.map((label) => (
                  <LabelManagerArchivedItem
                    key={label.id}
                    label={label}
                    onRestoreLabel={onRestoreLabel}
                    onPurgeLabel={onPurgeLabel}
                    handleRestore={handleRestore}
                    onRequestPurge={setPurgeTarget}
                    disabled={disabled}
                    isSaving={isSaving}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <p className="dd-caption mt-2">
            History stays intact — restore a label any time.
          </p>
        </section>
      )}

      <LabelEditDrawer
        label={editingLabel}
        draft={editingDraft}
        presetColors={presetColors}
        disabled={disabled}
        isSaving={isSaving}
        onClose={() => setEditingId(null)}
        updateDraft={updateDraft}
        updateDraftBillingCode={updateDraftBillingCode}
        addDraftBillingCode={addDraftBillingCode}
        removeDraftBillingCode={removeDraftBillingCode}
        commitUpdate={commitUpdate}
      />

      <Dialog
        open={purgeTarget !== null}
        onOpenChange={(open) => !open && setPurgeTarget(null)}
      >
        {purgeTarget && (
          <DialogContent size="sm" danger role="alertdialog">
            <DialogHeader
              icon="danger"
              eyebrow="Archived label"
              title={`delete ${purgeTarget.name} for good?`}
              hideClose
            />
            <DialogBody>
              <p className="m-0">
                This removes the label and its billing codes permanently. It
                can’t be undone.
              </p>
            </DialogBody>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost" autoFocus>
                  Keep it
                </Button>
              </DialogClose>
              <Button
                type="button"
                variant="danger"
                disabled={disabled || isSaving}
                onClick={async () => {
                  const target = purgeTarget
                  setPurgeTarget(null)
                  await handlePurge(target.id)
                }}
              >
                <Icon name="trash" />
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
