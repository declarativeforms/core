import 'dotenv/config';
import { assertEnvironment } from './config';
import { startServer } from './server';

assertEnvironment();

startServer().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
