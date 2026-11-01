import * as React from 'react'
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

/** A titled group of link fields; the floated legend keeps it in flow like `.dd-form__legend`. */
function LinkGroup({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
      <legend className="text-text float-left flex w-full items-center gap-1.5 p-0 text-sm leading-tight font-semibold">
        {icon}
        {title}
      </legend>
      {children}
    </fieldset>
  )
}

function LinkField({
  id,
  label,
  children,
}: {
  id: string
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-muted text-xs font-medium">
        {label}
      </label>
      {children}
    </div>
  )
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
  const id = React.useId()

  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
      <LinkGroup icon={<AzureIcon />} title="Azure DevOps">
        <LinkField id={`${id}-azure-item`} label="My work item">
          <SingleUrlField
            id={`${id}-azure-item`}
            value={form.azureWorkItemUrl}
            onChange={form.setAzureWorkItemUrl}
            type="azure"
            disabled={disabled}
          />
        </LinkField>
        <LinkField id={`${id}-azure-deps`} label="Waiting on">
          <UrlListField
            id={`${id}-azure-deps`}
            type="azure"
            urls={form.azureDepUrls}
            onAdd={(url) => form.addAzureDepUrl(url)}
            onRemove={(i) => form.removeAzureDepUrl(i)}
            inputValue={newAzureDepUrl}
            onInputChange={setNewAzureDepUrl}
            disabled={disabled}
          />
        </LinkField>
      </LinkGroup>

      <LinkGroup icon={<GitHubIcon />} title="GitHub PRs">
        <LinkField id={`${id}-my-prs`} label="My PRs">
          <UrlListField
            id={`${id}-my-prs`}
            type="github"
            urls={form.myPrUrls}
            onAdd={(url) => form.addMyPrUrl(url)}
            onRemove={(i) => form.removeMyPrUrl(i)}
            inputValue={newMyPrUrl}
            onInputChange={setNewMyPrUrl}
            disabled={disabled}
          />
        </LinkField>
        <LinkField id={`${id}-pr-deps`} label="Waiting on">
          <UrlListField
            id={`${id}-pr-deps`}
            type="github"
            urls={form.githubPrUrls}
            onAdd={(url) => form.addGithubPrUrl(url)}
            onRemove={(i) => form.removeGithubPrUrl(i)}
            inputValue={newPrUrl}
            onInputChange={setNewPrUrl}
            disabled={disabled}
          />
        </LinkField>
      </LinkGroup>

      <LinkGroup icon={<GitHubIcon />} title="GitHub issues">
        <LinkField id={`${id}-my-issues`} label="My issues">
          <UrlListField
            id={`${id}-my-issues`}
            type="github-issue"
            urls={form.myIssueUrls}
            onAdd={(url) => form.addMyIssueUrl(url)}
            onRemove={(i) => form.removeMyIssueUrl(i)}
            inputValue={newMyIssueUrl}
            onInputChange={setNewMyIssueUrl}
            disabled={disabled}
          />
        </LinkField>
        <LinkField id={`${id}-issue-deps`} label="Waiting on">
          <UrlListField
            id={`${id}-issue-deps`}
            type="github-issue"
            urls={form.githubIssueUrls}
            onAdd={(url) => form.addGithubIssueUrl(url)}
            onRemove={(i) => form.removeGithubIssueUrl(i)}
            inputValue={newIssueUrl}
            onInputChange={setNewIssueUrl}
            disabled={disabled}
          />
        </LinkField>
      </LinkGroup>
    </div>
  )
}
