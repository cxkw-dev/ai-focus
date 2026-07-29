import { describe, expect, it } from 'vitest'
import { isSingleUrl, prettyLinkLabel, truncateMiddle } from './link-label'

describe('truncateMiddle', () => {
  it('leaves short values alone', () => {
    expect(truncateMiddle('short', 10)).toBe('short')
  })

  it('keeps both ends', () => {
    expect(truncateMiddle('abcdefghij', 7)).toBe('abc…hij')
    expect(truncateMiddle('abcdefghij', 7).length).toBe(7)
  })
})

describe('prettyLinkLabel', () => {
  it('shows the host when there is nothing else to name', () => {
    expect(prettyLinkLabel('https://example.com')).toBe('example.com')
    expect(prettyLinkLabel('https://www.example.com/')).toBe('example.com')
  })

  it('names the document from the path', () => {
    expect(prettyLinkLabel('https://example.com/docs/setup-guide')).toBe(
      'example.com/setup-guide',
    )
  })

  it('prefers a filename in the query over a viewer path', () => {
    const url =
      'https://kyndryl.sharepoint.com/:w:/r/sites/Team/_layouts/15/Doc.aspx?sourcedoc=%7BABC%7D&file=CONTROL_M.docx&action=default'
    // Host plus filename busts the budget, and the filename is what matters.
    expect(prettyLinkLabel(url)).toBe('CONTROL_M.docx')
  })

  it('skips viewer segments', () => {
    expect(prettyLinkLabel('https://example.com/reports/q3/index.html')).toBe(
      'example.com/q3',
    )
  })

  it('keeps a bare id next to what it identifies', () => {
    expect(prettyLinkLabel('https://jira.example.com/browse/1234')).toBe(
      'jira.example.com/browse/1234',
    )
  })

  it('labels GitHub pull requests and issues by number', () => {
    expect(prettyLinkLabel('https://github.com/acme/app/pull/12')).toBe(
      'acme/app#12',
    )
    expect(
      prettyLinkLabel('https://github.com/acme/app/issues/9#issue-1'),
    ).toBe('acme/app#9')
    expect(prettyLinkLabel('https://github.com/acme/app')).toBe('acme/app')
  })

  it('decodes escaped path segments', () => {
    expect(prettyLinkLabel('https://example.com/docs/my%20plan.pdf')).toBe(
      'example.com/my plan.pdf',
    )
  })

  it('drops a long host rather than mangling the name', () => {
    const label = prettyLinkLabel(
      'https://aapi-swagger-doc.s3-website-us-west-2.amazonaws.com/reference/auth-and-authz.html',
    )
    expect(label).toBe('auth-and-authz.html')
  })

  it('truncates a name that busts the budget on its own', () => {
    const label = prettyLinkLabel(
      'https://ex.com/a-very-long-document-name-that-nobody-reads-in-full.docx',
    )
    expect(label.length).toBeLessThanOrEqual(36)
    expect(label.startsWith('ex.com/')).toBe(true)
    expect(label).toContain('…')
    // The extension survives, so you can still tell what it is.
    expect(label.endsWith('.docx')).toBe(true)
  })

  it('reads a filename escaped for HTML, as stored content has it', () => {
    const url =
      'https://team.sharepoint.com/_layouts/15/Doc.aspx?sourcedoc=%7BABC%7D&amp;file=CONTROL_M.docx&amp;action=default'
    expect(prettyLinkLabel(url)).toBe('team.sharepoint.com/CONTROL_M.docx')
  })

  it('falls back to the raw value when it cannot be parsed', () => {
    expect(prettyLinkLabel('not a url')).toBe('not a url')
  })
})

describe('isSingleUrl', () => {
  it('accepts a lone URL', () => {
    expect(isSingleUrl('https://example.com/a')).toBe(true)
    expect(isSingleUrl('  www.example.com  ')).toBe(true)
  })

  it('rejects prose and empty pastes', () => {
    expect(isSingleUrl('see https://example.com')).toBe(false)
    expect(isSingleUrl('')).toBe(false)
    expect(isSingleUrl('hello')).toBe(false)
  })
})
