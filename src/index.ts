import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';

import { route as AccountsRoute } from './routes/Account';
import { route as CharactersRoute } from './routes/Character';

dotenv.config();

const app = express();

app.use(express.json());
app.use(helmet());

app.use(
  cors({
    optionsSuccessStatus: 200,
  })
);

app.use('/accounts', AccountsRoute);
app.use('/characters', CharactersRoute);

app.listen(process.env.PORT, async () => {
  await mongoose.connect(process.env.MONGODB_URL!);

  console.log(`Ready on port ${process.env.PORT}`);
});
