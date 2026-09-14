import { z } from "zod";

export const promoSlots = ["ticker", "featured"] as const;
export const promoCategories = ["golf", "hopsalkov", "venue"] as const;

const optionalDate = z
  .string()
  .min(10)
  .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date")
  .nullable()
  .optional();

export const loginSchema = z.object({
  password: z.string().min(1).max(200),
});

export const promoSchema = z.object({
  slot: z.enum(promoSlots),
  category: z.enum(promoCategories),
  title: z.string().trim().min(1).max(120),
  message: z.string().trim().min(1).max(280),
  href: z.string().trim().max(500).nullable().optional(),
  imageUrl: z.string().trim().max(1000).nullable().optional(),
  active: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(999).default(0),
  startsAt: optionalDate,
  endsAt: optionalDate,
});

export const promoPatchSchema = promoSchema.partial();

export const hideRoundSchema = z.object({
  hidden: z.boolean(),
});

export const adminRoundsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export type PromoInput = z.infer<typeof promoSchema>;
