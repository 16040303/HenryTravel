import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes';
import { startBookingJobs, stopBookingJobs } from './jobs/releaseHold';
import { startCloudinaryCleanupJob, stopCloudinaryCleanupJob } from './jobs/cloudinaryCleanup';
import { errorHandler } from './middleware/errorHandler';
import { disconnectPrisma } from './lib/prisma';

const app = express();
const port = Number(process.env.PORT) || 3001;
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);
app.use(errorHandler);

const server = app.listen(port, () => {
  console.log(`HenryTravel API is running on http://localhost:${port}`);
  startBookingJobs();
  startCloudinaryCleanupJob();
});

async function shutdown(signal: string) {
  console.log(`${signal} received. Shutting down HenryTravel API...`);
  server.close(async () => {
    stopBookingJobs();
    stopCloudinaryCleanupJob();
    await disconnectPrisma();
    process.exit(0);
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
