import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import test from 'node:test';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'server-only') {
      return { shortCircuit: true, url: 'data:text/javascript,export {}' };
    }

    if (specifier === '@/i18n/server') {
      return {
        shortCircuit: true,
        url: 'data:text/javascript,export async function resolveRequestLocale() { return "en"; }',
      };
    }

    if (specifier === './strip-html') {
      return nextResolve('./strip-html.ts', context);
    }

    return nextResolve(specifier, context);
  },
});

const formMetadata = await import('./src/lib/form-metadata.ts');

test('form routes use independent image overrides and retain defaults', async (t) => {
  for (const target of [
    { id: 'form-id', branch: 'preview' },
    {
      owner: 'owner',
      repository: 'forms',
      path: 'folder/example',
      branch: 'preview',
    },
  ]) {
    for (const theme of [
      undefined,
      { icon: 'https://example.com/favicon.png' },
    ]) {
      for (const open_graph of [
        undefined,
        {},
        { image: 'https://example.com/social-preview.png' },
      ]) {
        const fetchMock = t.mock.method(globalThis, 'fetch', async (url) => {
          const request = new URL(url);
          assert.equal(
            request.pathname,
            'id' in target
              ? '/api/v1/forms/form-id'
              : '/api/v1/forms/owner/forms/folder/example',
          );
          assert.equal(request.searchParams.get('branch'), 'preview');

          return Response.json({
            id: 'form-id',
            title: { en: 'Example', de: 'Beispiel' },
            description: 'Description',
            theme,
            open_graph,
          });
        });
        const metadata = await formMetadata.buildFormMetadata(target, 'de');
        assert.deepEqual(
          metadata.icons,
          theme ? { icon: theme.icon } : undefined,
        );
        const images = [open_graph?.image ?? '/form-id/opengraph-image'];
        assert.deepEqual(metadata.openGraph.images, images);
        assert.deepEqual(metadata.twitter.images, images);
        assert.equal(metadata.twitter.card, 'summary_large_image');
        assert.equal(metadata.title, 'Beispiel');
        assert.equal(metadata.description, 'Description');
        fetchMock.mock.restore();
      }
    }
  }
});

test('image overrides do not require a title or server-assigned ID', async (t) => {
  t.mock.method(globalThis, 'fetch', async () =>
    Response.json({
      theme: { icon: 'https://example.com/favicon.png' },
      open_graph: { image: 'https://example.com/social-preview.png' },
    }),
  );
  const metadata = await formMetadata.buildFormMetadata({
    owner: 'owner',
    repository: 'forms',
    path: 'example',
  });
  assert.deepEqual(metadata.icons, { icon: 'https://example.com/favicon.png' });
  assert.deepEqual(metadata.openGraph.images, [
    'https://example.com/social-preview.png',
  ]);
  assert.deepEqual(metadata.twitter.images, metadata.openGraph.images);
});

test('missing forms keep their fallback and dependency failures propagate', async (t) => {
  const fetchMock = t.mock.method(
    globalThis,
    'fetch',
    async () => new Response(null, { status: 404 }),
  );
  assert.deepEqual(await formMetadata.buildFormMetadata({ id: 'missing' }), {
    openGraph: { images: ['/missing/opengraph-image'] },
  });
  assert.deepEqual(
    await formMetadata.buildFormMetadata({
      owner: 'owner',
      repository: 'forms',
      path: 'missing',
    }),
    {},
  );
  fetchMock.mock.mockImplementation(
    async () => new Response(null, { status: 503 }),
  );
  await assert.rejects(
    formMetadata.buildFormMetadata({ id: 'unavailable' }),
    /Could not load form: 503/,
  );
});
