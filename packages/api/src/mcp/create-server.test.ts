import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { FormService } from '../core';
import { createDeclarativeFormsServer } from './create-server';

describe('createDeclarativeFormsServer', () => {
  const formService = {
    findSource: jest.fn(),
    publish: jest.fn(),
  } as unknown as FormService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exposes the schema, reads a form, and delegates publishing', async () => {
    const yaml = [
      'version: 1',
      'title: Contact',
      'sections:',
      '  - id: contact',
      '    fields: []',
    ].join('\n');
    jest.mocked(formService.findSource).mockResolvedValue({
      branch: 'main',
      file: 'contact',
      owner: 'acme',
      repository: 'forms',
      url: 'https://frms.dev/acme/forms/contact',
      yaml,
    });
    jest.mocked(formService.publish).mockResolvedValue({
      branch: 'main',
      file: 'contact',
      owner: 'acme',
      repository: 'forms',
      sha: 'new-sha',
      url: 'https://frms.dev/acme/forms/contact',
    });

    const server = createDeclarativeFormsServer(
      formService,
      'github-access-token',
    );
    const client = new Client({ name: 'test-client', version: '1.0.0' });
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();

    await server.connect(serverTransport);
    await client.connect(clientTransport);

    try {
      const tools = await client.listTools();
      const schema = await client.callTool({ name: 'get_form_schema' });
      const form = await client.callTool({
        arguments: {
          file: 'contact',
          owner: 'acme',
          repository: 'forms',
        },
        name: 'get_form',
      });
      const published = await client.callTool({
        arguments: {
          file: 'contact',
          owner: 'acme',
          repository: 'forms',
          yaml,
        },
        name: 'publish_form',
      });

      expect(tools.tools.map((tool) => tool.name)).toEqual([
        'get_form_schema',
        'get_form',
        'publish_form',
      ]);
      expect(schema.structuredContent).toMatchObject({
        documentation: expect.stringContaining('SCHEMA.md'),
      });
      expect(form.structuredContent).toMatchObject({ yaml });
      expect(published.structuredContent).toMatchObject({ sha: 'new-sha' });
      expect(formService.findSource).toHaveBeenCalledWith(
        'acme',
        'forms',
        'contact',
        'main',
      );
      expect(formService.publish).toHaveBeenCalledWith(
        'acme',
        'forms',
        'contact',
        yaml,
        'github-access-token',
        'main',
        undefined,
      );
    } finally {
      await client.close();
      await server.close();
    }
  });
});
