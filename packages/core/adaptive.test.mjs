import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire, registerHooks } from 'node:module';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import Ajv from 'ajv';
import { FORM_JSON_SCHEMA, compile, parse, render, resolve, serialize } from '@declarativeforms/engine';

const ts = createRequire(new URL('../api/package.json', import.meta.url))('typescript');

registerHooks({
  resolve(specifier, context, nextResolve) {
    const source = context.parentURL?.includes('/declarative-form/');
    if (specifier === 'react' && source) {
      return { shortCircuit: true, url: `data:text/javascript,${encodeURIComponent(`
        const equal = (a, b) => a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
        export function useState(initial) {
          const h = globalThis.hookHarness;
          const slot = h.slots[h.index] ??= { value: typeof initial === 'function' ? initial() : initial };
          h.index++;
          return [slot.value, value => { slot.value = typeof value === 'function' ? value(slot.value) : value; h.dirty = true; }];
        }
        export function useRef(initial) { return useState({ current: initial })[0]; }
        export function useCallback(fn) { return fn; }
        export function useMemo(fn, deps) {
          const slot = useRef({});
          if (!equal(slot.current.deps, deps)) { slot.current = { value: fn(), deps }; }
          return slot.current.value;
        }
        export function useEffect(fn, deps) {
          const h = globalThis.hookHarness;
          const slot = useRef({});
          if (!equal(slot.current.deps, deps)) {
            slot.current.deps = deps;
            h.effects.push(() => { slot.current.cleanup?.(); slot.current.setup = fn; slot.current.cleanup = fn(); });
          }
        }
        export function useEffectEvent(fn) {
          const slot = useRef(fn);
          slot.current = fn;
          return (...args) => slot.current(...args);
        }
      `)}` };
    }
    const stubs = {
      '@/components/ui': "export const Button = 'button'; export const CardContent = 'div'; export const Skeleton = 'div';",
      '@/i18n': "export function useI18n() { return { t: key => key }; }",
      './section.component': "export const DeclarativeFormSection = 'section';",
      './start.component': "export const DeclarativeFormStart = 'start';",
    };
    if (source && stubs[specifier]) {
      return { shortCircuit: true, url: `data:text/javascript,${encodeURIComponent(stubs[specifier])}` };
    }
    if (source && specifier === '@/components/declarative-form/supporting') {
      return { shortCircuit: true, url: new URL('./src/components/declarative-form/supporting/section-loading.component.tsx', import.meta.url).href };
    }
    if (specifier.startsWith('@/lib/')) {
      return { shortCircuit: true, url: new URL(`./src/lib/${specifier.slice(6)}.ts`, import.meta.url).href };
    }
    if (source && specifier === './use-declarative-form') {
      return { shortCircuit: true, url: new URL('./use-declarative-form.ts', context.parentURL).href };
    }
    if (source && specifier === './adaptive-section.component') {
      return { shortCircuit: true, url: new URL('./adaptive-section.component.tsx', context.parentURL).href };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.endsWith('/adaptive-section.component.tsx') || url.endsWith('/form.component.tsx') || url.endsWith('/section-loading.component.tsx')) {
      return { shortCircuit: true, format: 'module', source: ts.transpileModule(readFileSync(new URL(url), 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText };
    }
    return nextLoad(url, context);
  },
});

async function mount(Component, props, strict = false) {
  const h = { index: 0, slots: [], effects: [], dirty: false, props };
  h.render = updates => {
    h.props = { ...h.props, ...updates };
    globalThis.hookHarness = h;
    h.index = 0;
    h.dirty = false;
    h.current = Component(h.props);
    for (const effect of h.effects.splice(0)) { effect(); }
  };
  h.flush = async () => {
    for (let i = 0; i < 8; i++) {
      await new Promise(resolve => setImmediate(resolve));
      if (h.dirty) { h.render(); }
    }
  };
  h.unmount = () => {
    for (const slot of h.slots) { slot.value?.current?.cleanup?.(); }
  };
  h.render();
  if (strict) {
    for (const slot of h.slots) {
      const effect = slot.value?.current;
      if (effect?.setup) { effect.cleanup?.(); effect.cleanup = effect.setup(); }
    }
  }
  await h.flush();
  return h;
}

function findElement(node, type) {
  if (!node || typeof node !== 'object') { return undefined; }
  if (node.type === type) { return node; }
  for (const child of Array.isArray(node) ? node : [node.props?.children]) {
    const found = findElement(child, type);
    if (found) { return found; }
  }
}

function browser(t, search = '') {
  globalThis.window = Object.assign(new EventTarget(), { location: { pathname: '/form', search }, scrollX: 0, scrollY: 0, scrollTo(options) { this.scrollX = options.left; this.scrollY = options.top; }, history: { replaceState(_data, _title, url) { window.location.search = new URL(url, 'https://example.com').search; } } });
  t.after(() => { delete globalThis.window; });
}


const form = { sections: [
  { id: 'intro', fields: [{ id: 'name', type: 'short_text' }], next: 'adaptive' },
  { id: 'adaptive', button: 'Continue assessment', adaptive: { objectives: ['Understand'], properties: { result: { type: 'string' }, optional: { type: 'string' } }, required: ['result'] }, next: 'after' },
  { id: 'after', fields: [{ id: 'email', type: 'email' }], next: 'done' },
] };

function adaptiveProps(overrides = {}) {
  return { formId: 'form', section: render(compile(resolve(form, 'en'), {}), {}, { sectionId: 'adaptive' }).section, locale: 'en', data: { name: 'Ada' }, onBack() {}, onSubmit: async () => {}, ...overrides };
}
const definition = {
  sections: [{
    id: 'adaptive',
    adaptive: {
      objectives: [{ en: 'Understand needs', es: 'Comprender necesidades' }, 'Determine budget'],
      properties: { budget: { type: 'number', minimum: 0 }, details: { type: 'object', properties: { needs: { type: 'array', items: { type: 'string' } } }, additionalProperties: false } },
    },
    next: [{ when: 'data.budget > 100', go: 'followup' }, { else: 'done' }],
  }, { id: 'followup', fields: [] }],
};

test('section skeleton announces loading and keeps decorative placeholders noninteractive', async () => {
  const { SectionLoading } = await import('./src/components/declarative-form/supporting/section-loading.component.tsx');
  const skeleton = SectionLoading();
  assert.equal(skeleton.props.role, 'status');
  assert.equal(skeleton.props['aria-live'], 'polite');
  const [announcement, decoration] = skeleton.props.children;
  assert.equal(announcement.props.children, 'section.loading');
  assert.equal(announcement.props.className, 'sr-only');
  assert.equal(decoration.props['aria-hidden'], 'true');
  const markup = renderToStaticMarkup(skeleton);
  assert.doesNotMatch(markup, /<(input|button|a)\b|tabindex=/);
});

test('adaptive authoring survives serialization and rendering with normal output routing', () => {
  const validate = new Ajv({ allErrors: true }).compile(FORM_JSON_SCHEMA);
  assert.equal(validate(definition), true, JSON.stringify(validate.errors));
  assert.deepEqual(parse(serialize(definition)), definition);
  const resolved = resolve(definition, 'es');
  const initial = render(compile(resolved, {}), {}, { sectionId: 'adaptive' });
  assert.equal(initial.section.adaptive.objectives[0], 'Comprender necesidades');
  assert.deepEqual(initial.section.fields, []);
  const completed = render(compile(resolved, { budget: 200 }), { budget: 200 }, { sectionId: 'adaptive' });
  assert.deepEqual(completed.section.next, { type: 'section', sectionId: 'followup' });
  for (const adaptive of [
    { ...definition.sections[0].adaptive, objectives: [] },
    { ...definition.sections[0].adaptive, properties: {} },
    { ...definition.sections[0].adaptive, properties: { unsafe: { type: 'string', $ref: 'https://example.com/schema' } } },
  ]) {
    assert.equal(validate({ sections: [{ id: 'test', adaptive }] }), false);
  }
  assert.equal(validate({ sections: [{ ...definition.sections[0], fields: [] }] }), false);
  assert.throws(() => resolve({ sections: [{ ...definition.sections[0], fields: [] }] }, 'en'));
  assert.throws(() => resolve({ sections: [...definition.sections, { id: 'collision', fields: [{ id: 'budget', type: 'number' }] }] }, 'en'));
});


test('adaptive component owns requests, renders standard fields, and retries handoff without reassessment', async t => {
  browser(t);
  const { AdaptiveSection } = await import('./src/components/declarative-form/core/adaptive-section.component.tsx');
  const { SectionLoading } = await import('./src/components/declarative-form/supporting/section-loading.component.tsx');
  const calls = [];
  const submitted = [];
  let failSave = true;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    return { ok: true, json: async () => calls.length === 1 ? { fields: [{ id: 'need', type: 'short_text', label: 'What do you need?' }, { id: 'cost', type: 'number' }] } : { fields: [], outputs: { result: 'accepted' } } };
  });
  const data = { name: 'Ada', result: 'old', optional: 'remove', email_token: 'proof', laterAnswer: 'context' };
  const h = await mount(AdaptiveSection, adaptiveProps({ data, onSubmit: async values => {
    submitted.push(values);
    if (failSave) { throw new Error('Save failed'); }
  } }), true);
  assert.equal(calls.length, 1);
  assert.equal(window.location.search, '');
  assert.deepEqual(Object.keys(calls[0].body).sort(), ['data', 'history', 'locale']);
  assert.deepEqual(calls[0].body.data, data);
  const questions = findElement(h.current, 'section');
  assert.equal(questions.props.section.fields.length, 2);
  assert.equal(questions.props.section.fields[0].label, 'What do you need?');
  assert.equal(questions.props.section.button, 'Continue assessment');
  assert.deepEqual(questions.props.data, {});
  assert.equal(submitted.length, 0);
  await questions.props.onSubmit({ need: 'website', cost: 100 });
  await h.flush();
  assert.deepEqual(calls[1].body.history, [{ fields: [{ id: 'need', type: 'short_text', label: 'What do you need?' }, { id: 'cost', type: 'number' }], answers: { need: 'website', cost: 100 } }]);
  assert.deepEqual(submitted[0], { result: 'accepted', optional: undefined });
  assert.ok(findElement(h.current, 'button'));
  failSave = false;
  h.render({ data: { ...data, result: 'accepted' } });
  findElement(h.current, 'button').props.onClick();
  await h.flush();
  assert.equal(calls.length, 2);
  assert.deepEqual(submitted[1], submitted[0]);
  assert.equal(findElement(h.current, SectionLoading), undefined);
});

test('provider failures retain local answers for retry; remount starts fresh without URL changes', async t => {
  browser(t, '?submission_id=existing&step=adaptive');
  const { AdaptiveSection } = await import('./src/components/declarative-form/core/adaptive-section.component.tsx');
  const { SectionLoading } = await import('./src/components/declarative-form/supporting/section-loading.component.tsx');
  const calls = [];
  let fail = false;
  let finish;
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    calls.push(JSON.parse(options.body));
    if (fail) { return new Promise(resolve => { finish = resolve; }); }
    return { ok: true, json: async () => ({ fields: [{ id: 'q', type: 'long_text' }] }) };
  });
  const h = await mount(AdaptiveSection, adaptiveProps());
  const questions = findElement(h.current, 'section');
  let focusCount = 0;
  questions.props.ref.current = { focus() { focusCount++; } };
  fail = true;
  const pending = questions.props.onSubmit({ q: 'Keep my answer' });
  await h.flush();
  assert.ok(findElement(h.current, SectionLoading));
  assert.equal(findElement(h.current, 'div').props.hidden, true);
  assert.equal(findElement(h.current, 'section').key, questions.key);
  assert.equal(findElement(h.current, 'section').props.disabled, true);
  finish({ ok: false, status: 500 });
  await pending;
  await h.flush();
  assert.equal(findElement(h.current, SectionLoading), undefined);
  assert.equal(h.current.props.children[2].props.hidden, false);
  assert.equal(findElement(h.current, 'section').key, questions.key);
  findElement(h.current, 'button').props.onClick();
  await h.flush();
  assert.ok(findElement(h.current, SectionLoading));
  assert.equal(findElement(h.current, 'div').props.hidden, true);
  assert.equal(findElement(h.current, 'section').key, questions.key);
  finish({ ok: true, json: async () => ({ fields: [{ id: 'followup', type: 'short_text' }] }) });
  await h.flush();
  assert.equal(findElement(h.current, SectionLoading), undefined);
  assert.equal(findElement(h.current, 'div').props.hidden, false);
  assert.notEqual(findElement(h.current, 'section').key, questions.key);
  assert.equal(findElement(h.current, 'section').props.disabled, false);
  assert.ok(focusCount > 0);
  assert.deepEqual(calls[1], calls[2]);
  assert.deepEqual(calls[2].history, [{ fields: [{ id: 'q', type: 'long_text' }], answers: { q: 'Keep my answer' } }]);
  assert.ok(findElement(h.current, 'section'));
  assert.equal(window.location.search, '?submission_id=existing&step=adaptive');
  h.unmount();
  fail = false;
  await mount(AdaptiveSection, adaptiveProps());
  assert.deepEqual(calls[3].history, []);
  assert.equal(calls[3].submissionId, undefined);
});

test('unmounted adaptive sections ignore late responses', async t => {
  browser(t);
  const { AdaptiveSection } = await import('./src/components/declarative-form/core/adaptive-section.component.tsx');
  const { SectionLoading } = await import('./src/components/declarative-form/supporting/section-loading.component.tsx');
  let finish;
  const submitted = [];
  t.mock.method(globalThis, 'fetch', () => new Promise(resolve => { finish = resolve; }));
  const h = await mount(AdaptiveSection, adaptiveProps({ onSubmit: values => submitted.push(values) }));
  assert.ok(findElement(h.current, SectionLoading));
  assert.equal(findElement(h.current, 'section'), undefined);
  h.unmount();
  finish({ ok: true, json: async () => ({ fields: [], outputs: { result: 'stale' } }) });
  await h.flush();
  assert.deepEqual(submitted, []);
  assert.equal(window.location.search, '');
});

test('context can satisfy objectives immediately through the ordinary submit callback', async t => {
  browser(t, '?submission_id=saved&step=adaptive');
  const { AdaptiveSection } = await import('./src/components/declarative-form/core/adaptive-section.component.tsx');
  const submitted = [];
  const fetch = t.mock.method(globalThis, 'fetch', async () => ({ ok: true, json: async () => ({ fields: [], outputs: { result: 'from context' } }) }));
  await mount(AdaptiveSection, adaptiveProps({ onSubmit: values => submitted.push(values) }));
  assert.equal(fetch.mock.callCount(), 1);
  assert.deepEqual(submitted, [{ result: 'from context', optional: undefined }]);
});

test('primary form keeps its ordinary merge and routing and waits for save before navigating', async t => {
  browser(t);
  const { DeclarativeForm } = await import('./src/components/declarative-form/core/form.component.tsx');
  const effects = [];
  const steps = [];
  let fail = true;
  const h = await mount(DeclarativeForm, { form, locale: 'en', sectionId: 'adaptive', initialData: { name: 'Ada', result: 'old', optional: 'old', email_token: 'proof' }, onStepChange: id => steps.push(id), onEffect: async effect => { effects.push(effect); if (fail) { throw new Error('Offline'); } if (effect.type === 'submit') { steps.push(effect.activeSectionId); } } });
  assert.equal(h.current.type.name, 'AdaptiveSection');
  await assert.rejects(h.current.props.onSubmit({ result: 'accepted', optional: undefined }), /Offline/);
  await h.flush();
  assert.deepEqual(steps, []);
  fail = false;
  await h.current.props.onSubmit({ result: 'accepted', optional: undefined });
  await h.flush();
  assert.deepEqual(effects[1].data, { name: 'Ada', result: 'accepted', email_token: 'proof' });
  assert.equal(effects[1].type, 'submit');
  assert.deepEqual(steps, ['after']);
  h.render({ sectionId: 'after' });
  assert.equal(h.current.type, 'section');
  await h.current.props.onSubmit({ email: 'new@example.com' });
  await h.flush();
  assert.equal(effects[2].type, 'complete');
  assert.equal(effects[2].data.result, 'accepted');
  assert.equal(effects[2].data.email, 'new@example.com');
  h.current.props.onBack();
  assert.equal(steps.at(-1), 'adaptive');
});

test('conventional forms still use conditional routing and redirects', async t => {
  browser(t);
  const { DeclarativeForm } = await import('./src/components/declarative-form/core/form.component.tsx');
  const effects = [];
  const definition = { sections: [{ id: 'first', fields: [{ id: 'count', type: 'number' }], next: [{ when: 'data.count > 1', go: 'last' }, { else: 'https://example.com/finished' }] }, { id: 'last', fields: [], next: 'done' }] };
  const h = await mount(DeclarativeForm, { form: definition, locale: 'en', sectionId: 'first', initialData: {}, onStepChange() {}, onEffect: async effect => effects.push(effect) });
  await h.current.props.onSubmit({ count: 1 });
  await h.flush();
  assert.equal(effects[0].type, 'redirect');
  assert.equal(effects[0].url, 'https://example.com/finished');
  await h.current.props.onSubmit({ count: 2 });
  assert.equal(effects[1].type, 'submit');
  assert.equal(effects[1].activeSectionId, 'last');
});

test('section changes reset scrolling without moving an initial or unchanged section', async t => {
  browser(t);
  const { DeclarativeForm } = await import('./src/components/declarative-form/core/form.component.tsx');
  const scroll = t.mock.method(window, 'scrollTo');
  const definition = { sections: [{ id: 'first', fields: [], next: 'last' }, { id: 'last', fields: [], next: 'done' }] };
  window.scrollY = 108;
  const h = await mount(DeclarativeForm, { form: definition, locale: 'en', sectionId: 'first', initialData: {}, onStepChange() {}, onEffect() {} }, true);
  t.after(() => h.unmount());
  assert.equal(scroll.mock.callCount(), 0);
  assert.equal(window.scrollY, 108);

  h.current.props.ref.current = { focus(options) {
    assert.equal(options.preventScroll, true);
    window.dispatchEvent(new Event('focusin'));
  } };
  h.render({ sectionId: 'last' });
  assert.equal(window.scrollY, 0);
  window.scrollY = 108;
  window.dispatchEvent(new Event('scroll'));
  assert.equal(window.scrollY, 0);

  h.render({ initialData: { unchangedSection: true } });
  assert.equal(scroll.mock.callCount(), 2);
  h.unmount();
  window.scrollY = 108;
  window.dispatchEvent(new Event('scroll'));
  assert.equal(window.scrollY, 108);
});
