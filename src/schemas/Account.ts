import { z } from 'zod';

export const AccountCreateSchema =  z.object({
    email: z.string()
        .email(),

    password: z.string()
        .min(8)
        .regex(/^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/)
});

export const AccountLoginSchema =  z.object({
    email: z.string()
        .email(),

    password: z.string()
});