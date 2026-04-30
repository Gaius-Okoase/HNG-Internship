import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import type { Response, Request } from 'express';
import profileRoute from './routes/profileRoute.js';
import authRoute from './routes/authRoute.js';
import userRoute from './routes/userRoute.js'
import { errorHandler } from './middleware/errorHandler.js';
import { connectToDb } from './config/db.js';
import { authLimit, profileLimit } from './middleware/rateLimiter.js';
import { apiVersion } from './middleware/apiVersion.js';

const app = express();

dotenv.config();

connectToDb();

const PORT = process.env.PORT || 4500;

app.use(express.json());
app.use(cors({ origin: '*' }));
app.use(morgan('dev'));
app.use(cookieParser());

app.get('/', (_req: Request, res: Response) => {
  res.send("I'm up and ready.");
});
app.use('/api', apiVersion, profileLimit, profileRoute);
app.use('/auth', authLimit, authRoute);
app.use('/api/user', apiVersion, userRoute);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on localhost:${PORT}`);
});
