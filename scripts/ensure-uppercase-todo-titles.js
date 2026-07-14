#!/usr/bin/env node

const { Client } = require('pg')

async function main() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is required to normalize existing todo titles',
    )
  }

  const client = new Client({ connectionString })

  await client.connect()

  try {
    await client.query('BEGIN')

    const result = await client.query(`
      UPDATE "Todo"
      SET "title" = upper("title")
      WHERE "title" <> upper("title")
    `)

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'Todo_title_uppercase_check'
            AND conrelid = '"Todo"'::regclass
        ) THEN
          ALTER TABLE "Todo"
          ADD CONSTRAINT "Todo_title_uppercase_check"
          CHECK ("title" = upper("title"));
        END IF;
      END
      $$
    `)

    await client.query('COMMIT')
    console.log(`Normalized ${result.rowCount ?? 0} todo title(s).`)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('Failed to ensure todo titles are uppercase.')
  console.error(error)
  process.exit(1)
})
