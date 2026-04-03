import { z } from 'zod'

const personNameSchema = z.string().trim().min(1, 'Name is required').max(100)
const personEmailSchema = z
  .string()
  .trim()
  .email('Invalid email address')
  .max(200)
  .transform((email) => email.toLowerCase())

export const createPersonSchema = z.object({
  name: personNameSchema,
  email: personEmailSchema,
})

export const updatePersonSchema = z.object({
  name: personNameSchema.optional(),
  email: personEmailSchema.optional(),
})
