import { z } from "zod";

export const customerIdParamSchema = z.object({
  id: z.string().trim().min(1),
});

export const upsertCustomerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z
    .string()
    .trim()
    .transform((value) => value.replace(/\D/g, ""))
    .pipe(z.string().min(0).max(25))
    .optional()
    .default(""),
  address: z.string().trim().max(300).optional().default(""),
  openingBalance: z.coerce.number().default(0),
  note: z.string().trim().max(200).optional().default(""),
});

export const customerQuerySchema = z.object({
  query: z.string().trim().optional().default(""),
});