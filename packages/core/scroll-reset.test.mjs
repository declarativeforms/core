import assert from 'node:assert/strict';
import { getEventListeners } from 'node:events';
import test from 'node:test';
import { resetWindowScroll } from './src/lib/scroll-reset.ts';

function browser(t, initialY = 128) {
  const calls = [];
  globalThis.window = Object.assign(new EventTarget(), {
    scrollX: 0,
    scrollY: initialY,
    scrollTo(options) {
      calls.push(options);
      this.scrollX = options.left;
      this.scrollY = Math.max(0, options.top);
      this.dispatchEvent(new Event('scroll'));
    },
  });
  t.mock.timers.enable({ apis: ['setTimeout'] });
  t.after(() => { delete globalThis.window; });
  return calls;
}

function nativeScroll(top) {
  window.scrollY = top;
  window.dispatchEvent(new Event('scroll'));
}

function assertNoListeners() {
  for (const event of ['scroll', 'pointerdown', 'touchstart', 'wheel', 'keydown', 'focusin']) {
    assert.equal(getEventListeners(window, event).length, 0, event);
  }
}

test('forces a clamped browser request even when the reported scroll position is already zero', t => {
  browser(t, 0);
  let displayedY = 108;
  const scrollTo = window.scrollTo;
  window.scrollTo = options => {
    if (options.left === 0 && options.top === 0 && window.scrollY === 0) {
      return;
    }

    scrollTo.call(window, options);
    displayedY = window.scrollY;
  };

  const cleanup = resetWindowScroll();
  assert.equal(window.scrollY, 0);
  assert.equal(displayedY, 0);
  cleanup();
  assertNoListeners();
});

test('corrects the recorded native rebound after the initial scroll already succeeded', t => {
  const calls = browser(t);
  const cleanup = resetWindowScroll();
  assert.equal(window.scrollY, 0);

  setTimeout(() => nativeScroll(108), 41);
  t.mock.timers.tick(41);
  assert.equal(window.scrollY, 0);
  assert.equal(calls.length, 2);
  assert.ok(calls.every(options => options.behavior === 'instant'));

  t.mock.timers.tick(459);
  assert.equal(calls.length, 2);
  assertNoListeners();
  nativeScroll(108);
  assert.equal(window.scrollY, 108);
  cleanup();
});

test('protects a transition that starts at the top and does not scroll again without a rebound', t => {
  const calls = browser(t, 0);
  resetWindowScroll();
  t.mock.timers.tick(40);
  nativeScroll(108);
  assert.equal(window.scrollY, 0);
  t.mock.timers.tick(460);
  assert.equal(calls.length, 2);
  assertNoListeners();
});

for (const event of ['pointerdown', 'touchstart', 'wheel', 'keydown', 'focusin']) {
  test(`hands scrolling back immediately on ${event}`, t => {
    const calls = browser(t);
    resetWindowScroll();
    t.mock.timers.tick(20);
    window.dispatchEvent(new Event(event));
    nativeScroll(108);
    assert.equal(window.scrollY, 108);
    t.mock.timers.tick(500);
    assert.equal(calls.length, 1);
    assertNoListeners();
  });
}

test('cleanup cancels a pending reset before the next section or unmount', t => {
  const calls = browser(t);
  const cleanup = resetWindowScroll();
  cleanup();
  cleanup();
  nativeScroll(108);
  t.mock.timers.tick(500);
  assert.equal(window.scrollY, 108);
  assert.equal(calls.length, 1);
  assertNoListeners();
});
