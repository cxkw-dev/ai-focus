#!/usr/bin/env node

const { Client } = require('pg')

async function main() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is required to ensure the statusChangedAt column',
    )
  }

  const client = new Client({ connectionString })

  await client.connect()

  try {
    await client.query(`
      ALTER TABLE "Todo"
      ADD COLUMN IF NOT EXISTS "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    `)

    await client.query(`
      UPDATE "Todo"
      SET "statusChangedAt" = "updatedAt"
      WHERE "statusChangedAt" > "updatedAt" + interval '1 minute'
    `)
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('Failed to ensure Todo.statusChangedAt exists before startup.')
  console.error(error)
  process.exit(1)
})
