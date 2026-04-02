import type { IDeclarativeForm, ISubmission } from '@declarativeforms/types';

jest.mock('@faker-js/faker', () => ({
  faker: {
    string: {
      alphanumeric: () => 'abc12345',
    },
  },
}));

jest.mock('../repositories', () => ({
  findForm: jest.fn(),
  findSubmission: jest.fn(),
  findSubmissions: jest.fn(),
  insertSubmission: jest.fn(),
  replaceSubmission: jest.fn(),
}));

jest.mock('./connections', () => ({
  processConnections: jest.fn(),
}));

jest.mock('./forms', () => ({
  findFormById: jest.fn(),
}));

jest.mock('../gateways', () => ({
  hasRequiredGitHubPermissions: jest.fn(),
}));

jest.mock('./one-time-pin', () => ({
  verifyOneTimePinVerificationToken: jest.fn(),
}));

jest.mock('./turnstile', () => ({
  verifyTurnstileToken: jest.fn(),
}));

import { createOrUpdateSubmission } from './submissions';
import { findSubmission, replaceSubmission, insertSubmission } from '../repositories';
import { processConnections } from './connections';
import { findFormById } from './forms';

const mockFindFormById = findFormById as jest.MockedFunction<typeof findFormById>;
const mockFindSubmission = findSubmission as jest.MockedFunction<typeof findSubmission>;
const mockReplaceSubmission = replaceSubmission as jest.MockedFunction<typeof replaceSubmission>;
const mockInsertSubmission = insertSubmission as jest.MockedFunction<typeof insertSubmission>;
const mockProcessConnections = processConnections as jest.MockedFunction<typeof processConnections>;

const BASE_FORM: IDeclarativeForm = {
  id: 'form-1',
  sections: [
    {
      id: 'section-1',
      fields: [{ id: 'name', type: 'short_text', label: 'Name' }],
    },
  ],
};

const BASE_METADATA = { ipAddress: '127.0.0.1', userAgent: 'test-agent' };

describe('createOrUpdateSubmission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindFormById.mockResolvedValue(BASE_FORM);
    mockProcessConnections.mockResolvedValue(undefined);
    mockReplaceSubmission.mockResolvedValue(undefined);
    mockInsertSubmission.mockResolvedValue(undefined);
  });

  it('should create a new completed submission and process connections', async () => {
    const result = await createOrUpdateSubmission({
      formId: 'form-1',
      data: { name: 'Alice' },
      isPartial: false,
      metadata: BASE_METADATA,
    });

    expect(result).not.toBeNull();
    expect(result!.status).toBe('completed');
    expect(result!.data).toEqual({ name: 'Alice' });
    expect(mockInsertSubmission).toHaveBeenCalledTimes(1);
    expect(mockProcessConnections).toHaveBeenCalledTimes(1);
  });

  it('should create a new partial submission and process connections', async () => {
    const result = await createOrUpdateSubmission({
      formId: 'form-1',
      data: { name: 'Alice' },
      isPartial: true,
      metadata: BASE_METADATA,
    });

    expect(result).not.toBeNull();
    expect(result!.status).toBe('partial');
    expect(mockInsertSubmission).toHaveBeenCalledTimes(1);
    expect(mockProcessConnections).toHaveBeenCalledTimes(1);
  });

  it('should update an existing partial submission to completed', async () => {
    const existing: ISubmission = {
      id: 'sub-1',
      form_id: 'form-1',
      status: 'partial',
      data: { name: 'Alice' },
      metadata: { ip_address: '127.0.0.1', user_agent: 'test' },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    mockFindSubmission.mockResolvedValue(existing);

    const result = await createOrUpdateSubmission({
      formId: 'form-1',
      data: { email: 'alice@example.com' },
      isPartial: false,
      metadata: BASE_METADATA,
      submissionId: 'sub-1',
    });

    expect(result).not.toBeNull();
    expect(result!.status).toBe('completed');
    expect(result!.data).toEqual({ name: 'Alice', email: 'alice@example.com' });
    expect(mockReplaceSubmission).toHaveBeenCalledTimes(1);
    expect(mockProcessConnections).toHaveBeenCalledTimes(1);
  });

  it('should NOT reprocess connections when submission is already completed', async () => {
    const existing: ISubmission = {
      id: 'sub-1',
      form_id: 'form-1',
      status: 'completed',
      data: { name: 'Alice', email: 'alice@example.com' },
      metadata: { ip_address: '127.0.0.1', user_agent: 'test' },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    mockFindSubmission.mockResolvedValue(existing);

    const result = await createOrUpdateSubmission({
      formId: 'form-1',
      data: { name: 'Bob' },
      isPartial: false,
      metadata: BASE_METADATA,
      submissionId: 'sub-1',
    });

    expect(result).not.toBeNull();
    expect(result!.status).toBe('completed');
    expect(result!.data).toEqual({ name: 'Alice', email: 'alice@example.com' });
    expect(mockReplaceSubmission).not.toHaveBeenCalled();
    expect(mockProcessConnections).not.toHaveBeenCalled();
  });

  it('should still allow partial updates to an existing partial submission', async () => {
    const existing: ISubmission = {
      id: 'sub-1',
      form_id: 'form-1',
      status: 'partial',
      data: { name: 'Alice' },
      metadata: { ip_address: '127.0.0.1', user_agent: 'test' },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    mockFindSubmission.mockResolvedValue(existing);

    const result = await createOrUpdateSubmission({
      formId: 'form-1',
      data: { email: 'alice@example.com' },
      isPartial: true,
      metadata: BASE_METADATA,
      submissionId: 'sub-1',
    });

    expect(result).not.toBeNull();
    expect(result!.status).toBe('partial');
    expect(result!.data).toEqual({ name: 'Alice', email: 'alice@example.com' });
    expect(mockReplaceSubmission).toHaveBeenCalledTimes(1);
    expect(mockProcessConnections).toHaveBeenCalledTimes(1);
  });

  it('should return null when form is not found', async () => {
    mockFindFormById.mockResolvedValue(null as any);

    const result = await createOrUpdateSubmission({
      formId: 'nonexistent',
      data: { name: 'Alice' },
      isPartial: false,
      metadata: BASE_METADATA,
    });

    expect(result).toBeNull();
    expect(mockProcessConnections).not.toHaveBeenCalled();
  });

  it('should return null when updating a nonexistent submission', async () => {
    mockFindSubmission.mockResolvedValue(null);

    const result = await createOrUpdateSubmission({
      formId: 'form-1',
      data: { name: 'Alice' },
      isPartial: false,
      metadata: BASE_METADATA,
      submissionId: 'nonexistent',
    });

    expect(result).toBeNull();
    expect(mockProcessConnections).not.toHaveBeenCalled();
  });
});
