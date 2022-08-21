import mongoose from 'mongoose';
import { ICharacter, ICharacterGenericLicense, ICharacterWeapon, ICharacterRecord } from 'interfaces';

const Schema = mongoose.Schema;

const CharacterGenericLicenseSchema = new Schema<ICharacterGenericLicense>({
    id: String,
    type: {
        type: String,
        enum: ['driver', 'weapon', 'fishing', 'hunting']
    },
    status: {
        type: String,
        enum: ['active', 'suspended', 'expired']
    },
    issued: {
        type: String,
        match: /\d{4}-\d{2}-\d{2}/
    }
});

const CharacterWeaponSchema = new Schema<ICharacterWeapon>({
    serial: String,
    type: {
        type: String,
        enum: ['pistol', 'shotgun', 'rifle']
    },
});

const CharacterRecordSchema = new Schema<ICharacterRecord>({
    date: {
        type: String,
        match: /\d{4}-\d{2}-\d{2}/
    },
    info: String,
    officer: Schema.Types.ObjectId
});

export const CharacterSchema = new Schema<ICharacter>({
    owner: Schema.Types.ObjectId,
    name: String,
    gender: {
        type: String,
        enum: ['male', 'female', 'non-binary']
    },
    dob: {
        type: String,
        match: /\d{4}-\d{2}-\d{2}/
    },
    address: String,
    caution: Boolean,
    cautionInfo: String,
    licenses: {
        driver: { type: CharacterGenericLicenseSchema, required: false },
        weapon: { type: CharacterGenericLicenseSchema, required: false },
        fishing: { type: CharacterGenericLicenseSchema, required: false },
        hunting: { type: CharacterGenericLicenseSchema, required: false }
    },
    weapons: [CharacterWeaponSchema],
    citations: [CharacterRecordSchema],
    arrests: [CharacterRecordSchema],
    warrants: [CharacterRecordSchema]
}, { minimize: false });

export const Character = mongoose.model<ICharacter>('Character', CharacterSchema);
