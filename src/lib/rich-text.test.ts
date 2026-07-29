import { describe, expect, it } from 'vitest'
import {
  ensureProtocol,
  linkifyHtml,
  mentionifyHtml,
  sanitizeHtml,
} from './rich-text'

describe('ensureProtocol', () => {
  it('passes through http(s) URLs', () => {
    expect(ensureProtocol('http://example.com')).toBe('http://example.com')
    expect(ensureProtocol('https://example.com')).toBe('https://example.com')
  })

  it('passes through mailto and tel URLs', () => {
    expect(ensureProtocol('mailto:a@b.com')).toBe('mailto:a@b.com')
    expect(ensureProtocol('tel:+15555555555')).toBe('tel:+15555555555')
  })

  it('prepends https:// to schemeless URLs', () => {
    expect(ensureProtocol('example.com')).toBe('https://example.com')
    expect(ensureProtocol('www.example.com/path')).toBe(
      'https://www.example.com/path',
    )
  })

  it('rejects javascript: URLs', () => {
    expect(ensureProtocol('javascript:alert(1)')).toBe('#')
    expect(ensureProtocol(' JavaScript:alert(1)')).toBe('#')
  })

  it('rejects data:, vbscript:, and file: URLs', () => {
    expect(ensureProtocol('data:text/html,<script>alert(1)</script>')).toBe('#')
    expect(ensureProtocol('vbscript:msgbox(1)')).toBe('#')
    expect(ensureProtocol('file:///etc/passwd')).toBe('#')
  })

  it('rejects unknown schemes', () => {
    expect(ensureProtocol('chrome://settings')).toBe('#')
  })
})

describe('sanitizeHtml', () => {
  it('strips <script> tags', () => {
    const dirty = '<p>hi</p><script>alert(1)</script>'
    expect(sanitizeHtml(dirty)).not.toContain('<script')
    expect(sanitizeHtml(dirty)).toContain('<p>hi</p>')
  })

  it('strips event handler attributes', () => {
    const dirty = '<p onclick="alert(1)">hi</p>'
    const clean = sanitizeHtml(dirty)
    expect(clean).not.toContain('onclick')
  })

  it('strips <img onerror> payloads', () => {
    // <img> isn't in the allow list, so it should be removed entirely.
    const dirty = '<img src=x onerror="alert(1)">'
    const clean = sanitizeHtml(dirty)
    expect(clean).not.toContain('<img')
    expect(clean).not.toContain('onerror')
  })

  it('removes javascript: hrefs but keeps the anchor text', () => {
    const dirty = '<a href="javascript:alert(1)">click</a>'
    const clean = sanitizeHtml(dirty)
    expect(clean).not.toContain('javascript:')
    expect(clean).toContain('click')
  })

  it('forces target=_blank and rel=noopener on anchors', () => {
    const clean = sanitizeHtml('<a href="https://example.com">x</a>')
    expect(clean).toContain('target="_blank"')
    expect(clean).toContain('rel="noopener noreferrer"')
  })

  it('preserves mention spans produced by TipTap', () => {
    const dirty =
      '<span data-type="mention" data-id="u1" data-email="a@b.com" data-label="Alice">@Alice</span>'
    const clean = sanitizeHtml(dirty)
    expect(clean).toContain('data-type="mention"')
    expect(clean).toContain('data-email="a@b.com"')
    expect(clean).toContain('@Alice')
  })

  it('preserves font-size inline styles but strips others', () => {
    const dirty =
      '<span style="font-size: 14px; background: url(javascript:alert(1))">x</span>'
    const clean = sanitizeHtml(dirty)
    expect(clean).toContain('font-size')
    expect(clean).not.toContain('javascript')
    expect(clean).not.toContain('background')
  })

  it('strips <iframe> tags', () => {
    const dirty = '<iframe src="https://evil.com"></iframe><p>ok</p>'
    const clean = sanitizeHtml(dirty)
    expect(clean).not.toContain('<iframe')
    expect(clean).toContain('<p>ok</p>')
  })
})

describe('linkifyHtml + sanitizeHtml', () => {
  it('linkifies bare URLs and sanitizer keeps them safe', () => {
    const out = sanitizeHtml(linkifyHtml('see https://example.com today'))
    expect(out).toContain('href="https://example.com"')
    expect(out).toContain('target="_blank"')
  })

  it('does not double-linkify existing anchors', () => {
    const html = '<a href="https://example.com">x</a>'
    const out = linkifyHtml(html)
    // Should be unchanged structurally — only one anchor.
    expect((out.match(/<a\s/gi) ?? []).length).toBe(1)
  })

  it('sanitizes payloads injected via linkified text', () => {
    const dirty = linkifyHtml('hello <script>alert(1)</script> world')
    const clean = sanitizeHtml(dirty)
    expect(clean).not.toContain('<script')
  })

  it('labels a bare URL with its short form and keeps the full href', () => {
    const out = linkifyHtml('https://example.com/docs/setup-guide.pdf')
    expect(out).toContain('href="https://example.com/docs/setup-guide.pdf"')
    expect(out).toContain('>example.com/setup-guide.pdf<')
    expect(out).toContain('class="link-chip"')
    expect(out).toContain('title="https://example.com/docs/setup-guide.pdf"')
  })

  it('shortens an anchor that shows its own URL', () => {
    const html =
      '<a href="https://example.com/docs/plan.docx">https://example.com/docs/plan.docx</a>'
    const out = linkifyHtml(html)
    expect((out.match(/<a\s/gi) ?? []).length).toBe(1)
    expect(out).toContain('href="https://example.com/docs/plan.docx"')
    expect(out).toContain('>example.com/plan.docx<')
  })

  it('leaves an anchor with real link text alone', () => {
    const html = '<a href="https://example.com/docs/plan.docx">the plan</a>'
    expect(linkifyHtml(html)).toBe(html)
  })

  it('keeps the destination when the visible URL disagrees with the href', () => {
    const out = linkifyHtml(
      '<a href="https://real.example.com/a">https://shown.example.com/b</a>',
    )
    expect(out).toContain('href="https://real.example.com/a"')
    expect(out).toContain('>shown.example.com/b<')
  })

  it('escapes a URL that tries to break out of the href', () => {
    const clean = sanitizeHtml(
      linkifyHtml('https://example.com/"onmouseover="alert(1)'),
    )
    // The quote is escaped, so the payload stays data instead of becoming an
    // attribute of its own.
    expect(clean).not.toMatch(/\sonmouseover=/i)
  })

  it('keeps the full address in a tooltip through sanitizing', () => {
    const clean = sanitizeHtml(
      linkifyHtml('https://example.com/docs/setup-guide.pdf'),
    )
    expect(clean).toContain('title="https://example.com/docs/setup-guide.pdf"')
  })
})

describe('mentionifyHtml', () => {
  it('converts TipTap mention spans into Teams anchors', () => {
    const html =
      '<span data-type="mention" data-email="a@b.com" data-label="Alice">@Alice</span>'
    const out = mentionifyHtml(html)
    expect(out).toContain('teams.microsoft.com')
    expect(out).toContain('a%40b.com')
    expect(out).toContain('class="mention"')
  })
})
