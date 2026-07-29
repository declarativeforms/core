import type { ISubmission, IWebhookConnection } from '@declarativeforms/core';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const MAX_REDIRECTS = 3;

export class WebhookConnectionStrategy {
  readonly type = 'webhook';

  public async handle(
    connection: IWebhookConnection,
    submission: ISubmission,
  ): Promise<void> {
    if (!connection.url) {
      return;
    }

    let url = new URL(connection.url);

    for (
      let redirectCount = 0;
      redirectCount <= MAX_REDIRECTS;
      redirectCount += 1
    ) {
      await assertPublicHttpsUrl(url);

      const response = await fetch(url, {
        body: JSON.stringify(submission),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        redirect: 'manual',
        signal: AbortSignal.timeout(10_000),
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location || redirectCount === MAX_REDIRECTS) {
          throw new Error('Webhook returned an invalid redirect.');
        }
        url = new URL(location, url);
        continue;
      }

      if (!response.ok) {
        throw new Error(`Webhook returned HTTP ${response.status}.`);
      }

      return;
    }
  }
}

async function assertPublicHttpsUrl(url: URL): Promise<void> {
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    !url.hostname
  ) {
    throw new Error('Webhook URL must be a public HTTPS URL.');
  }

  const addresses = isIP(url.hostname)
    ? [{ address: url.hostname }]
    : await lookup(url.hostname, { all: true });

  if (
    addresses.length === 0 ||
    addresses.some(({ address }) => !isPublicAddress(address))
  ) {
    throw new Error('Webhook URL must resolve only to public addresses.');
  }
}

function isPublicAddress(address: string): boolean {
  const normalized = address.toLowerCase();

  if (normalized.includes(':')) {
    if (
      normalized === '::' ||
      normalized === '::1' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe8') ||
      normalized.startsWith('fe9') ||
      normalized.startsWith('fea') ||
      normalized.startsWith('feb')
    ) {
      return false;
    }

    const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
    return mapped ? isPublicAddress(mapped) : true;
  }

  const octets = normalized.split('.').map(Number);
  if (
    octets.length !== 4 ||
    octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return false;
  }

  const [a, b] = octets;
  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}
