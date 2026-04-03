import { Prisma } from '@prisma/client'

export const billingCodeOrderBy = Prisma.validator<
  Prisma.BillingCodeOrderByWithRelationInput[]
>()([{ order: 'asc' }, { createdAt: 'asc' }])

export const labelInclude = Prisma.validator<Prisma.LabelInclude>()({
  billingCodes: { orderBy: billingCodeOrderBy },
})
