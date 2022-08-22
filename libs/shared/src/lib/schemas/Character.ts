import { isMatch } from 'date-fns';
import { Types } from 'mongoose';
import { z } from 'zod';
import { TDateYYYYMMDD } from '../types';

const DateSchema = z.custom<TDateYYYYMMDD>((val) => typeof val === 'string' && isMatch(val, 'yyyy-MM-dd'));

const LicenseTypeSchema = z.union([
  z.literal('driver'),
  z.literal('weapon'),
  z.literal('fishing'),
  z.literal('hunting'),
]);

const LicenseStatusSchema = z.union([z.literal('active'), z.literal('suspended'), z.literal('expired')]);

const WeaponTypeSchema = z.union([z.literal('pistol'), z.literal('shotgun'), z.literal('rifle')]);

const WarrantStatusSchema = z.union([z.literal('active'), z.literal('historical')]);

const CharacterGenericLicenseSchema = z.object({
  id: z.string(),
  type: LicenseTypeSchema,
  status: LicenseStatusSchema,
  issued: DateSchema,
});

const CharacterWeaponSchema = z.object({
  serial: z.string(),
  type: WeaponTypeSchema,
});

const CharacterRecordSchema = z.object({
  date: DateSchema,
  info: z.string(),
  officer: z.instanceof(Types.ObjectId),
});

export const CharacterCreateSchema = z.object({
  name: z.string().min(2),

  gender: z.enum(['male', 'female', 'non-binary']),

  dob: DateSchema,

  address: z.string(),
});

export const CharacterUnrestrictedUpdateSchema = z.optional(
  z.object({
    name: z.string().min(2).optional(),

    gender: z.enum(['male', 'female', 'non-binary']).optional(),

    dob: DateSchema.optional(),

    address: z.string().optional(),

    caution: z.boolean().optional(),

    cautionInfo: z.string().optional(),

    licenses: z
      .object({
        driver: CharacterGenericLicenseSchema,
        weapon: CharacterGenericLicenseSchema,
        fishing: CharacterGenericLicenseSchema,
        hunting: CharacterGenericLicenseSchema,
      })
      .optional(),

    weapons: z.array(CharacterWeaponSchema).optional(),

    citations: z.array(CharacterRecordSchema).optional(),

    arrests: z.array(CharacterRecordSchema).optional(),

    warrants: z.array(CharacterRecordSchema).optional(),
  }),
);

export const CharacterUpdateBasicsSchema = z.optional(
  z.object({
    name: z.string().min(2).optional(),

    gender: z.enum(['male', 'female', 'non-binary']).optional(),

    dob: DateSchema.optional(),

    address: z.string().optional(),

    licenses: z
      .object({
        driver: CharacterGenericLicenseSchema,
        weapon: CharacterGenericLicenseSchema,
        fishing: CharacterGenericLicenseSchema,
        hunting: CharacterGenericLicenseSchema,
      })
      .optional(),

    weapons: z.array(CharacterWeaponSchema).optional(),
  }),
);

export const CharacterCreateRecordSchema = z.object({
  date: DateSchema,

  info: z.string(),

  officer: z.instanceof(Types.ObjectId),
});

export const CharacterCreateCitationArrestSchema = CharacterCreateRecordSchema.extend({
  location: z.string(),
});

export const CharacterCreateWarrantSchema = CharacterCreateRecordSchema.extend({
  status: WarrantStatusSchema,
});
