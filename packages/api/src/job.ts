import { disposeContainer, getContainer } from './core';

export async function job() {
  await getContainer();

  await disposeContainer();
}
