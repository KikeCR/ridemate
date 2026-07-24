import { z } from "zod"

export const detailsBodySchema = z.object({
  companyName: z.string().trim().min(1, "companyName is required"),
  accountId: z.string().trim().min(1, "accountId is required"),
  apiKey: z.string().trim().min(1, "apiKey is required"),
})

export type DetailsBody = z.infer<typeof detailsBodySchema>
