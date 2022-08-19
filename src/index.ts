import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

import { route as AccountsRoute } from './routes';

dotenv.config();

const app = express();

app.use(express.json());

app.use(
  cors({
    optionsSuccessStatus: 200,
  })
);

app.use('/accounts', AccountsRoute);

app.listen(process.env.PORT, async () => {
  await mongoose.connect(process.env.MONGODB_URL!);

  console.log(`Ready on port ${process.env.PORT}`);
});
