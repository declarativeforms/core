const REQUIRED_SECRETS = ['API_KEY', 'AUTH_JWT_SECRET'] as const;
const REQUIRED_VALUES = [
  'MONGODB_CONNECTION_STRING',
  'MONGODB_DATABASE_NAME',
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_S3_BUCKET_NAME',
] as const;
const PLACEHOLDER_SENSITIVE_VALUES = [
  'MONGODB_CONNECTION_STRING',
  'AWS_SECRET_ACCESS_KEY',
] as const;

export type GitHubConfig = {
  token?: string;
  trustedRepositories: ReadonlySet<string>;
};

export function assertEnvironment(): void {
  const errors: string[] = [];
  const allowInsecureDevelopment =
    process.env.ALLOW_INSECURE_DEVELOPMENT === 'true' &&
    process.env.NODE_ENV !== 'production';

  for (const name of REQUIRED_VALUES) {
    if (!process.env[name]?.trim()) {
      errors.push(`${name} is required`);
    }
  }

  for (const name of REQUIRED_SECRETS) {
    const value = process.env[name] || '';
    if (
      (!allowInsecureDevelopment && value.length < 32) ||
      (!allowInsecureDevelopment &&
        (value.toLowerCase().includes('replace-with') ||
          value.toLowerCase().includes('example')))
    ) {
      errors.push(
        `${name} must be a non-placeholder value of at least 32 characters`,
      );
    }
  }

  if (!allowInsecureDevelopment) {
    for (const name of PLACEHOLDER_SENSITIVE_VALUES) {
      const value = process.env[name]?.toLowerCase() || '';
      if (value.includes('replace-with') || value.includes('example')) {
        errors.push(`${name} must not contain a placeholder value`);
      }
    }
  }

  if (
    Boolean(process.env.RESEND_API_KEY) !==
    Boolean(process.env.RESEND_FROM_EMAIL)
  ) {
    errors.push(
      'RESEND_API_KEY and RESEND_FROM_EMAIL must be configured together',
    );
  }

  try {
    readGitHubConfig();
  } catch (error) {
    errors.push(
      error instanceof Error
        ? error.message
        : 'GITHUB_TRUSTED_REPOSITORIES is invalid',
    );
  }

  if (errors.length > 0) {
    throw new Error(`Invalid environment:\n- ${errors.join('\n- ')}`);
  }
}

export function readGitHubConfig(): GitHubConfig {
  const trustedRepositories = new Set<string>();

  for (const entry of (
    process.env.GITHUB_TRUSTED_REPOSITORIES || ''
  ).split(',')) {
    const value = entry.trim();
    if (!value) {
      continue;
    }

    const parts = value.split('/');
    if (
      parts.length !== 2 ||
      !/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(parts[0]) ||
      !/^[A-Za-z0-9._-]{1,100}$/.test(parts[1]) ||
      parts[1] === '.' ||
      parts[1] === '..'
    ) {
      throw new Error(
        `GITHUB_TRUSTED_REPOSITORIES entry "${value}" must be owner/repository`,
      );
    }

    trustedRepositories.add(value.toLowerCase());
  }

  return {
    ...(process.env.GITHUB_TOKEN?.trim()
      ? { token: process.env.GITHUB_TOKEN.trim() }
      : {}),
    trustedRepositories,
  };
}
