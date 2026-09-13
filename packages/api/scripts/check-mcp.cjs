const assert = require('node:assert/strict');
const { generateKeyPairSync, randomBytes } = require('node:crypto');
const fastify = require('fastify');
const Ajv = require('ajv');
const { MongoClient } = require('mongodb');
const { SignJWT } = require('jose');
const engine = require('@declarativeforms/engine');
const { registerMcp } = require('../dist/mcp/server.js');
const {
  FormRepository,
} = require('../dist/core/repositories/form.repository.js');
const {
  OrganizationRepository,
} = require('../dist/core/repositories/organization.repository.js');
const {
  OAuthAccountRepository,
} = require('../dist/core/repositories/oauth-account.repository.js');
const {
  InternalFormService,
} = require('../dist/core/services/internal-form.service.js');
const {
  OrganizationService,
} = require('../dist/core/services/organization.service.js');
const {
  OAuthAccountService,
} = require('../dist/core/services/oauth-account.service.js');

(async () => {
  const mongo = await MongoClient.connect(
    process.env.MCP_TEST_MONGODB_URL || 'mongodb://127.0.0.1:27017',
    { serverSelectionTimeoutMS: 5000 },
  );
  const db = mongo.db(`mcp_check_${randomBytes(8).toString('hex')}`);
  const server = fastify();
  try {
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    Object.assign(process.env, {
      PUBLIC_BASE_URL: 'https://forms.example',
      OAUTH_JWKS: JSON.stringify({
        keys: [
          {
            ...privateKey.export({ format: 'jwk' }),
            kid: 'test',
            alg: 'RS256',
            use: 'sig',
          },
        ],
      }),
    });
    const formRepository = new FormRepository(db);
    const organizationRepository = new OrganizationRepository(db);
    const oauthAccountRepository = new OAuthAccountRepository(db);
    await Promise.all([
      formRepository.ensureIndexes(),
      organizationRepository.ensureIndexes(),
      oauthAccountRepository.ensureIndexes(),
    ]);
    const organizationService = new OrganizationService(organizationRepository);
    const oauthAccountService = new OAuthAccountService(
      oauthAccountRepository,
      organizationService,
    );
    const internalFormService = new InternalFormService(
      formRepository,
      new Ajv({
        allErrors: true,
        logger: false,
        strict: false,
      }).compile(engine.FORM_JSON_SCHEMA),
    );
    await registerMcp(server, {
      organizationService,
      oauthAccountService,
      internalFormService,
    });

    const accounts = {};
    const tokens = {};
    for (const user of ['owner', 'member', 'outsider']) {
      accounts[user] = await oauthAccountService.connectGitHub({
        email_address: `${user}@example.com`,
        subject: user,
      });
      tokens[user] = await new SignJWT({
        client_id: 'test-client',
        scope: 'forms',
      })
        .setProtectedHeader({ alg: 'RS256', kid: 'test', typ: 'at+jwt' })
        .setSubject(accounts[user].id)
        .setAudience('https://forms.example/api/v1/mcp')
        .setIssuer('https://forms.example/api/v1/oauth')
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(privateKey);
    }
    await organizationRepository.insert({
      id: 'shared',
      name: 'Lunch team',
      slug: 'lunch-team',
      tags: [],
      members: [{ email: 'owner@example.com', role: 'admin' }],
      created_by: 'owner@example.com',
      created_at: new Date(),
      updated_at: new Date(),
    });
    let requestId = 0;
    const rpc = async (user, method, params = {}) => {
      const id = ++requestId;
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/mcp',
        headers: {
          authorization: `Bearer ${tokens[user]}`,
          accept: 'application/json, text/event-stream',
          'mcp-protocol-version': '2025-11-25',
        },
        payload: { jsonrpc: '2.0', id, method, params },
      });
      assert.equal(response.statusCode, 200, response.body);
      const body = response.headers['content-type'].startsWith(
        'text/event-stream',
      )
        ? response.body
            .split('\n')
            .filter((line) => line.startsWith('data: '))
            .map((line) => JSON.parse(line.slice(6)))
            .find((message) => message.id === id)
        : response.json();
      assert(body, response.body);
      assert(!body.error, JSON.stringify(body.error));
      return body.result;
    };
    const call = async (user, name, args = {}) =>
      rpc(user, 'tools/call', { name, arguments: args });
    const ok = (result) => {
      assert(!result.isError, JSON.stringify(result));
      assert.deepEqual(
        JSON.parse(result.content[0].text),
        result.structuredContent,
      );
      return result.structuredContent;
    };
    const denied = (result) =>
      assert.equal(result.isError, true, JSON.stringify(result));

    const unauthenticated = await server.inject({
      method: 'POST',
      url: '/api/v1/mcp',
      payload: {},
    });
    assert.equal(unauthenticated.statusCode, 401);
    assert.match(
      unauthenticated.headers['www-authenticate'],
      /oauth-protected-resource/,
    );
    const initialized = await rpc('owner', 'initialize', {
      protocolVersion: '2025-11-25',
      capabilities: {},
      clientInfo: { name: 'mcp-check', version: '1' },
    });
    assert.match(initialized.instructions, /exact instructions/);
    assert.match(initialized.instructions, /plain or minimal/);
    assert.match(initialized.instructions, /follow-up questions/);
    const tools = (await rpc('owner', 'tools/list')).tools;
    const formTools = [
      'list_forms',
      'read_form',
      'create_form',
      'update_form',
      'rename_form',
      'delete_form',
      'list_branches',
      'create_branch',
      'delete_branch',
      'publish_branch',
    ];
    assert.deepEqual(
      tools.map((tool) => tool.name).sort(),
      [...formTools, 'list_organizations', 'add_organization_member'].sort(),
    );
    for (const name of formTools) {
      assert(
        tools.find((tool) => tool.name === name).inputSchema.properties
          .organization_id,
        name,
      );
    }
    const resources = (await rpc('owner', 'resources/list')).resources;
    assert(
      resources.some(
        (resource) => resource.uri === 'declarativeforms://schema',
      ),
    );
    assert(
      resources.some(
        (resource) => resource.uri === 'declarativeforms://authoring-guide',
      ),
    );
    const guide = (
      await rpc('owner', 'resources/read', {
        uri: 'declarativeforms://authoring-guide',
      })
    ).contents[0].text;
    const yaml = guide.match(/```yaml\n([\s\S]*?)```/)[1];
    const schema = engine.parse(yaml);
    const definition = internalFormService.validateDefinition(yaml);
    assert(!Array.isArray(definition), JSON.stringify(definition));
    const compiled = engine.compile(engine.resolve(schema, 'en'), {
      full_name: 'Alex',
      email: 'alex@example.com',
    });
    const rendered = engine.render(compiled, {});
    assert.equal(rendered.section.title, 'Join us for lunch');
    assert(rendered.section.description);
    assert.equal(rendered.start, undefined);
    assert.deepEqual(
      rendered.section.fields.map((field) => field.type),
      ['short_text', 'email'],
    );
    for (const field of rendered.section.fields) {
      assert(field.required);
      assert(engine.validateField(field, '', {}));
    }
    assert(
      engine.validateField(rendered.section.fields[1], 'invalid-email', {}),
    );
    assert.equal(
      engine.validateField(rendered.section.fields[1], 'alex@example.com', {}),
      undefined,
    );
    assert.match(compiled.completion.title, /Alex/);
    assert.deepEqual(compiled.connections, []);

    const organizations = ok(
      await call('owner', 'list_organizations'),
    ).organizations;
    assert.equal(organizations.length, 2);
    assert.deepEqual(
      organizations.find((org) => org.organization_id === 'shared'),
      {
        organization_id: 'shared',
        name: 'Lunch team',
        slug: 'lunch-team',
        role: 'admin',
        is_personal: false,
        is_default: false,
      },
    );
    assert(
      organizations.some(
        (org) =>
          org.organization_id === accounts.owner.organization_id &&
          org.is_default &&
          org.is_personal,
      ),
    );
    assert(
      !ok(await call('member', 'list_organizations')).organizations.some(
        (org) => org.organization_id === 'shared',
      ),
    );
    const personal = ok(
      await call('owner', 'create_form', { yaml, name: 'Personal lunch' }),
    );
    assert.equal(personal.organization_id, accounts.owner.organization_id);
    const form = ok(
      await call('owner', 'create_form', {
        organization_id: 'shared',
        yaml,
        name: 'Lunch RSVP',
      }),
    );
    const target = { organization_id: 'shared', form_id: form.form_id };
    assert.equal(form.organization_id, 'shared');
    assert.equal(form.preview_url, form.public_url);
    assert.equal(form.public_url, `https://forms.example/${form.form_id}`);
    assert.deepEqual(
      ok(await call('owner', 'list_forms')).forms.map((form) => form.form_id),
      [personal.form_id],
    );
    assert.deepEqual(
      ok(
        await call('owner', 'list_forms', { organization_id: 'shared' }),
      ).forms.map((form) => form.form_id),
      [form.form_id],
    );
    assert.equal(ok(await call('owner', 'read_form', target)).yaml, form.yaml);

    const args = { ...target, yaml, name: 'draft', branch: 'draft' };
    for (const tool of formTools) {
      denied(await call('outsider', tool, args));
      denied(
        await call('owner', tool, { ...args, organization_id: 'missing' }),
      );
    }
    for (const tool of formTools.filter(
      (tool) => !['list_forms', 'create_form'].includes(tool),
    )) {
      denied(
        await call('member', tool, {
          ...args,
          organization_id: accounts.member.organization_id,
        }),
      );
    }
    denied(
      await call('member', 'add_organization_member', {
        organization_id: 'shared',
        email: 'other@example.com',
      }),
    );
    denied(
      await call('owner', 'add_organization_member', {
        organization_id: 'shared',
        email: 'invalid',
      }),
    );
    denied(
      await call('owner', 'add_organization_member', {
        organization_id: 'shared',
        email: 'other@example.com',
        role: 'owner',
      }),
    );
    denied(
      await call('owner', 'create_form', {
        organization_id: 'shared',
        yaml: 'sections: [',
      }),
    );
    assert.equal(
      ok(
        await call('owner', 'add_organization_member', {
          organization_id: 'shared',
          email: ' MEMBER@Example.com ',
        }),
      ).member.role,
      'member',
    );
    assert(
      ok(await call('member', 'list_organizations')).organizations.some(
        (org) => org.organization_id === 'shared' && org.role === 'member',
      ),
    );
    denied(
      await call('member', 'add_organization_member', {
        organization_id: 'shared',
        email: 'other@example.com',
      }),
    );
    const before = await organizationRepository.findByIdAndMember(
      'shared',
      'owner@example.com',
    );
    await Promise.all(
      Array.from({ length: 8 }, async () => {
        assert.equal(
          ok(
            await call('owner', 'add_organization_member', {
              organization_id: 'shared',
              email: 'member@example.com',
              role: 'admin',
            }),
          ).member.role,
          'member',
        );
      }),
    );
    const after = await organizationRepository.findByIdAndMember(
      'shared',
      'owner@example.com',
    );
    assert.deepEqual(after.members, before.members);
    assert.equal(after.updated_at.getTime(), before.updated_at.getTime());
    await Promise.all(
      Array.from({ length: 8 }, () =>
        call('owner', 'add_organization_member', {
          organization_id: 'shared',
          email: 'new@example.com',
        }).then(ok),
      ),
    );
    assert.equal(
      (
        await organizationRepository.findByIdAndMember(
          'shared',
          'owner@example.com',
        )
      ).members.filter((member) => member.email === 'new@example.com').length,
      1,
    );
    assert.equal(
      ok(
        await call('owner', 'add_organization_member', {
          organization_id: 'shared',
          email: 'owner@example.com',
        }),
      ).member.role,
      'admin',
    );
    assert.equal(
      ok(
        await call('owner', 'add_organization_member', {
          organization_id: 'shared',
          email: 'outsider@example.com',
          role: 'admin',
        }),
      ).member.role,
      'admin',
    );
    ok(
      await call('outsider', 'add_organization_member', {
        organization_id: 'shared',
        email: 'admin-added@example.com',
      }),
    );

    assert.equal(
      ok(await call('member', 'read_form', target)).form_id,
      form.form_id,
    );
    const directYaml = yaml.replaceAll(
      'Join us for lunch',
      'Lunch with the team',
    );
    const direct = ok(
      await call('member', 'update_form', { ...target, yaml: directYaml }),
    );
    assert.equal(direct.branch, 'main');
    assert(direct.revision > form.revision);
    const draft = ok(
      await call('member', 'create_branch', { ...target, name: 'lunch-copy' }),
    );
    assert.equal(
      new URL(draft.preview_url).searchParams.get('branch'),
      'lunch-copy',
    );
    denied(
      await call('member', 'create_branch', { ...target, name: 'lunch-copy' }),
    );
    denied(
      await call('member', 'delete_branch', { ...target, branch: 'main' }),
    );
    denied(
      await call('member', 'publish_branch', { ...target, branch: 'main' }),
    );
    const draftYaml = yaml.replaceAll('Join us for lunch', 'See you at lunch');
    ok(
      await call('member', 'update_form', {
        ...target,
        branch: 'lunch-copy',
        yaml: draftYaml,
      }),
    );
    assert.equal(
      engine.parse(ok(await call('member', 'read_form', target)).yaml).title,
      'Lunch with the team',
    );
    assert.equal(
      ok(await call('member', 'list_branches', target)).branches.length,
      2,
    );
    const published = ok(
      await call('member', 'publish_branch', {
        ...target,
        branch: 'lunch-copy',
      }),
    );
    assert.equal(published.branch, 'main');
    assert.equal(engine.parse(published.yaml).title, 'See you at lunch');
    assert.equal(
      ok(await call('member', 'list_branches', target)).branches.length,
      2,
    );
    ok(await call('member', 'rename_form', { ...target, name: 'Team lunch' }));
    assert.equal(
      ok(await call('member', 'read_form', { ...target, branch: 'lunch-copy' }))
        .name,
      'Team lunch',
    );
    ok(
      await call('member', 'delete_branch', {
        ...target,
        branch: 'lunch-copy',
      }),
    );
    denied(
      await call('member', 'read_form', { ...target, branch: 'lunch-copy' }),
    );
    const memberForm = ok(
      await call('member', 'create_form', { organization_id: 'shared', yaml }),
    );
    ok(
      await call('member', 'delete_form', {
        organization_id: 'shared',
        form_id: memberForm.form_id,
      }),
    );
    ok(
      await call('member', 'create_branch', {
        ...target,
        name: 'another-draft',
      }),
    );
    ok(await call('member', 'delete_form', target));
    denied(await call('owner', 'read_form', target));
    denied(
      await call('owner', 'read_form', { ...target, branch: 'another-draft' }),
    );
    assert.deepEqual(
      ok(await call('owner', 'list_forms', { organization_id: 'shared' }))
        .forms,
      [],
    );

    await db
      .collection('organizations')
      .updateOne(
        { id: 'shared' },
        { $pull: { members: { email: 'member@example.com' } } },
      );
    for (const tool of formTools) denied(await call('member', tool, args));
    assert(
      !ok(await call('member', 'list_organizations')).organizations.some(
        (org) => org.organization_id === 'shared',
      ),
    );
    await db
      .collection('organizations')
      .updateOne({ id: 'shared' }, { $set: { 'members.0.role': 'member' } });
    denied(
      await call('owner', 'add_organization_member', {
        organization_id: 'shared',
        email: 'final@example.com',
      }),
    );
    assert.equal(
      (
        await db.collection('organizations').findOne({ id: 'shared' })
      ).members.some((member) => member.email === 'final@example.com'),
      false,
    );
    console.log(
      'MCP discovery, RSVP rendering/validation, form and branch lifecycle, organization authorization, and atomic member additions passed.',
    );
  } finally {
    await server.close();
    await db.dropDatabase();
    await mongo.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
