import { z } from "zod";

export const promoSlots = ["ticker", "featured", "gallery"] as const;
export const noticeKinds = ["news", "hot", "happened"] as const;
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

/** undefined = pole v PATCH nebylo; prázdný string = vymazat. Nikdy neměnit undefined na null. */
const optionalText = (max: number) =>
  z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined;
      if (value == null) return null;
      const trimmed = value.trim();
      return trimmed === "" ? null : trimmed.slice(0, max);
    });

export const uploadCourseImageSchema = z.object({
  gameType: z.enum(["fotbalgolf", "minigolf", "adventure"]),
  hole: z.number().int().min(1).max(20),
  image: z.string().min(32).max(3_500_000),
});

export const uploadPromoImageSchema = z.object({
  image: z.string().min(32).max(3_500_000),
});

export const courseHolePatchSchema = z.object({
  gameType: z.enum(["fotbalgolf", "minigolf", "adventure"]),
  hole: z.number().int().min(1).max(20),
  closed: z.boolean().optional(),
  par: z.number().int().min(1).max(8).optional(),
  imageUrl: optionalText(1000),
  tip: optionalText(160),
});

export const adminRoundsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const tvDataSettingsSchema = z
  .object({
    retentionEnabled: z.boolean().optional(),
    retentionDays: z.number().int().min(1).max(3650).optional(),
    runHour: z.number().int().min(0).max(23).optional(),
    tickerSeconds: z.number().int().min(8).max(120).optional(),
  })
  .refine(
    (value) =>
      value.retentionEnabled !== undefined ||
      value.retentionDays !== undefined ||
      value.runHour !== undefined ||
      value.tickerSeconds !== undefined,
    { message: "Nic k uložení" },
  );

export const tvDataPurgeSchema = z.discriminatedUnion("scope", [
  z.object({ scope: z.literal("all") }),
  z.object({ scope: z.literal("today") }),
  z.object({ scope: z.literal("older_than"), days: z.number().int().min(1).max(3650) }),
  z.object({
    scope: z.literal("ids"),
    ids: z.array(z.number().int().positive()).min(1).max(200),
  }),
]);

export const createNoticeSchema = z.object({
  kind: z.enum(noticeKinds),
  title: z.string().trim().min(1).max(80),
  message: z.string().trim().min(1).max(500),
  nicknames: z.array(z.string().trim().min(1).max(32)).min(1).max(500),
});

export const markNoticeReadSchema = z.object({
  email: z.string().email().max(255),
});

export type PromoInput = z.infer<typeof promoSchema>;
