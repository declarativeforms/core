import { OpenAiGateway } from './openai';
test('sends only question context and respondent inputs and handles provider refusal', async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  const previousModel = process.env.OPENAI_MODEL;
  process.env.OPENAI_API_KEY = 'test-key';
  process.env.OPENAI_MODEL = 'test-model';
  const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({
      status: 'completed',
      output: [
        {
          type: 'message',
          content: [
            {
              type: 'output_text',
              text: '{"objectives":[true],"outputs_json":"{}","fields_json":"[]"}',
            },
          ],
        },
      ],
    }),
  } as Response);
  try {
    await new OpenAiGateway().assess(
      {
        title: 'Form',
        sections: [
          {
            id: 'section',
            fields: [{ id: 'email', type: 'email', otp: true }],
          },
        ],
        connections: [{ type: 'webhook', url: 'https://private.example' }],
        authentication: { verifier: 'private-verifier' },
      },
      {
        objectives: ['Understand'],
        properties: { answer: { type: 'string' } },
      },
      { email: 'user@example.com', email_token: 'private-proof' },
      'en',
      [],
    );
    const request = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(request.store).toBe(false);
    expect(request.text.format.strict).toBe(true);
    expect(request.input).toContain('user@example.com');
    expect(request.input).not.toContain('private-proof');
    expect(request.input).not.toContain('private-verifier');
    expect(request.input).not.toContain('private.example');
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'completed',
        output: [{ type: 'message', content: [{ type: 'refusal' }] }],
      }),
    } as Response);
    await expect(
      new OpenAiGateway().assess(
        {},
        { objectives: ['Understand'], properties: {} },
        {},
        'en',
        [],
      ),
    ).rejects.toThrow('complete assessment');
  } finally {
    fetchMock.mockRestore();
    if (previousKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = previousKey;
    }
    if (previousModel === undefined) {
      delete process.env.OPENAI_MODEL;
    } else {
      process.env.OPENAI_MODEL = previousModel;
    }
  }
});
