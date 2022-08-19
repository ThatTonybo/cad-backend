import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

export const route = Router();

const Account = mongoose.model('Account');

route.get('/create', async (req: Request, res: Response) => {
    const account = new Account({
        email: 'test'
    });

    await account.save();

    return res.json({
        success: true
    });
});