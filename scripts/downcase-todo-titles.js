#!/usr/bin/env node

// One-time retrofit: titles were force-uppercased for years by the old
// ensure-uppercase-todo-titles script. Casing belongs to the author now, so
// bring the shouted history back down.
//
//   node --env-file=.env scripts/downcase-todo-titles.js            # lower case
//   node --env-file=.env scripts/downcase-todo-titles.js --sentence # Sentence case
//   node --env-file=.env scripts/downcase-todo-titles.js --restore <backup.json>
//
// Only rows that are still entirely upper case are touched, so anything typed
// after the switch keeps its casing and re-running is a no-op.

const fs = require('node:fs')
const path = require('node:path')
const { Client } = require('pg')

const BACKUP_DIR = path.join(process.cwd(), '.backups')

function toLower(title) {
  return title.toLowerCase()
}

function toSentence(title) {
  const lower = title.toLowerCase()
  return lower.replace(/[a-z]/, (first) => first.toUpperCase())
}

async function restore(client, backupPath) {
  const rows = JSON.parse(fs.readFileSync(backupPath, 'utf8'))
  await client.query('BEGIN')
  try {
    for (const row of rows) {
      await client.query('UPDATE "Todo" SET title = $1 WHERE id = $2', [
        row.title,
        row.id,
      ])
    }
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  }
  console.log(`Restored ${rows.length} title(s) from ${backupPath}`)
}

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is required')

  const args = process.argv.slice(2)
  const restoreIndex = args.indexOf('--restore')
  const transform = args.includes('--sentence') ? toSentence : toLower

  const client = new Client({ connectionString })
  await client.connect()

  try {
    if (restoreIndex !== -1) {
      const backupPath = args[restoreIndex + 1]
      if (!backupPath) throw new Error('--restore needs a backup file path')
      await restore(client, backupPath)
      return
    }

    // Uppercase-only rows: a title with no lower-case letters that still has
    // letters to change. Digit/symbol-only titles are left alone.
    const { rows } = await client.query(`
      SELECT id, title FROM "Todo"
      WHERE title = upper(title) AND title ~ '[A-Z]'
      ORDER BY "taskNumber"
    `)

    if (rows.length === 0) {
      console.log('Nothing to do — no all-caps titles remain.')
      return
    }

    fs.mkdirSync(BACKUP_DIR, { recursive: true })
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = path.join(BACKUP_DIR, `todo-titles-${stamp}.json`)
    fs.writeFileSync(backupPath, JSON.stringify(rows, null, 2))
    console.log(`Backed up ${rows.length} title(s) to ${backupPath}`)

    await client.query('BEGIN')
    try {
      for (const row of rows) {
        await client.query('UPDATE "Todo" SET title = $1 WHERE id = $2', [
          transform(row.title),
          row.id,
        ])
      }
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }

    console.log(`Rewrote ${rows.length} title(s).`)
    console.log('Undo with:')
    console.log(
      `  node --env-file=.env scripts/downcase-todo-titles.js --restore ${backupPath}`,
    )
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('Failed to downcase todo titles.')
  console.error(error)
  process.exit(1)
})
