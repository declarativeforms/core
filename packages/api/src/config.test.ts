import { readGitHubConfig } from './config';

describe('GitHub configuration', () => {
  const originalAllowlist = process.env.GITHUB_TRUSTED_REPOSITORIES;
  const originalToken = process.env.GITHUB_TOKEN;

  afterEach(() => {
    restoreEnvironmentValue('GITHUB_TRUSTED_REPOSITORIES', originalAllowlist);
    restoreEnvironmentValue('GITHUB_TOKEN', originalToken);
  });

  test('normalizes exact repository entries and trims the token', () => {
    process.env.GITHUB_TRUSTED_REPOSITORIES =
      ' Example/Forms, acme/internal-forms ';
    process.env.GITHUB_TOKEN = ' test-token ';

    const config = readGitHubConfig();

    expect([...config.trustedRepositories]).toEqual([
      'example/forms',
      'acme/internal-forms',
    ]);
    expect(config.token).toBe('test-token');
  });

  test.each(['owner', 'owner/repository/path', '../repository'])(
    'rejects malformed allowlist entry %s',
    (entry) => {
      process.env.GITHUB_TRUSTED_REPOSITORIES = entry;

      expect(() => readGitHubConfig()).toThrow('must be owner/repository');
    },
  );
});

function restoreEnvironmentValue(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
