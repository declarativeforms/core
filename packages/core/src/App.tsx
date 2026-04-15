import { Route, Routes, useSearchParams } from 'react-router-dom';

import {
  MainPage,
  NotFoundPage,
  OAuthGitHubPage,
  PrivacyPolicyPage,
  ThankYouPage,
} from './pages';

function ExternalRedirect({ url }: { url: string }) {
  window.location.replace(url);
  return null;
}

function App() {
  const [searchParams] = useSearchParams();
  const embed = searchParams.get('embed') === 'true';

  return (
    <>
      <main
        id="main-content"
        className={embed ? 'min-h-lvh bg-white' : undefined}
      >
        <Routes>
          <Route
            path="/"
            element={<ExternalRedirect url="https://studio.frms.dev" />}
          />
          <Route path="/:id" element={<MainPage />} />
          <Route path="/:id/thank-you" element={<ThankYouPage />} />
          <Route path="/:owner/:repository/*" element={<MainPage />} />
          <Route path="/oauth/github" element={<OAuthGitHubPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
