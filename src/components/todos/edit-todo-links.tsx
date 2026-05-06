import { Label } from '@/components/ui/label'
import {
  AzureIcon,
  GitHubIcon,
  SingleUrlField,
  UrlListField,
} from './url-fields'
import type { TodoFormState } from '@/hooks/use-todo-form'

interface EditTodoLinksProps {
  form: TodoFormState
  disabled?: boolean
  newAzureDepUrl: string
  setNewAzureDepUrl: (url: string) => void
  newMyPrUrl: string
  setNewMyPrUrl: (url: string) => void
  newPrUrl: string
  setNewPrUrl: (url: string) => void
  newMyIssueUrl: string
  setNewMyIssueUrl: (url: string) => void
  newIssueUrl: string
  setNewIssueUrl: (url: string) => void
}

export function EditTodoLinks({
  form,
  disabled,
  newAzureDepUrl,
  setNewAzureDepUrl,
  newMyPrUrl,
  setNewMyPrUrl,
  newPrUrl,
  setNewPrUrl,
  newMyIssueUrl,
  setNewMyIssueUrl,
  newIssueUrl,
  setNewIssueUrl,
}: EditTodoLinksProps) {
  return (
    <>
      <div
        className="mt-4 grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2"
        style={{ borderTop: '1px solid var(--border-color)' }}
      >
        <div className="min-w-0 space-y-3">
          <Label
            className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase"
            style={{ color: 'var(--text-muted)' }}
          >
            <AzureIcon className="h-3.5 w-3.5" />
            Azure
          </Label>

          <div className="space-y-1.5">
            <span
              className="text-[10px] font-medium tracking-wide uppercase"
              style={{ color: 'var(--text-muted)' }}
            >
              My Work Item
            </span>
            <SingleUrlField
              value={form.azureWorkItemUrl}
              onChange={form.setAzureWorkItemUrl}
              type="azure"
              disabled={disabled}
            />
          </div>

          <div className="space-y-1.5">
            <span
              className="text-[10px] font-medium tracking-wide uppercase"
              style={{ color: 'var(--text-muted)' }}
            >
              Waiting On
            </span>
            <UrlListField
              type="azure"
              urls={form.azureDepUrls}
              onAdd={(url) => form.addAzureDepUrl(url)}
              onRemove={(i) => form.removeAzureDepUrl(i)}
              inputValue={newAzureDepUrl}
              onInputChange={setNewAzureDepUrl}
              disabled={disabled}
            />
          </div>
        </div>

        <div className="min-w-0 space-y-3">
          <Label
            className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase"
            style={{ color: 'var(--text-muted)' }}
          >
            <GitHubIcon className="h-3.5 w-3.5" />
            GitHub PRs
          </Label>

          <div className="space-y-1.5">
            <span
              className="text-[10px] font-medium tracking-wide uppercase"
              style={{ color: 'var(--text-muted)' }}
            >
              My PRs
            </span>
            <UrlListField
              type="github"
              urls={form.myPrUrls}
              onAdd={(url) => form.addMyPrUrl(url)}
              onRemove={(i) => form.removeMyPrUrl(i)}
              inputValue={newMyPrUrl}
              onInputChange={setNewMyPrUrl}
              disabled={disabled}
            />
          </div>

          <div className="space-y-1.5">
            <span
              className="text-[10px] font-medium tracking-wide uppercase"
              style={{ color: 'var(--text-muted)' }}
            >
              Waiting On
            </span>
            <UrlListField
              type="github"
              urls={form.githubPrUrls}
              onAdd={(url) => form.addGithubPrUrl(url)}
              onRemove={(i) => form.removeGithubPrUrl(i)}
              inputValue={newPrUrl}
              onInputChange={setNewPrUrl}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="min-w-0 space-y-1.5">
          <Label
            className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase"
            style={{ color: 'var(--text-muted)' }}
          >
            <GitHubIcon className="h-3.5 w-3.5" />
            My Issues
          </Label>
          <UrlListField
            type="github-issue"
            urls={form.myIssueUrls}
            onAdd={(url) => form.addMyIssueUrl(url)}
            onRemove={(i) => form.removeMyIssueUrl(i)}
            inputValue={newMyIssueUrl}
            onInputChange={setNewMyIssueUrl}
            disabled={disabled}
          />
        </div>

        <div className="min-w-0 space-y-1.5">
          <Label
            className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase"
            style={{ color: 'var(--text-muted)' }}
          >
            <GitHubIcon className="h-3.5 w-3.5" />
            Waiting On Issues
          </Label>
          <UrlListField
            type="github-issue"
            urls={form.githubIssueUrls}
            onAdd={(url) => form.addGithubIssueUrl(url)}
            onRemove={(i) => form.removeGithubIssueUrl(i)}
            inputValue={newIssueUrl}
            onInputChange={setNewIssueUrl}
            disabled={disabled}
          />
        </div>
      </div>
    </>
  )
}
