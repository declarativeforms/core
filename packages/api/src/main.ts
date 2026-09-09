import { config } from 'dotenv';
import cluster from 'node:cluster';
import * as os from 'node:os';
import { startServer } from './server';

config();

if (!process.env.CLUSTER) {
  startServer();
} else if (!cluster.isPrimary) {
  startServer();
} else {
  for (let index = 0; index < os.cpus().length; index += 1) {
    cluster.fork();
  }
}
