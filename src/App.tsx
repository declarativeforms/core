import { Route, Routes } from "react-router-dom";

import {
  ConnectionsPage,
  MainPage,
  OAuthAirtablePage,
  OAuthGitHubPage,
  PrivacyPolicyPage,
  ThankYouPage,
} from "./pages";

function App() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>
      <main id="main-content">
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/:id" element={<MainPage />} />
          <Route path="/:owner/:repository/:file" element={<MainPage />} />
          <Route path="/:id/thank-you" element={<ThankYouPage />} />
          <Route
            path="/:owner/:repository/:file/thank-you"
            element={<ThankYouPage />}
          />
          <Route path="/thank-you" element={<ThankYouPage />} />
          <Route path="/connections" element={<ConnectionsPage />} />
          <Route path="/oauth/airtable" element={<OAuthAirtablePage />} />
          <Route path="/oauth/github" element={<OAuthGitHubPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
