import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire, registerHooks } from 'node:module';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const ts = createRequire(new URL('../api/package.json', import.meta.url))('typescript');
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'next/image') {
      return { shortCircuit: true, url: 'data:text/javascript,export default function Image() { return null; }' };
    }
    if (specifier === '@/lib/utils') {
      return { shortCircuit: true, url: new URL('./src/lib/utils.ts', import.meta.url).href };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.endsWith('/form-logo.component.tsx')) {
      return { shortCircuit: true, format: 'module', source: ts.transpileModule(readFileSync(new URL(url), 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText };
    }
    return nextLoad(url, context);
  },
});
const { FormLogo } = await import('./src/components/declarative-form/scaffolding/form-logo.component.tsx');

test('omitted and invalid heights retain the existing logo layout', () => {
  const url = 'https://example.com/logo.png';
  const original = renderToStaticMarkup(createElement(FormLogo, { logo: url }));
  assert.ok(original.includes('h-20'));
  assert.ok(original.includes('h-14'));
  assert.ok(!original.includes('style='));
  for (const height of [undefined, 56, 31, 121, 80.5, '80', null, NaN, Infinity]) {
    assert.equal(renderToStaticMarkup(createElement(FormLogo, { logo: { image: url, height } })), original);
  }
});

test('custom height fits inside an expanded wrapper without removing caller spacing', () => {
  for (const height of [32, 80, 120]) {
    const markup = renderToStaticMarkup(createElement(FormLogo, { logo: { image: 'https://example.com/logo.png', height }, className: 'mb-6 px-0 pt-0' }));
    assert.ok(markup.includes(`style="height:${height}px"`));
    assert.equal(markup.includes(`style="height:${height + 24}px"`), height > 56);
    assert.ok(markup.includes('max-w-56'));
    assert.ok(markup.includes('mb-6 px-0 pt-0'));
  }
});

test('absent or invalid logos do not reserve space', () => {
  for (const url of [undefined, '', '/logo.png', 'http://example.com/logo.png']) {
    assert.equal(renderToStaticMarkup(createElement(FormLogo, { logo: { image: url, height: 80 } })), '');
  }
});
