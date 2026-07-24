import { z } from "zod"

export const validateBodySchema = z
  .object({
    forceRetry: z.boolean().optional().default(false),
  })
  .default({})

export type ValidateBody = z.infer<typeof validateBodySchema>
