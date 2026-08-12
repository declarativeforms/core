import { config } from 'dotenv';
import { disposeContainer, getContainer } from './core';

config();

const abortController = new AbortController();

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => abortController.abort());
}

async function main(): Promise<void> {
  const { jobService } = await getContainer();
  await jobService.run(abortController.signal);
  await disposeContainer();
}

main().catch(async (error) => {
  console.error(error);
  await disposeContainer();
  process.exitCode = 1;
});
