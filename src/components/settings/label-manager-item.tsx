'use client'

import { Button, IconButton } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from '@/components/ui/drawer'
import {
  BillingCodeFields,
  getBillingDraftError,
  hasDraftChanges,
  LabelDraftError,
  LabelFields,
  type BillingCodeDraft,
  type LabelDraft,
} from './label-billing-codes'
import type { PresetColor } from './use-label-manager'
import type { Label as TodoLabel } from '@/types/todo'

/** `https://github.com/org/repo` → `org/repo`; other hosts keep everything after the scheme. */
export function shortRepoUrl(repoUrl: string) {
  return repoUrl
    .replace(/^https?:\/\/(www\.)?github\.com\//i, '')
    .replace(/^https?:\/\//i, '')
    .replace(/\/$/, '')
}

interface LabelManagerItemProps {
  label: TodoLabel
  disabled?: boolean
  isSaving: boolean
  onEdit: (label: TodoLabel) => void
  handleDelete: (id: string) => Promise<void>
}

/** One active label as a table row: its chip, repo and code count, with ghost Edit and Archive. */
export function LabelManagerItem({
  label,
  disabled,
  isSaving,
  onEdit,
  handleDelete,
}: LabelManagerItemProps) {
  return (
    <tr>
      <td>
        <Chip color={label.color} className="max-w-64">
          <span className="truncate">{label.name}</span>
        </Chip>
      </td>
      <td className="is-mono is-muted hidden sm:table-cell">
        {label.repoUrl ? (
          <span className="block max-w-64 truncate" title={label.repoUrl}>
            {shortRepoUrl(label.repoUrl)}
          </span>
        ) : (
          <span className="text-quiet">—</span>
        )}
      </td>
      <td className="is-num">{label.billingCodes.length}</td>
      <td className="is-shrink">
        <div className="flex items-center justify-end gap-0.5">
          <IconButton
            icon="edit"
            label={`Edit ${label.name}`}
            size="sm"
            onClick={() => onEdit(label)}
            disabled={disabled}
          />
          <IconButton
            icon="archive"
            label="Archive label"
            size="sm"
            onClick={() => void handleDelete(label.id)}
            disabled={disabled || isSaving}
          />
        </div>
      </td>
    </tr>
  )
}

interface LabelEditDrawerProps {
  /** The label being edited; null when the drawer is closed. */
  label: TodoLabel | null
  draft: LabelDraft | null
  presetColors: PresetColor[]
  disabled?: boolean
  isSaving: boolean
  onClose: () => void
  updateDraft: (id: string, updates: Partial<LabelDraft>) => void
  updateDraftBillingCode: (
    id: string,
    index: number,
    updates: Partial<BillingCodeDraft>,
  ) => void
  addDraftBillingCode: (id: string) => void
  removeDraftBillingCode: (id: string, index: number) => void
  commitUpdate: (label: TodoLabel, draft: LabelDraft) => Promise<boolean>
}

/** Edits one label's name, colour, repo and billing codes in a drawer; Save sends only what changed. */
export function LabelEditDrawer({
  label,
  draft,
  presetColors,
  disabled,
  isSaving,
  onClose,
  updateDraft,
  updateDraftBillingCode,
  addDraftBillingCode,
  removeDraftBillingCode,
  commitUpdate,
}: LabelEditDrawerProps) {
  const open = label !== null && draft !== null

  return (
    <Drawer open={open} onOpenChange={(next) => !next && onClose()}>
      {open && (
        <LabelEditDrawerContent
          label={label}
          draft={draft}
          presetColors={presetColors}
          disabled={disabled}
          isSaving={isSaving}
          onClose={onClose}
          updateDraft={updateDraft}
          updateDraftBillingCode={updateDraftBillingCode}
          addDraftBillingCode={addDraftBillingCode}
          removeDraftBillingCode={removeDraftBillingCode}
          commitUpdate={commitUpdate}
        />
      )}
    </Drawer>
  )
}

function LabelEditDrawerContent({
  label,
  draft,
  presetColors,
  disabled,
  isSaving,
  onClose,
  updateDraft,
  updateDraftBillingCode,
  addDraftBillingCode,
  removeDraftBillingCode,
  commitUpdate,
}: LabelEditDrawerProps & { label: TodoLabel; draft: LabelDraft }) {
  const billingError = getBillingDraftError(draft.billingCodes)
  const canSave =
    draft.name.trim().length > 0 &&
    !billingError &&
    hasDraftChanges(label, draft)

  return (
    <DrawerContent size="md">
      <form
        className="dd-drawer__form flex min-h-0 flex-1 flex-col"
        noValidate
        onSubmit={async (event) => {
          event.preventDefault()
          if (!canSave) return
          if (await commitUpdate(label, draft)) onClose()
        }}
      >
        <DrawerHeader
          eyebrow="Edit label"
          title={label.name}
          meta={
            <Chip color={draft.color}>{draft.name.trim() || 'Untitled'}</Chip>
          }
        />
        <DrawerBody className="dd-form__body">
          <LabelFields
            draft={draft}
            presetColors={presetColors}
            disabled={disabled}
            onChange={(updates) => updateDraft(label.id, updates)}
          />
          <BillingCodeFields
            billingCodes={draft.billingCodes}
            disabled={disabled || isSaving}
            onAdd={() => addDraftBillingCode(label.id)}
            onChange={(index, updates) =>
              updateDraftBillingCode(label.id, index, updates)
            }
            onRemove={(index) => removeDraftBillingCode(label.id, index)}
            helperText="They show in the billing drawer of every todo with this label."
            emptyText="No billing codes on this label yet."
            labelName={draft.name.trim() || label.name}
          />
          {billingError && <LabelDraftError>{billingError}</LabelDraftError>}
        </DrawerBody>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </DrawerClose>
          <Button
            type="submit"
            variant="primary"
            disabled={!canSave || disabled || isSaving}
          >
            Save changes
          </Button>
        </DrawerFooter>
      </form>
    </DrawerContent>
  )
}
