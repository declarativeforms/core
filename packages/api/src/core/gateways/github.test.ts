import { GitHubGateway } from './github';

describe('GitHubGateway', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('uses the repository default branch when ref is omitted', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response('version: 1', {
        headers: { 'content-length': '10' },
        status: 200,
      }),
    );
    const gateway = new GitHubGateway();

    await expect(
      gateway.retrieveYamlFile('example', 'forms', 'contact.yaml'),
    ).resolves.toEqual({ ok: true, text: 'version: 1' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/example/forms/contents/contact.yaml',
      expect.objectContaining({
        headers: expect.not.objectContaining({ Authorization: expect.anything() }),
      }),
    );
  });

  test('encodes an explicit ref and sends a configured token', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response('sections: []', { status: 200 }));
    const gateway = new GitHubGateway();

    await gateway.retrieveYamlFile(
      'example',
      'forms',
      'nested/contact.yml',
      'release/v1',
      'secret-token',
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/example/forms/contents/nested/contact.yml?ref=release%2Fv1',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer secret-token',
        }),
      }),
    );
  });

  test('preserves rate-limit retry information', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response('', {
        headers: {
          'retry-after': '45',
          'x-ratelimit-remaining': '0',
        },
        status: 403,
      }),
    );
    const gateway = new GitHubGateway();

    await expect(
      gateway.retrieveYamlFile('example', 'forms', 'contact.yaml'),
    ).resolves.toEqual({
      ok: false,
      reason: 'rate_limited',
      retryAfter: '45',
    });
  });

  test('does not turn network failures into missing files', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('offline'));
    const gateway = new GitHubGateway();

    await expect(
      gateway.retrieveYamlFile('example', 'forms', 'contact.yaml'),
    ).resolves.toEqual({ ok: false, reason: 'unavailable' });
  });
});
