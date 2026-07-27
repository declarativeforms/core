import {
  MainPage,
  NotFoundPage,
  PrivacyPolicyPage,
} from './pages';

function App() {
  const searchParams = new URLSearchParams(window.location.search);
  const embed = searchParams.get('embed') === 'true';
  const route = readRoute(window.location.pathname);

  return (
    <main
      id="main-content"
      className={embed ? 'min-h-lvh bg-white' : undefined}
    >
      {route.type === 'form' ? <MainPage params={route.params} /> : null}
      {route.type === 'privacy' ? <PrivacyPolicyPage /> : null}
      {route.type === 'not-found' ? <NotFoundPage /> : null}
    </main>
  );
}

function readRoute(pathname: string):
  | {
      type: 'form';
      params: {
        id?: string;
        owner?: string;
        repository?: string;
        slugPath?: string;
      };
    }
  | { type: 'privacy' }
  | { type: 'not-found' } {
  const parts = pathname
    .split('/')
    .filter(Boolean)
    .map((part) => {
      try {
        return decodeURIComponent(part);
      } catch {
        return part;
      }
    });

  if (parts.length === 1 && parts[0] === 'privacy-policy') {
    return { type: 'privacy' };
  }

  if (parts.length === 1) {
    return { type: 'form', params: { id: parts[0] } };
  }

  if (parts.length >= 3) {
    return {
      type: 'form',
      params: {
        owner: parts[0],
        repository: parts[1],
        slugPath: parts.slice(2).join('/'),
      },
    };
  }

  return { type: 'not-found' };
}

export default App;
