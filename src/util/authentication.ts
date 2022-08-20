import { Request, Response, NextFunction } from 'express';
import { encode, decode, TAlgorithm } from 'jwt-simple';
import { IAuthenticatedResponse, ISession, IPartialSession, IEncodeResult, IDecodeResult, IExpirationStatus } from '../interfaces';

export const requireAuthentication = async (req: Request, res: Response<unknown, IAuthenticatedResponse>, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: 'Missing \'Authorization\' header' });
    if (!header.startsWith('Bearer ')) return res.status(401).json({ error: 'Authentication token must be a Bearer token' });

    const decodedSession: IDecodeResult = await decodeSession(process.env.JWT_SECRET, header.split(' ')[1]);
    if (decodedSession.type === 'integrityError' || decodedSession.type === 'invalidToken') return res.status(401).json({ error: 'Invalid authentication token' }).end();

    const expiration: IExpirationStatus = await checkSessionExpirationStatus(decodedSession.session);
    if (expiration === 'expired') return res.status(401).json({ error: 'Expired authentication token' }).end();

    let session: ISession;

    if (expiration === 'grace') {
        const { token, expires, issued } = await encodeSession(process.env.JWT_SECRET, decodedSession.session);

        session = {
            ...decodedSession.session,
            expires: expires,
            issued: issued
        };

        // If this header is present in a response from a protected route, start using the new token
        res.setHeader('X-Authorization-Refresh', token);
    } else session = decodedSession.session;

    res.locals.session = session;

    return next();
};

export const encodeSession = async (key: string, partialSession: IPartialSession): Promise<IEncodeResult> => {
    const algorithm: TAlgorithm = 'HS512';
    const issued = Date.now();
    const expires = issued + (15 * 60 * 1000);

    const session: ISession = {
        ...partialSession,
        issued: issued,
        expires: expires
    };

    return {
        token: encode(session, key, algorithm),
        issued: issued,
        expires: expires
    };
};

export const decodeSession = async (key: string, token: string): Promise<IDecodeResult> => {
    const algorithm: TAlgorithm = 'HS512';

    let result: ISession;

    try {
        result = await decode(token, key, false, algorithm);
    } catch (err) {
        const error: Error = err;

        if (error.message === 'No token supplied' || error.message === 'Not enough or too many segments') return { type: 'invalidToken' };
        if (error.message === 'Signature verification failed' || error.message === 'Algorithm not supported') return { type: 'integrityError' };
        if (error.message.indexOf('Unexpected token') === 0) return { type: 'invalidToken' };

        throw error;
    }

    return {
        type: 'valid',
        session: result
    };
};

export const checkSessionExpirationStatus = async (session: ISession): Promise<IExpirationStatus> => {
    const now = Date.now();
    
    if (session.expires > now) return 'active';

    const expiration = session.expires + (1 * 60 * 60 * 1000);
    if (expiration > now) return 'grace';

    return 'expired';
};