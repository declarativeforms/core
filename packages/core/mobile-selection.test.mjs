import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire, registerHooks } from 'node:module';
import test from 'node:test';

const ts = createRequire(new URL('../api/package.json', import.meta.url))('typescript');
const moduleUrl = source => `data:text/javascript,${encodeURIComponent(source)}`;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL?.includes('/declarative-form/')) {
      const stubs = {
        react: `
          const equal = (a,b) => a && b && a.length === b.length && a.every((v,i) => Object.is(v,b[i]));
          export function useState(initial) {
            const h = globalThis.mobileHarness;
            const slot = h.slots[h.index++] ??= { value: typeof initial === 'function' ? initial() : initial };
            return [slot.value, value => { slot.value = typeof value === 'function' ? value(slot.value) : value; h.dirty = true; }];
          }
          export function useRef(initial) { return useState({current:initial})[0]; }
          export function useEffect(setup, deps) {
            const h = globalThis.mobileHarness;
            const slot = useRef({}).current;
            if (!equal(slot.deps, deps)) {
              slot.deps = deps;
              h.effects.push(() => { slot.cleanup?.(); slot.cleanup = setup(); });
            }
          }
          export function useSyncExternalStore(subscribe, snapshot, serverSnapshot) {
            const h = globalThis.mobileHarness;
            h.serverSnapshot = serverSnapshot;
            useEffect(() => subscribe(() => { h.dirty = true; }), [subscribe]);
            return snapshot();
          }
        `,
        '@/components/ui': ['Button','Command','CommandEmpty','CommandGroup','CommandInput','CommandItem','CommandList','Input','Popover','PopoverContent','PopoverTrigger'].map(name => `export const ${name} = '${name}';`).join(''),
        '@/components/declarative-form/supporting': `export const MobileSelectionSheet = 'Sheet'; export function useMobileLayout() { return true; } export function bindElement(control) { return {id:control.name,ref:control.ref,onBlur:control.onBlur}; }`,
        '@/i18n': `export function useI18n() { return {locale:'en',t:key=>key}; }`,
        './use-google-places-ready': `export function useGooglePlacesReady() { return globalThis.places.ready !== false; }`,
        './use-debounce': `export function useDebounce(value) { return value; }`,
        './google-places': `export function getPlacePredictions(...args) { return globalThis.places.predictions(...args); } export function getPlaceDetails(id) { return globalThis.places.details(id); } export function formatAddressString(place) { return place.formatted_address; } export function formatStructuredAddress(place) { return {formatted_address:place.formatted_address,place_id:place.place_id}; }`,
      };
      if (stubs[specifier]) return {shortCircuit:true,url:moduleUrl(stubs[specifier])};
      if (specifier === '@/lib/strip-html') return {shortCircuit:true,url:new URL('./src/lib/strip-html.ts',import.meta.url).href};
    }
    return nextResolve(specifier,context);
  },
  load(url, context, nextLoad) {
    if (url.endsWith('/address-field.component.tsx')) {
      return {shortCircuit:true,format:'module',source:ts.transpileModule(readFileSync(new URL(url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText};
    }
    return nextLoad(url,context);
  },
});

async function mount(Component, props = {}) {
  const h = {slots:[],index:0,effects:[],dirty:false};
  h.render = () => {
    globalThis.mobileHarness = h;
    h.index = 0; h.dirty = false;
    h.current = Component(props);
    for (const effect of h.effects.splice(0)) effect();
  };
  h.flush = async () => {
    for (let i=0;i<5;i++) {
      await new Promise(resolve => setImmediate(resolve));
      if (h.dirty) h.render();
    }
  };
  h.unmount = () => { for (const slot of h.slots) slot.value?.current?.cleanup?.(); };
  h.render(); await h.flush();
  return h;
}

function find(node, type) {
  if (!node || typeof node !== 'object') return undefined;
  if (node.type === type) return node;
  for (const child of Array.isArray(node) ? node : [node.props?.children]) {
    const found = find(child, type);
    if (found) return found;
  }
}

function eventSource() {
  const listeners = new Map();
  return {
    addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(fn); },
    removeEventListener(type, fn) { listeners.get(type)?.delete(fn); },
    emit(type) { for (const fn of listeners.get(type) ?? []) fn(); },
    count() { return [...listeners.values()].reduce((sum, set) => sum + set.size, 0); },
  };
}

test('mobile layout uses a desktop hydration snapshot, follows the breakpoint and removes its listener', async t => {
  const query = {...eventSource(),matches:true};
  globalThis.window = {matchMedia(value) { assert.equal(value,'(width < 768px)'); return query; }};
  t.after(() => { delete globalThis.window; });
  const {useMobileLayout} = await import('./src/components/declarative-form/supporting/use-mobile-layout.ts');
  const h = await mount(useMobileLayout);
  assert.equal(h.serverSnapshot(),false);
  assert.equal(h.current,true);
  query.matches = false; query.emit('change'); await h.flush();
  assert.equal(h.current,false);
  h.unmount(); assert.equal(query.count(),0);
});

test('selection viewport follows keyboard resize and viewport panning, with cleanup and a fallback', async t => {
  const viewport = {...eventSource(),height:800,offsetTop:0};
  globalThis.window = {...eventSource(),innerHeight:800,visualViewport:viewport};
  t.after(() => { delete globalThis.window; });
  const {useSelectionViewport} = await import('./src/components/declarative-form/supporting/use-selection-viewport.ts');
  const h = await mount(useSelectionViewport);
  assert.deepEqual(h.current,{maxHeight:640,bottom:0});
  viewport.height = 400; viewport.emit('resize'); await h.flush();
  assert.deepEqual(h.current,{maxHeight:320,bottom:400});
  viewport.offsetTop = 100; viewport.emit('scroll'); await h.flush();
  assert.deepEqual(h.current,{maxHeight:320,bottom:300});
  h.unmount(); assert.equal(viewport.count(),0); assert.equal(window.count(),0);
  delete window.visualViewport;
  const fallback = await mount(useSelectionViewport);
  assert.deepEqual(fallback.current,{maxHeight:640,bottom:0});
  fallback.unmount(); assert.equal(window.count(),0);
});

async function address(t, overrides = {}) {
  const changes = [];
  let blurred = 0;
  globalThis.places = {predictions:async()=>[],details:async()=>({formatted_address:'New address',place_id:'new'}),...overrides};
  t.after(() => { delete globalThis.places; });
  const {AddressField} = await import('./src/components/declarative-form/fields/address/address-field.component.tsx');
  const props = {field:{id:'address',type:'address',label:'Address',outputFormat:'structured'},control:{name:'address',value:{formatted_address:'Saved address',place_id:'old'},ref(){},onBlur(){blurred++;},onChange(value){changes.push(value);}}};
  const outer = await mount(AddressField,props);
  const h = await mount(outer.current.type,outer.current.props);
  t.after(() => h.unmount());
  h.current.props.onOpenChange(true); await h.flush();
  return {h,changes,blurred:()=>blurred};
}

test('address dismissal discards the search and cannot commit late details, even after reopening', async t => {
  let resolveDetails;
  const prediction = {place_id:'new',structured_formatting:{main_text:'New address',secondary_text:''}};
  const {h,changes,blurred} = await address(t,{predictions:async()=>[prediction],details:()=>new Promise(resolve=>{resolveDetails=resolve;})});
  find(h.current,'CommandInput').props.onValueChange('draft'); await h.flush();
  const pending = find(h.current,'CommandItem').props.onSelect(); await h.flush();
  h.current.props.onOpenChange(false); await h.flush();
  assert.equal(find(h.current,'CommandInput').props.value,'Saved address');
  h.current.props.onOpenChange(true); await h.flush();
  resolveDetails({formatted_address:'Late address'}); await pending; await h.flush();
  assert.deepEqual(changes,[]); assert.equal(blurred(),1);
});

test('address selection commits structured output and closes only after details resolve', async t => {
  let resolveDetails;
  const {h,changes} = await address(t,{predictions:async()=>[{place_id:'new',structured_formatting:{main_text:'New address'}}],details:()=>new Promise(resolve=>{resolveDetails=resolve;})});
  const pending = find(h.current,'CommandItem').props.onSelect(); await h.flush();
  assert.equal(h.current.props.open,true); assert.deepEqual(changes,[]);
  resolveDetails({formatted_address:'New address',place_id:'new'}); await pending; await h.flush();
  assert.deepEqual(changes,[{formatted_address:'New address',place_id:'new'}]); assert.equal(h.current.props.open,false);
});

test('address searches reject stale predictions and retry failures without changing the saved address', async t => {
  const requests=[];
  t.mock.method(console,'error',()=>{});
  const {h,changes} = await address(t,{predictions:query=>new Promise((resolve,reject)=>requests.push({query,resolve,reject}))});
  find(h.current,'CommandInput').props.onValueChange('second'); await h.flush();
  requests[0].resolve([{place_id:'stale',structured_formatting:{main_text:'Stale address'}}]); await h.flush();
  assert.equal(find(h.current,'CommandItem'),undefined);
  requests[1].reject(new Error('Unavailable')); await h.flush();
  assert.equal(find(h.current,'Button').props.children,'address.retry');
  find(h.current,'Button').props.onClick(); await h.flush();
  assert.equal(requests[2].query,'second'); requests[2].resolve([]); await h.flush();
  assert.equal(find(h.current,'CommandEmpty').props.children,'address.no_results');
  assert.deepEqual(changes,[]);
});

test('address unmount invalidates pending selection details', async t => {
  let resolveDetails;
  const {h,changes} = await address(t,{predictions:async()=>[{place_id:'new',structured_formatting:{main_text:'New address'}}],details:()=>new Promise(resolve=>{resolveDetails=resolve;})});
  const pending = find(h.current,'CommandItem').props.onSelect();
  h.unmount(); resolveDetails({formatted_address:'Late address'}); await pending;
  assert.deepEqual(changes,[]);
});


test('failed address details preserve the saved value and allow selecting the suggestion again', async t => {
  t.mock.method(console, 'error', () => {});
  let attempts = 0;
  const {h, changes} = await address(t, {
    predictions: async () => [{place_id:'new',structured_formatting:{main_text:'New address'}}],
    details: async () => {
      if (++attempts === 1) throw new Error('Unavailable');
      return {formatted_address:'New address',place_id:'new'};
    },
  });
  await find(h.current,'CommandItem').props.onSelect(); await h.flush();
  assert.equal(h.current.props.open,true);
  assert.deepEqual(changes,[]);
  assert.equal(find(h.current,'CommandItem').props.disabled,false);
  await find(h.current,'CommandItem').props.onSelect(); await h.flush();
  assert.equal(changes[0].formatted_address,'New address');
  assert.equal(h.current.props.open,false);
});

test('unavailable Google Places keeps the existing editable plain-input fallback', async t => {
  globalThis.places = {ready:false};
  t.after(() => { delete globalThis.places; });
  const {AddressField} = await import('./src/components/declarative-form/fields/address/address-field.component.tsx');
  const changes = [];
  const h = await mount(AddressField, {
    field: {id:'address',type:'address',label:'Address'},
    control: {name:'address',value:'Saved address',ref(){},onBlur(){},onChange:value=>changes.push(value)},
  });
  assert.equal(h.current.type,'Input');
  assert.equal(h.current.props.value,'Saved address');
  h.current.props.onChange({target:{value:'Typed address'}});
  assert.deepEqual(changes,['Typed address']);
});
