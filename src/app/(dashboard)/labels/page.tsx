'use client'

import { Icon } from '@/components/ui/icon'
import { LabelManager } from '@/components/settings/label-manager'
import { useLabels } from '@/hooks/use-labels'

function plural(count: number, word: string) {
  return count === 1 ? word : `${word}s`
}

export default function LabelsPage() {
  const {
    labels,
    archivedLabels,
    isLoading,
    isMutating,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleRestore,
    handlePurge,
  } = useLabels()

  const labelsWithBillingCodes = labels.filter(
    (label) => label.billingCodes.length > 0,
  )
  const totalBillingCodes = labels.reduce(
    (count, label) => count + label.billingCodes.length,
    0,
  )

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 pt-2 pb-10">
      <header className="dd-page-header">
        <p className="dd-page-header__desc">
          Reusable labels for your todos, and the SAP HANA billing codes each
          one carries. A task’s billing drawer lists its label’s codes, so you
          can copy the exact one you need.
        </p>
        {!isLoading && (
          <ul className="dd-page-header__meta">
            <li>
              <Icon name="tag" />
              <b>{labels.length}</b> {plural(labels.length, 'label')}
            </li>
            <li>
              <Icon name="file" />
              <b>{labelsWithBillingCodes.length}</b> with billing codes
            </li>
            <li>
              <Icon name="list" />
              <b>{totalBillingCodes}</b> {plural(totalBillingCodes, 'code')}
            </li>
            {archivedLabels.length > 0 && (
              <li>
                <Icon name="archive" />
                <b>{archivedLabels.length}</b> archived
              </li>
            )}
          </ul>
        )}
      </header>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <span
            className="dd-loader dd-loader--sun"
            role="status"
            aria-label="Loading labels"
          >
            <span className="dd-loader__sky" aria-hidden="true">
              <i />
            </span>
            <span className="dd-loader__glyph" aria-hidden="true" />
          </span>
        </div>
      ) : (
        <LabelManager
          labels={labels}
          archivedLabels={archivedLabels}
          onCreateLabel={handleCreate}
          onUpdateLabel={handleUpdate}
          onDeleteLabel={handleDelete}
          onRestoreLabel={handleRestore}
          onPurgeLabel={handlePurge}
          disabled={isMutating}
        />
      )}
    </div>
  )
}
