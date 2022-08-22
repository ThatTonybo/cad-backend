import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';

import { AccountsRoute, CharactersRoute } from './routes';

const app = express();

app
  .use(express.json())
  .use(helmet())
  .use(
    cors({
      optionsSuccessStatus: 200,
    }),
  );

app.use('/accounts', AccountsRoute);
app.use('/characters', CharactersRoute);

const server = app.listen(process.env.PORT, async () => {
  await mongoose.connect(process.env.MONGODB_URL!);

  console.log(`Ready on port ${process.env.PORT}`);
});

server.on('error', console.error);
