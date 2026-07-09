import { z } from 'zod'

export const yearStatsQuerySchema = z
  .object({
    year: z.coerce.number().int().min(2000).max(2100).optional(),
  })
  .transform(({ year }) => ({ year: year ?? new Date().getFullYear() }))

export function parseYearStatsQuery(searchParams: URLSearchParams) {
  return yearStatsQuerySchema.parse({
    year: searchParams.get('year') ?? undefined,
  })
}
