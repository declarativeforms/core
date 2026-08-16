import { GitHubGateway } from './github';

describe('GitHubGateway', () => {
  const originalEnvironment = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env = { ...originalEnvironment };
  });

  afterEach(() => {
    process.env = originalEnvironment;
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('reads public repository files anonymously when no token is configured', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('title: Public form'),
    });
    global.fetch = fetchMock;

    const gateway = new GitHubGateway();

    await expect(
      gateway.retrieveYamlFile('acme', 'forms', 'contact'),
    ).resolves.toBe('title: Public form');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://raw.githubusercontent.com/acme/forms/main/contact.yaml',
      { cache: 'no-store' },
    );
  });

  it('uses the server token with the GitHub Contents API', async () => {
    process.env.GITHUB_TOKEN = 'server-pat';
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('title: Private form'),
    });
    global.fetch = fetchMock;

    const gateway = new GitHubGateway();

    await expect(
      gateway.retrieveYamlFile('acme', 'private-forms', 'sales/contact'),
    ).resolves.toBe('title: Private form');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/acme/private-forms/contents/sales/contact.yaml?ref=main',
      {
        cache: 'no-store',
        headers: {
          Accept: 'application/vnd.github.v3.raw',
          Authorization: 'Bearer server-pat',
        },
      },
    );
  });

  it('returns null when GitHub denies access to a repository', async () => {
    process.env.GITHUB_TOKEN = 'server-pat';
    global.fetch = jest.fn().mockResolvedValue({ ok: false });

    const gateway = new GitHubGateway();

    await expect(
      gateway.retrieveYamlFile('acme', 'private-forms', 'missing'),
    ).resolves.toBeNull();
  });

  it('fetches the requested branch via the raw endpoint', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('title: Branch form'),
    });
    global.fetch = fetchMock;

    await new GitHubGateway().retrieveYamlFile(
      'acme',
      'forms',
      'contact',
      'version-0-0-1',
    );
    expect(fetchMock).toHaveBeenCalledWith(
      'https://raw.githubusercontent.com/acme/forms/version-0-0-1/contact.yaml',
      { cache: 'no-store' },
    );
  });

  it('passes the requested branch as the Contents API ref', async () => {
    process.env.GITHUB_TOKEN = 'server-pat';
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('title: Branch form'),
    });
    global.fetch = fetchMock;

    await new GitHubGateway().retrieveYamlFile(
      'acme',
      'forms',
      'contact',
      'version-0-0-1',
    );
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/acme/forms/contents/contact.yaml?ref=version-0-0-1',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer server-pat',
        }),
      }),
    );
  });

  it('checks that an authenticated repository is public', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ private: false }),
      ok: true,
    });
    global.fetch = fetchMock;

    await expect(
      new GitHubGateway().isPublicRepository('acme', 'forms', 'github-token'),
    ).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/acme/forms',
      {
        cache: 'no-store',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: 'Bearer github-token',
        },
      },
    );
  });

  it('returns empty metadata when a form does not exist yet', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });

    await expect(
      new GitHubGateway().retrieveYamlFileMetadata(
        'acme',
        'forms',
        'sales/contact',
        'draft',
        'github-token',
      ),
    ).resolves.toEqual({});
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/acme/forms/contents/sales/contact.yaml?ref=draft',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer github-token',
        }),
      }),
    );
  });

  it('retrieves the sha required to update an existing form', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ sha: 'old-file-sha' }),
      ok: true,
      status: 200,
    });

    await expect(
      new GitHubGateway().retrieveYamlFileMetadata(
        'acme',
        'forms',
        'contact',
        'main',
        'github-token',
      ),
    ).resolves.toEqual({ sha: 'old-file-sha' });
  });

  it('writes a form with the authenticated GitHub token', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        content: { sha: 'new-file-sha' },
      }),
      ok: true,
    });
    global.fetch = fetchMock;

    await expect(
      new GitHubGateway().createOrUpdateYamlFile(
        'acme',
        'forms',
        'contact',
        'title: Contact',
        'Update form',
        'main',
        'github-token',
        'old-file-sha',
      ),
    ).resolves.toBe('new-file-sha');
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
