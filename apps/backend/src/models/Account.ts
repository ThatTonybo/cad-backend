import mongoose from 'mongoose';
import { IAccount } from '@cad/shared';

const Schema = mongoose.Schema;

export const AccountSchema = new Schema<IAccount>({
  email: String,
  password: String,
  flags: {
    verified: Boolean,
    leo: Boolean,
    ems: Boolean,
    admin: Boolean
  }
});

export const Account = mongoose.model<IAccount>('Account', AccountSchema);
