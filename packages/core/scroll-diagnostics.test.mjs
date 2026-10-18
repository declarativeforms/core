import assert from 'node:assert/strict';
import test from 'node:test';
import { readFormScrollSnapshot } from './src/lib/scroll-diagnostics.ts';

test('scroll snapshots distinguish document, visual viewport and element offsets without copying answers or submission IDs', t => {
  const element = {
    tagName: 'FORM',
    value: 'private answer',
    textContent: 'private answer',
    scrollTop: 20,
    scrollHeight: 900,
    clientHeight: 600,
    getBoundingClientRect: () => ({ top: -40, height: 600 }),
    getAttribute: () => null,
  };
  globalThis.window = {
    location: { search: '?step=property&submission_id=private-id&email=private-email' },
    scrollY: 120,
    innerHeight: 600,
    visualViewport: { pageTop: 160, offsetTop: 40, height: 560, scale: 1 },
    getComputedStyle: () => ({ overflowY: 'hidden', position: 'static' }),
  };
  globalThis.document = {
    documentElement: element,
    body: element,
    scrollingElement: { scrollTop: 120 },
    activeElement: element,
    querySelector: () => element,
  };
  t.after(() => { delete globalThis.window; delete globalThis.document; });

  const trace = readFormScrollSnapshot();
  const snapshot = JSON.parse(trace);
  assert.equal(snapshot.step, 'property');
  assert.equal(snapshot.windowY, 120);
  assert.equal(snapshot.documentY, 120);
  assert.equal(snapshot.viewport.offsetTop, 40);
  assert.equal(snapshot.viewport.pageTop, 160);
  assert.equal(snapshot.elements[0].scrollTop, 20);
  assert.equal(snapshot.elements[0].top, -40);
  assert.equal(snapshot.elements[0].overflowY, 'hidden');
  assert.doesNotMatch(trace, /private/);

  window.visualViewport = null;
  document.activeElement = null;
  document.querySelector = () => null;
  const loading = JSON.parse(readFormScrollSnapshot());
  assert.equal(loading.viewport, null);
  assert.deepEqual(loading.elements.slice(2), [null, null, null, null]);
});
