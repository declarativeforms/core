import { GitHubGateway } from './github';

describe('GitHubGateway', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('checks that the repository is public', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ private: false }),
      ok: true,
    });
    global.fetch = fetchMock;

    const gateway = new GitHubGateway('github-token');

    await expect(
      gateway.isPublicRepository('acme', 'forms'),
    ).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/acme/forms',
      {
        cache: 'no-store',
        headers: {
          Authorization: 'Bearer github-token',
        },
      },
    );
  });

  it('reads a YAML file with its sha', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        content: Buffer.from('title: Contact').toString('base64'),
        encoding: 'base64',
        sha: 'file-sha',
      }),
      ok: true,
    });
    global.fetch = fetchMock;

    const gateway = new GitHubGateway('github-token');

    await expect(
      gateway.retrieveYamlFile('acme', 'forms', 'contact'),
    ).resolves.toEqual({
      content: 'title: Contact',
      sha: 'file-sha',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/acme/forms/contents/contact.yaml?ref=main',
      {
        cache: 'no-store',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: 'Bearer github-token',
        },
      },
    );
  });

  it('returns null when GitHub denies access to a file', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false });

    const gateway = new GitHubGateway('github-token');

    await expect(
      gateway.retrieveYamlFile('acme', 'forms', 'contact'),
    ).resolves.toBeNull();
  });

  it('writes YAML with the expected sha', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        content: { sha: 'new-file-sha' },
      }),
      ok: true,
    });
    global.fetch = fetchMock;

    const gateway = new GitHubGateway('github-token');

    await expect(
      gateway.createOrUpdateYamlFile(
        'acme',
        'forms',
        'contact',
        'title: Contact',
        'Update form',
        'main',
        'old-file-sha',
      ),
    ).resolves.toEqual({
      content: 'title: Contact',
      sha: 'new-file-sha',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/acme/forms/contents/contact.yaml',
      {
        body: JSON.stringify({
          branch: 'main',
          content: Buffer.from('title: Contact').toString('base64'),
          message: 'Update form',
          sha: 'old-file-sha',
        }),
        cache: 'no-store',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: 'Bearer github-token',
          'Content-Type': 'application/json',
        },
        method: 'PUT',
      },
    );
  });
});
