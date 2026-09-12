import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import test from 'node:test';

const events = [];
globalThis.__analyticsTestEvents = events;

function toModule(source) {
  return `data:text/javascript,${encodeURIComponent(source)}`;
}

const modules = new Map([
  [
    'mixpanel-browser',
    toModule(`export default { init(token) {
      if (token === 'fail') throw new Error('Mixpanel unavailable');
      return {
        track(event) { globalThis.__analyticsTestEvents.push('mixpanel:' + event); },
        disable() { globalThis.__analyticsTestEvents.push('mixpanel:shutdown'); }
      };
    }};`),
  ],
  [
    'posthog-js/dist/module.no-external',
    toModule(`export class PostHog { init(token) {
      if (token === 'fail') throw new Error('PostHog unavailable');
      return {
        capture(event) { globalThis.__analyticsTestEvents.push('posthog:' + event); },
        shutdown() { globalThis.__analyticsTestEvents.push('posthog:shutdown'); return Promise.resolve(); }
      };
    }}`),
  ],
]);

registerHooks({
  resolve(specifier, context, nextResolve) {
    const url = modules.get(specifier);

    return url ? { shortCircuit: true, url } : nextResolve(specifier, context);
  },
});

test('queues analytics until providers load and isolates failures', async (t) => {
  const warnings = [];
  t.mock.method(console, 'warn', (message) => warnings.push(message));

  const analyticsModule = await import('./src/lib/analytics.ts');
  const analytics = analyticsModule.createAnalytics({
    mixpanel: 'mp',
    posthog: 'ph',
  });

  analytics.capture('page_view', {});
  analytics.capture('section_completed', {
    section_id: 'details',
    is_final: false,
  });
  analytics.shutdown();
  analytics.capture('section_completed', {
    section_id: 'ignored',
    is_final: true,
  });

  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(
    events.filter((event) => event.startsWith('mixpanel:')),
    ['mixpanel:page_view', 'mixpanel:section_completed', 'mixpanel:shutdown'],
  );
  assert.deepEqual(
    events.filter((event) => event.startsWith('posthog:')),
    ['posthog:section_completed', 'posthog:shutdown'],
  );

  const failedAnalytics = analyticsModule.createAnalytics({
    mixpanel: 'fail',
    posthog: 'fail',
  });
  failedAnalytics.capture('page_view', {});

  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(warnings, [
    'Unable to initialize Mixpanel analytics.',
    'Unable to initialize PostHog analytics.',
  ]);
});

test('builds theme styles only for valid colors', async () => {
  const themeModule = await import('./src/lib/theme.ts');

  assert.deepEqual(themeModule.buildThemeStyle({ primary: '#fff' }), {
    '--primary': '#fff',
    '--primary-foreground': '#0a0a0a',
    '--ring': '#fff',
  });
  assert.equal(themeModule.buildThemeStyle({ primary: 'abc#' }), undefined);
});
