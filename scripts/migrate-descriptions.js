#!/usr/bin/env node

const { Client } = require('pg')

function htmlToPlainText(html) {
  return html
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .trim()
}

function extractFirstSentence(plainText) {
  // Match up to first sentence-ending punctuation followed by space/newline/end
  const match = plainText.match(/^(.+?[.!?])(?:\s|$)/)
  if (match && match[1].length <= 200) return match[1]
  // Fallback: first line
  const firstLine = plainText.split(/\n/)[0].trim()
  if (firstLine.length <= 200) return firstLine
  // Last resort: truncate
  return firstLine.substring(0, 147) + '...'
}

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is required')
  }

  const client = new Client({ connectionString })
  await client.connect()

  try {
    const { rows: todos } = await client.query(`
      SELECT id, "taskNumber", title, description
      FROM "Todo"
      WHERE description IS NOT NULL
        AND description != ''
        AND "notebookNoteId" IS NULL
    `)

    console.log(`Found ${todos.length} todos without linked notes\n`)

    let migrated = 0
    let skipped = 0

    for (const todo of todos) {
      const plainText = htmlToPlainText(todo.description)

      // Skip if already short and single-line
      if (plainText.length <= 200 && !plainText.includes('\n')) {
        console.log(
          `#${todo.taskNumber}: already short (${plainText.length} chars), skipping`,
        )
        skipped++
        continue
      }

      const firstSentence = extractFirstSentence(plainText)
      const noteId = `migrated-${todo.id}-${Date.now()}`

      // Create notebook note with full original description
      await client.query(
        `INSERT INTO "NotebookNote" (id, title, content, pinned, archived, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, false, false, NOW(), NOW())`,
        [noteId, `Note for #${todo.taskNumber}`, todo.description],
      )

      // Update todo with short description + link to note
      await client.query(
        `UPDATE "Todo"
         SET description = $1, "notebookNoteId" = $2, "updatedAt" = NOW()
         WHERE id = $3`,
        [`<p>${firstSentence}</p>`, noteId, todo.id],
      )

      console.log(
        `#${todo.taskNumber}: migrated (${plainText.length} chars -> "${firstSentence}")`,
      )
      console.log(`  -> created note: ${noteId}\n`)
      migrated++
    }

    console.log(`\nDone. Migrated: ${migrated}, Skipped: ${skipped}`)
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})
