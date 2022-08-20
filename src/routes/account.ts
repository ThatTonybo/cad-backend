import { Router, Request, Response } from 'express';
import { hash, compare } from 'bcrypt';
import { IAccount, IAuthenticatedResponse } from '../interfaces';
import { encodeSession, requireAuthentication } from '../util/authentication';
import { Account } from '../models/Account';
import { AccountCreateSchema, AccountLoginSchema, AccountUpdateSchema } from '../schemas/Account';

export const route = Router();

route.post('/', async (req: Request, res: Response<unknown, IAuthenticatedResponse>) => {
    const validation = await AccountCreateSchema.safeParse(req.body);

    if (validation.success === false) return res.status(400).json({ errors: validation.error.issues }).end();

    const hashedPassword = await hash(validation.data.password, 11);

    const account = new Account({
        email: validation.data.email,
        password: hashedPassword,
        flags: {
            verified: false,
            admin: false
        }
    });

    await account.save();

    return res.status(201).json({
        id: account._id
    });
});

route.post('/login', async (req: Request, res: Response<unknown, IAuthenticatedResponse>) => {
    const validation = await AccountLoginSchema.safeParse(req.body);
    
    if (validation.success === false) return res.status(400).json({
        errors: validation.error.issues
    }).end();

    const account = await Account.findOne({ email: validation.data.email });
    if (!account) return res.status(400).json({ error: 'Invalid email or password' }).end();

    const validPassword = await compare(validation.data.password, account.password);
    if (validPassword === false) return res.status(400).json({ error: 'Invalid email or password' }).end();

    const session = await encodeSession(process.env.JWT_SECRET, {
        id: account._id.toString()
    });

    return res.status(201).json(session);
});

route.get('/@me', requireAuthentication, async (req: Request, res: Response<unknown, IAuthenticatedResponse>) => {
    const account = await Account.findById(res.locals.session.id);

    const data = {
        id: account._id,
        email: account.email,
        flags: account.flags
    };

    return res.json(data);
});

route.patch('/@me', requireAuthentication, async (req: Request, res: Response<unknown, IAuthenticatedResponse>) => {
    if (req.body && Object.keys(req.body).length === 0 && Object.getPrototypeOf(req.body) === Object.prototype) return res.json({ result: 'No changes saved' });

    const account = await Account.findById(res.locals.session.id);
    const validation = await AccountUpdateSchema.safeParse(req.body);

    if (validation.success === false) return res.status(400).json({
        errors: validation.error.issues
    }).end();

    const changes = validation.data;

    // Individual Validation
    if (changes.email && (changes.email === account.email)) return res.status(400).json({ result: 'Email is equal to current email' });

    if (changes.password) {
        const equalToCurrentPassword = await compare(changes.password, account.password);
        if (equalToCurrentPassword === true) return res.status(400).json({ result: 'Password is equal to current password' });

        const hashedPassword = await hash(validation.data.password, 11);

        changes.password = hashedPassword;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const key in changes) (account as any)[key] = changes[key as keyof typeof changes];

    await account.save();

    return res.json({ result: `${Object.keys(req.body).length} change(s) saved` });
});