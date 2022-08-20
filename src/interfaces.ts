export interface IAccount {
    email: string;
    password: string;
    flags: IAccountFlags;
}

export interface IAccountFlags {
    verified: boolean;
    admin: boolean;
}

export interface IAuthenticatedResponse {
    session: ISession;
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

export type IDecodeResult =
    | { type: 'valid'; session: ISession; }
    | { type: 'integrityError'; }
    | { type: 'invalidToken'; };

export type IExpirationStatus = 'active' | 'grace' | 'expired';