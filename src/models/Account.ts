import mongoose from 'mongoose';

const Schema = mongoose.Schema;

export interface IAccount {
  email: string;
}

export const AccountSchema = new Schema<IAccount>({
  email: String,
});

export const Account = mongoose.model<IAccount>('Account', AccountSchema);
