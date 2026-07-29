export type GitHubFileResult =
  | { ok: true; text: string }
  | {
      ok: false;
      reason:
        | 'not_found'
        | 'rate_limited'
        | 'too_large'
        | 'unauthorized'
        | 'unavailable';
      retryAfter?: string;
    };

const MAX_SOURCE_BYTES = 1024 * 1024;

export class GitHubGateway {
  private readonly cache = new Map<
    string,
    { expiresAt: number; value: string }
  >();

  public async retrieveYamlFile(
    owner: string,
    repository: string,
    file: string,
    ref?: string,
    token?: string,
  ): Promise<GitHubFileResult> {
    const yamlFile = /\.ya?ml$/i.test(file) ? file : `${file}.yaml`;
    const yamlPath = yamlFile.split('/').map(encodeURIComponent).join('/');
    const query = ref ? `?ref=${encodeURIComponent(ref)}` : '';
    const cacheKey = [
      owner.toLowerCase(),
      repository.toLowerCase(),
      ref || 'default',
      yamlPath,
      token ? 'trusted' : 'public',
    ].join(':');
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return { ok: true, text: cached.value };
    }

    let response: Response;
    try {
      response = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/contents/${yamlPath}${query}`,
        {
          cache: 'no-store',
          headers: {
            Accept: 'application/vnd.github.raw+json',
            'User-Agent': 'Declarative-Forms',
            'X-GitHub-Api-Version': '2022-11-28',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: AbortSignal.timeout(10_000),
        },
      );
    } catch {
      return { ok: false, reason: 'unavailable' };
    }

    if (response.status === 404) {
      return { ok: false, reason: 'not_found' };
    }

    if (response.status === 401) {
      return { ok: false, reason: 'unauthorized' };
    }

    if (
      response.status === 429 ||
      (response.status === 403 &&
        response.headers.get('x-ratelimit-remaining') === '0')
    ) {
      return {
        ok: false,
        reason: 'rate_limited',
        retryAfter:
          response.headers.get('retry-after') ||
          getRateLimitRetryAfter(response.headers.get('x-ratelimit-reset')),
      };
    }

    if (response.status === 403) {
      return { ok: false, reason: 'unauthorized' };
    }

    if (!response.ok) {
      return { ok: false, reason: 'unavailable' };
    }

    const contentLength = Number(response.headers.get('content-length'));
    if (Number.isFinite(contentLength) && contentLength > MAX_SOURCE_BYTES) {
      return { ok: false, reason: 'too_large' };
    }

    const text = await response.text();
    if (Buffer.byteLength(text, 'utf8') > MAX_SOURCE_BYTES) {
      return { ok: false, reason: 'too_large' };
    }

    this.cache.set(cacheKey, {
      expiresAt: Date.now() + 30_000,
      value: text,
    });

    return { ok: true, text };
  }
}

function getRateLimitRetryAfter(resetAt: string | null): string | undefined {
  const resetSeconds = Number(resetAt);
  if (!Number.isFinite(resetSeconds)) {
    return undefined;
  }

  return String(Math.max(1, Math.ceil(resetSeconds - Date.now() / 1000)));
}
