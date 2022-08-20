import { Router, Request, Response } from 'express';
import { hash, compare } from 'bcrypt';
import { IAuthenticatedResponse } from '../interfaces';
import { encodeSession, requireAuthentication } from '../util/authentication';
import { Account } from '../models/Account';
import { AccountCreateSchema, AccountLoginSchema } from '../schemas/Account';

export const route = Router();

route.post('/', async (req: Request, res: Response<unknown, IAuthenticatedResponse>) => {
    const validation = await AccountCreateSchema.safeParse(req.body);

    if (validation.success === false) return res.status(400).json({ errors: validation.error.issues }).end();

    const hashedPassword = await hash(validation.data.password, 11);

    const account = new Account({
        email: validation.data.email,
        password: hashedPassword,
        verified: false
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

    return res.json(account);
});

// eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
route.patch('/@me', async (req: Request, res: Response<unknown, IAuthenticatedResponse>) => {});