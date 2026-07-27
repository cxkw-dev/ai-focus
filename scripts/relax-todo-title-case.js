#!/usr/bin/env node

// Titles used to be forced to UPPER CASE by the app, backed by a CHECK
// constraint. Casing is now the author's to choose, so the constraint has to go
// — while it exists every insert of a normally-cased title fails with 23514.
// Idempotent: safe to run on every boot, and a no-op once the constraint is gone.

const { Client } = require('pg')

async function main() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL is required to relax todo title casing')
  }

  const client = new Client({ connectionString })

  await client.connect()

  try {
    await client.query(`
      ALTER TABLE "Todo"
      DROP CONSTRAINT IF EXISTS "Todo_title_uppercase_check"
    `)
    console.log('Todo titles: uppercase constraint removed (if it existed).')
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('Failed to relax todo title casing.')
  console.error(error)
  process.exit(1)
})
