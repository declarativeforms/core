import { disposeContainer, getContainer } from './core/';
import type { Container } from './core';

export async function job() {
  const container: Container = await getContainer();

  // TODO: write your code here

  await disposeContainer();
}
