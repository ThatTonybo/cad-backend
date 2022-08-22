import { Document, Types } from 'mongoose';

export interface IAccount {
    email: string;
    password: string;
    flags: IAccountFlags;
}

export interface IAccountFlags {
    verified: boolean;
    leo: boolean;
    ems: boolean;
    admin: boolean;
}

export interface IAuthenticatedResponse {
    session: ISession;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    account: Document<unknown, any, IAccount> & IAccount & {
        _id: Types.ObjectId;
    };
}

export interface ISession {
    id: string;
    issued: number;
    expires: number;
}

export type IPartialSession = Omit<ISession, 'issued' | 'expires'>;

export interface IEncodeResult {
    token: string,
    expires: number,
    issued: number
}

export type TDecodeResult =
    | { type: 'valid'; session: ISession; }
    | { type: 'integrityError'; }
    | { type: 'invalidToken'; };

export type TExpirationStatus = 'active' | 'grace' | 'expired';

export interface ICharacter {
    owner: Types.ObjectId;
    name: string;
    gender: TGender;
    dob: TDateYYYYMMDD;
    address: string;
    caution: boolean;
    cautionInfo?: string;
    licenses: ICharacterLicenses;
    weapons: ICharacterWeapon[];
    citations: ICharacterCitationArrest[];
    arrests: ICharacterCitationArrest[];
    warrants: ICharacterWarrant[];
}

export type TGender = 'male' | 'female' | 'non-binary';

export type TDateYYYYMMDD = `${number}${number}${number}${number}-${number}${number}-${number}${number}`;

export type TLicenseType = 'driver' | 'weapon' | 'fishing' | 'hunting';

export type TLicenseStatus = 'active' | 'suspended' | 'expired';

export type TWeaponType = 'pistol' | 'shotgun' | 'rifle';

export type TWarrantStatus = 'active' | 'historical';

export interface ICharacterLicenses {
    driver?: ICharacterGenericLicense;
    weapon?: ICharacterGenericLicense;
    fishing?: ICharacterGenericLicense;
    hunting?: ICharacterGenericLicense;
}

export interface ICharacterGenericLicense {
    id: string;
    type: TLicenseType;
    status: TLicenseStatus; 
    issued: TDateYYYYMMDD;
}

export interface ICharacterWeapon {
    serial: string;
    type: TWeaponType;
}

export interface ICharacterRecord {
    date: TDateYYYYMMDD;
    info: string;
    officer: Types.ObjectId;
}

export interface ICharacterCitationArrest extends ICharacterRecord {
    location: string;
}

export interface ICharacterWarrant extends ICharacterRecord {
    status: TWarrantStatus;
}