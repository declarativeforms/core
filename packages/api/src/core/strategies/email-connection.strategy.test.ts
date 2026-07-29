import type {
  IDeclarativeForm,
  IEmailConnection,
  ISubmission,
} from '@declarativeforms/core';
import { EmailConnectionStrategy } from './email-connection.strategy';

const mockSend = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn(() => ({
    emails: { send: mockSend },
  })),
}));

describe('EmailConnectionStrategy', () => {
  const originalApiKey = process.env.RESEND_API_KEY;
  const originalFrom = process.env.RESEND_FROM_EMAIL;

  beforeEach(() => {
    process.env.RESEND_API_KEY = 'test-key';
    process.env.RESEND_FROM_EMAIL = 'forms@example.com';
    mockSend.mockResolvedValue({ data: { id: 'email-1' }, error: null });
  });

  afterAll(() => {
    setOrDeleteEnvironment('RESEND_API_KEY', originalApiKey);
    setOrDeleteEnvironment('RESEND_FROM_EMAIL', originalFrom);
  });

  test('escapes respondent values interpolated into authored HTML', async () => {
    const connection: IEmailConnection = {
      type: 'email',
      to: 'owner@example.com',
      subject: 'New response',
      body: '<strong>Hello {{data.name}}</strong>',
    };
    const submission: ISubmission = {
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
      data: { name: '<img src=x onerror=alert(1)>' },
      form_id: 'g.source',
      id: 'submission-1',
      metadata: { ip_address: '127.0.0.1', user_agent: 'test' },
      status: 'completed',
    };

    await new EmailConnectionStrategy().handle(
      connection,
      submission,
      { sections: [] } as IDeclarativeForm,
    );

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        html: '<strong>Hello &lt;img src=x onerror=alert(1)&gt;</strong>',
      }),
    );
  });
});

function setOrDeleteEnvironment(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
