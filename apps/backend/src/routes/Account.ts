import { hash, compare } from 'bcrypt';
import { Router, Request, Response } from 'express';
import {
  IAuthenticatedResponse,
  AccountCreateSchema,
  AccountLoginSchema,
  AccountUpdateSchema,
  AccountUpdateFlagsSchema,
  IAccountFlags,
} from '@cad/shared';
import {
  requireAuthentication,
  requireVerified,
  requireAdmin,
  encodeSession,
} from '../middlewares/authentication';
import { Account } from '../models';

export const route = Router();

/**
 * Get all accounts
 * [admin only]
 */
route.get(
  '/accounts',
  requireAuthentication,
  requireVerified,
  requireAdmin,
  async (req: Request, res: Response<unknown, IAuthenticatedResponse>) => {
    const accounts = await Account.find({});

    const filteredAccounts = accounts.map(
      ({ password, __v, ...account }) => account,
    );

    return res.json(filteredAccounts);
  },
);

/**
 * Create an account
 */
route.post(
  '/',
  async (req: Request, res: Response<unknown, IAuthenticatedResponse>) => {
    const validation = AccountCreateSchema.safeParse(req.body);

    if (validation.success === false)
      return res.status(400).json({ errors: validation.error.issues }).end();

    const hashedPassword = await hash(validation.data.password, 11);

    const account = new Account({
      email: validation.data.email,
      password: hashedPassword,
      flags: {
        verified: false,
        leo: false,
        ems: false,
        admin: false,
      },
    });

    await account.save();

    return res.status(201).json({
      id: account._id,
    });
  },
);

/**
 * Log in and obtain a session token
 */
route.post(
  '/login',
  async (req: Request, res: Response<unknown, IAuthenticatedResponse>) => {
    const validation = await AccountLoginSchema.safeParse(req.body);

    if (validation.success === false)
      return res
        .status(400)
        .json({
          errors: validation.error.issues,
        })
        .end();

    const account = await Account.findOne({ email: validation.data.email });
    if (!account)
      return res.status(400).json({ error: 'Invalid email or password' }).end();

    const validPassword = await compare(
      validation.data.password,

      account.password,
    );
    if (validPassword === false)
      return res.status(400).json({ error: 'Invalid email or password' }).end();

    const session = await encodeSession(process.env.JWT_SECRET as string, {
      id: account._id.toString(),
    });

    return res.status(201).json(session);
  },
);

/**
 * Fetch authenticated account details
 */
route.get(
  '/@me',
  requireAuthentication,
  async (req: Request, res: Response<unknown, IAuthenticatedResponse>) => {
    const data = {
      id: res.locals.account._id,
      email: res.locals.account.email,
      flags: res.locals.account.flags,
    };

    return res.json(data);
  },
);

/**
 * Edit the authenticated account
 */
route.patch(
  '/@me',
  requireAuthentication,
  async (req: Request, res: Response<unknown, IAuthenticatedResponse>) => {
    if (
      req.body &&
      Object.keys(req.body).length === 0 &&
      Object.getPrototypeOf(req.body) === Object.prototype
    )
      return res.json({ result: 'No changes saved' });

    const validation = await AccountUpdateSchema.safeParse(req.body);

    if (validation.success === false)
      return res
        .status(400)
        .json({
          errors: validation.error.issues,
        })
        .end();

    const changes = validation.data ?? {};

    // Individual Validation
    if (changes.email && changes.email === res.locals.account.email)
      return res
        .status(400)
        .json({ error: 'Value not changed from current value: email' });

    if (changes.password) {
      const equalToCurrentPassword = await compare(
        changes.password,
        res.locals.account.password,
      );
      if (equalToCurrentPassword === true)
        return res
          .status(400)
          .json({ error: 'Value not changed from current value: password' });

      const hashedPassword = await hash(changes.password, 11);

      changes.password = hashedPassword;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const key in changes)
      (res.locals.account as any)[key] = changes[key as keyof typeof changes];

    await res.locals.account.save();

    return res.json({
      result: `${Object.keys(req.body).length} change(s) saved`,
    });
  },
);

/**
 * Get a specific account
 * [admin only]
 */
route.get(
  '/:accountID',
  requireAuthentication,
  requireVerified,
  requireAdmin,
  async (req: Request, res: Response<unknown, IAuthenticatedResponse>) => {
    const account = await Account.findById(res.locals.session.id);
    if (!account)
      return res.status(404).json({ error: 'Account not found' }).end();

    const data = {
      id: res.locals.account._id,
      email: res.locals.account.email,
      flags: res.locals.account.flags,
    };

    return res.json(data);
  },
);

/**
 * Change account flags
 * [admin only]
 */
route.get(
  '/:accountID/flags',
  requireAuthentication,
  requireVerified,
  requireAdmin,
  async (req: Request, res: Response<unknown, IAuthenticatedResponse>) => {
    const account = await Account.findById(res.locals.session.id);
    if (!account)
      return res.status(404).json({ error: 'Account not found' }).end();

    if (
      req.body &&
      Object.keys(req.body).length === 0 &&
      Object.getPrototypeOf(req.body) === Object.prototype
    )
      return res.json({ result: 'No flags saved' });

    const validation = AccountUpdateFlagsSchema.safeParse(req.body);

    if (validation.success === false)
      return res
        .status(400)
        .json({
          errors: validation.error.issues,
        })
        .end();

    const changes: IAccountFlags = account.flags;

    if (validation.data?.verified) {
      if (validation.data?.verified === changes.verified)
        return res
          .status(400)
          .json({ error: 'Value not changed from current value: verified' });

      changes.verified = validation.data.verified;
    }

    if (validation.data?.leo) {
      if (validation.data?.leo === changes.leo)
        return res
          .status(400)
          .json({ error: 'Value not changed from current value: leo' });

      changes.leo = validation.data.leo;
    }

    if (validation.data?.ems) {
      if (validation.data?.ems === changes.ems)
        return res
          .status(400)
          .json({ error: 'Value not changed from current value: ems' });

      changes.ems = validation.data.ems;
    }

    account.flags = changes;

    await account.save();

    return res.json({ result: 'Flags saved' });
  },
);
