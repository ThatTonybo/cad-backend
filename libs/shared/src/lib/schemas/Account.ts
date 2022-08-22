import { z } from 'zod';

const AccountFlagsSchema = z.object({
  verified: z.boolean(),
  leo: z.boolean(),
  ems: z.boolean(),
  admin: z.boolean(),
});

export const AccountCreateSchema = z.object({
  email: z.string().email(),

  password: z
    .string()
    .min(8)
    .regex(/^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/),
});

export const AccountLoginSchema = z.object({
  email: z.string().email(),

  password: z.string(),
});

export const AccountUpdateSchema = z.optional(
  z.object({
    email: z.string().email().optional(),

    password: z
      .string()
      .min(8)
      .regex(/^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/)
      .optional(),
  }),
);

export const AccountUpdateFlagsSchema = z.optional(
  AccountFlagsSchema.omit({ admin: true }),
);
