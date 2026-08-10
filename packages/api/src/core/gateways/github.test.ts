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
});
