/**
 * Titles are kept exactly as typed — collapse stray whitespace only. This used
 * to force UPPER CASE, which flattened acronyms and product names into the same
 * shout as every other word.
 */
export function normalizeTodoTitle(title: string) {
  return title.replace(/\s+/g, ' ').trim()
}
