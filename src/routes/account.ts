import { Router, Request, Response } from 'express';
import { Account } from '../models/Account';

export const route = Router();

route.get('/create', async (req: Request, res: Response) => {
  const account = new Account({
    email: 'test',
  });

  await account.save();

  return res.json({
    success: true,
  });
});
