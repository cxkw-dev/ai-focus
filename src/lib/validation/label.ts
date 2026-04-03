import { z } from 'zod'

const labelNameSchema = z.string().trim().min(1, 'Name is required').max(40)
const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color')

export const createLabelSchema = z.object({
  name: labelNameSchema,
  color: hexColorSchema.optional(),
})

export const updateLabelSchema = z.object({
  name: labelNameSchema.optional(),
  color: hexColorSchema.optional(),
})
