import assert from 'node:assert/strict';
import test from 'node:test';
import { copyTextToClipboard } from './src/lib/clipboard.ts';

function clipboard(t, api) {
  const descriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: api });
  t.mock.timers.enable({ apis: ['setTimeout'] });
  t.after(() => {
    if (descriptor) Object.defineProperty(navigator, 'clipboard', descriptor);
    else delete navigator.clipboard;
  });
}

test('starts the write during the click handler and reports success only after completion', async t => {
  let finish;
  let copied;
  clipboard(t, { writeText(text) {
    copied = text;
    return new Promise(resolve => { finish = resolve; });
  } });
  const trace = 'scroll trace\n'.repeat(30000);
  const result = copyTextToClipboard(trace);
  assert.equal(copied, trace);
  finish();
  assert.equal(await result, true);
  t.mock.timers.tick(1500);
});

test('returns a fallback when the clipboard never settles, and ignores late completion', async t => {
  let finish;
  clipboard(t, { writeText: () => new Promise(resolve => { finish = resolve; }) });
  const result = copyTextToClipboard('trace');
  let settled = false;
  result.then(() => { settled = true; });
  t.mock.timers.tick(1499);
  await Promise.resolve();
  assert.equal(settled, false);
  t.mock.timers.tick(1);
  assert.equal(await result, false);
  finish();
  assert.equal(await result, false);
});

test('missing, throwing, and rejected clipboard APIs all allow manual copying', async t => {
  clipboard(t, undefined);
  assert.equal(await copyTextToClipboard('trace'), false);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
    writeText() { throw new Error('Unavailable'); },
  } });
  assert.equal(await copyTextToClipboard('trace'), false);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
    writeText: () => Promise.reject(new Error('Permission denied')),
  } });
  assert.equal(await copyTextToClipboard('trace'), false);
});

test('a retry can succeed after a timed-out write without a late rejection escaping', async t => {
  let reject;
  let writes = 0;
  clipboard(t, { writeText: () => ++writes === 1
    ? new Promise((_resolve, fail) => { reject = fail; })
    : Promise.resolve(),
  });
  const first = copyTextToClipboard('first trace');
  t.mock.timers.tick(1500);
  assert.equal(await first, false);
  assert.equal(await copyTextToClipboard('second trace'), true);
  reject(new Error('Late failure'));
  await new Promise(resolve => setImmediate(resolve));
});
