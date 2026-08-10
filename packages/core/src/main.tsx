import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { I18nProvider } from './i18n';
import App from './App.tsx';
import { loadGoogleMaps } from './lib/google-maps-loader';
import './index.css';

// Optional: enables address autocomplete when a Google Maps key is configured.
loadGoogleMaps();

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <I18nProvider>
        <App />
      </I18nProvider>
    </BrowserRouter>
  </QueryClientProvider>,
);
