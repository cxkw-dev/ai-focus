import { z } from 'zod'
import type { AccomplishmentCategory } from '@/types/accomplishment'

export const ACCOMPLISHMENT_CATEGORY_VALUES = [
  'DELIVERY',
  'HIRING',
  'MENTORING',
  'COLLABORATION',
  'GROWTH',
  'OTHER',
] as const satisfies readonly AccomplishmentCategory[]

export const accomplishmentCategorySchema = z.enum(
  ACCOMPLISHMENT_CATEGORY_VALUES,
)

const accomplishmentDateSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid date')

export const listAccomplishmentsQuerySchema = z
  .object({
    year: z.coerce.number().int().min(2000).max(2100).optional(),
  })
  .transform(({ year }) => ({ year: year ?? new Date().getFullYear() }))

export const createAccomplishmentSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  category: accomplishmentCategorySchema,
  date: accomplishmentDateSchema,
})

export const updateAccomplishmentSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  category: accomplishmentCategorySchema.optional(),
  date: accomplishmentDateSchema.optional(),
})

export function parseListAccomplishmentsQuery(searchParams: URLSearchParams) {
  return listAccomplishmentsQuerySchema.parse({
    year: searchParams.get('year') ?? undefined,
  })
}
