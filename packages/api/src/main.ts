import cluster from 'cluster';
import { config } from 'dotenv';
import * as os from 'os';
import { startServer } from './server';
import { job } from './job';

config();

if (process.env.JOB) {
  job();
} else {
  if (process.env.CLUSTER) {
    if (cluster.isPrimary) {
      for (let i = 0; i < os.cpus().length; i++) {
        cluster.fork();
      }
    } else {
      startServer();
    }
  } else {
    startServer();
  }
}
