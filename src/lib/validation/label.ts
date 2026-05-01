import { z } from 'zod'

const labelNameSchema = z.string().trim().min(1, 'Name is required').max(40)
const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color')
const billingTypeSchema = z
  .string()
  .trim()
  .min(1, 'Type is required')
  .max(40, 'Type must be 40 characters or fewer')
const billingCodeSchema = z
  .string()
  .trim()
  .min(1, 'Code is required')
  .max(120, 'Code must be 120 characters or fewer')
const billingDescriptionSchema = z
  .string()
  .max(200, 'Description must be 200 characters or fewer')

const nullableTrimmedString = (schema: z.ZodString) =>
  z
    .preprocess((value) => {
      if (value === undefined) return undefined
      if (value === null) return null
      if (typeof value !== 'string') return value

      const trimmed = value.trim()
      return trimmed === '' ? null : trimmed
    }, schema.nullable())
    .optional()

const billingCodeEntrySchema = z.object({
  type: billingTypeSchema,
  code: billingCodeSchema,
  description: nullableTrimmedString(billingDescriptionSchema),
  order: z.number().int().min(0),
})

function validateBillingCodes(
  billingCodes: Array<z.infer<typeof billingCodeEntrySchema>>,
  ctx: z.RefinementCtx,
) {
  const seenCodes = new Map<string, number>()

  billingCodes.forEach((billingCode, index) => {
    const normalizedCode = billingCode.code.toLowerCase()
    const duplicateIndex = seenCodes.get(normalizedCode)

    if (duplicateIndex !== undefined) {
      const message = 'Billing codes must be unique within a label'
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['billingCodes', duplicateIndex, 'code'],
        message,
      })
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['billingCodes', index, 'code'],
        message,
      })
      return
    }

    seenCodes.set(normalizedCode, index)
  })
}

export const createLabelSchema = z
  .object({
    name: labelNameSchema,
    color: hexColorSchema.optional(),
    billingCodes: z.array(billingCodeEntrySchema).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.billingCodes) return
    validateBillingCodes(value.billingCodes, ctx)
  })

export const updateLabelSchema = z
  .object({
    name: labelNameSchema.optional(),
    color: hexColorSchema.optional(),
    billingCodes: z.array(billingCodeEntrySchema).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.billingCodes) return
    validateBillingCodes(value.billingCodes, ctx)
  })
