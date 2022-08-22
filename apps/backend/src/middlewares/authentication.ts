import { Request, Response, NextFunction } from 'express';
import { encode, decode, TAlgorithm } from 'jwt-simple';
import {
  IAuthenticatedResponse,
  TDecodeResult,
  TExpirationStatus,
  ISession,
  IPartialSession,
  IEncodeResult
} from '@cad/shared';
import { Account } from '../models';

// Middleware
export const requireAuthentication = async (
  req: Request,
  res: Response<unknown, IAuthenticatedResponse>,
  next: NextFunction
) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Missing 'Authorization' header" });
  if (!header.startsWith('Bearer ')) return res.status(401).json({ error: 'Session token must be a Bearer token' });

  const decodedSession: TDecodeResult = await decodeSession(process.env.JWT_SECRET!, header.split(' ')[1]);
  if (decodedSession.type === 'integrityError' || decodedSession.type === 'invalidToken')
    return res.status(401).json({ error: 'Invalid session token' }).end();

  const expiration: TExpirationStatus = await checkSessionExpirationStatus(decodedSession.session);
  if (expiration === 'expired') return res.status(401).json({ error: 'Expired session token' }).end();

  let session: ISession;

  if (expiration === 'grace') {
    const { token, expires, issued } = await encodeSession(process.env.JWT_SECRET!, decodedSession.session);

    session = {
      ...decodedSession.session,
      expires: expires,
      issued: issued
    };

    // If this header is present in a response from a protected route, start using the new token
    res.setHeader('X-Authorization-Refresh', token);
  } else session = decodedSession.session;

  const account = await Account.findById(session.id);
  if (!account) return res.status(401).json({ error: 'Associated account not found' }).end();

  res.locals.session = session;

  res.locals.account = account;

  return next();
};

export const requireVerified = async (
  req: Request,
  res: Response<unknown, IAuthenticatedResponse>,
  next: NextFunction
) => {
  if (res.locals.account.flags.verified === false) return res.status(403).json({ error: 'Account not verified' });

  return next();
};

export const requireLEO = async (req: Request, res: Response<unknown, IAuthenticatedResponse>, next: NextFunction) => {
  if (res.locals.account.flags.leo === false || res.locals.account.flags.admin === false)
    return res.status(403).json({ error: 'Invalid authorization' });

  return next();
};

export const requireAdmin = async (
  req: Request,
  res: Response<unknown, IAuthenticatedResponse>,
  next: NextFunction
) => {
  if (res.locals.account.flags.admin === false) return res.status(403).json({ error: 'Invalid authorization' });

  return next();
};

// Functions
export const encodeSession = async (key: string, partialSession: IPartialSession): Promise<IEncodeResult> => {
  const algorithm: TAlgorithm = 'HS512';
  const issued = Date.now();
  const expires = issued + 15 * 60 * 1000;

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

export const decodeSession = async (key: string, token: string): Promise<TDecodeResult> => {
  const algorithm: TAlgorithm = 'HS512';

  let result: ISession;

  try {
    result = await decode(token, key, false, algorithm);
  } catch (err) {
    const error: Error = err as Error;

    if (error.message === 'No token supplied' || error.message === 'Not enough or too many segments')
      return { type: 'invalidToken' };
    if (error.message === 'Signature verification failed' || error.message === 'Algorithm not supported')
      return { type: 'integrityError' };
    if (error.message.indexOf('Unexpected token') === 0) return { type: 'invalidToken' };

    throw error;
  }

  return {
    type: 'valid',
    session: result
  };
};

export const checkSessionExpirationStatus = async (session: ISession): Promise<TExpirationStatus> => {
  const now = Date.now();

  if (session.expires > now) return 'active';

  const expiration = session.expires + 1 * 60 * 60 * 1000;
  if (expiration > now) return 'grace';

  return 'expired';
};
