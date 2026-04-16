#!/usr/bin/env node

const { Client } = require('pg')

async function main() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is required to ensure the todo search index exists',
    )
  }

  const client = new Client({ connectionString })

  await client.connect()

  try {
    // pg_trgm enables case-insensitive ILIKE / contains queries to use indexes.
    // CREATE EXTENSION requires superuser; on Homebrew PostgreSQL the local
    // role usually qualifies. If this fails, the search still works (just
    // without an index) so we log and continue rather than blocking startup.
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS pg_trgm')
    } catch (extensionError) {
      console.warn(
        '[ensure-search-index] could not create pg_trgm extension; ' +
          'title search will fall back to a sequential scan.',
        extensionError.message ?? extensionError,
      )
      return
    }

    await client.query(`
      CREATE INDEX IF NOT EXISTS "Todo_title_trgm_idx"
      ON "Todo" USING gin ("title" gin_trgm_ops)
    `)
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('Failed to ensure Todo title search index exists.')
  console.error(error)
  process.exit(1)
})
