import 'dotenv/config';
import { startServer } from './server';

startServer().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
