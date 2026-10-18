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

const emptyToNull = z
  .string()
  .trim()
  .max(1000)
  .nullable()
  .optional()
  .transform((value) => (value ? value : null));

export const uploadCourseImageSchema = z.object({
  gameType: z.enum(["fotbalgolf", "minigolf", "adventure"]),
  hole: z.number().int().min(1).max(20),
  image: z.string().min(32).max(3_500_000),
});

export const courseHolePatchSchema = z.object({
  gameType: z.enum(["fotbalgolf", "minigolf", "adventure"]),
  hole: z.number().int().min(1).max(20),
  closed: z.boolean().optional(),
  par: z.number().int().min(1).max(8).optional(),
  imageUrl: emptyToNull,
  tip: z
    .string()
    .trim()
    .max(160)
    .nullable()
    .optional()
    .transform((value) => (value ? value : null)),
});

export const adminRoundsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const tvDataSettingsSchema = z.object({
  retentionEnabled: z.boolean(),
  retentionDays: z.number().int().min(1).max(3650),
  runHour: z.number().int().min(0).max(23),
});

export const tvDataPurgeSchema = z.discriminatedUnion("scope", [
  z.object({ scope: z.literal("all") }),
  z.object({ scope: z.literal("today") }),
  z.object({ scope: z.literal("older_than"), days: z.number().int().min(1).max(3650) }),
  z.object({
    scope: z.literal("ids"),
    ids: z.array(z.number().int().positive()).min(1).max(200),
  }),
]);

export type PromoInput = z.infer<typeof promoSchema>;
