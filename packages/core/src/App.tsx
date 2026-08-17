import { Route, Routes, useSearchParams } from 'react-router-dom';

import {
  MainPage,
  NotFoundPage,
  PrivacyPolicyPage,
  ThankYouPage,
} from './pages';
import { ExternalRedirect } from './components/external-redirect.component';

function App() {
  const [searchParams] = useSearchParams();

  return (
    <>
      <main
        id="main-content"
        className={
          searchParams.get('embed') === 'true'
            ? 'min-h-lvh bg-white'
            : undefined
        }
      >
        <Routes>
          <Route
            path="/"
            element={
              <ExternalRedirect url="https://github.com/declarativeforms" />
            }
          />
          <Route path="/:id" element={<MainPage />} />
          <Route path="/:id/thank-you" element={<ThankYouPage />} />
          <Route path="/:owner/:repository/*" element={<MainPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
