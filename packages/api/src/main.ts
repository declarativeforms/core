import cluster from 'cluster';
import { config } from 'dotenv';
import * as os from 'os';
import { job } from './job';
import { startServer } from './server';

config();

if (process.env.JOB) {
  job();
} else if (!process.env.CLUSTER) {
  startServer();
} else if (!cluster.isPrimary) {
  startServer();
} else {
  for (let index = 0; index < os.cpus().length; index += 1) {
    cluster.fork();
  }
}
