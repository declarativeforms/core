import { Route, Routes } from "react-router-dom";

import {
  ConnectionsPage,
  MainPage,
  NotFoundPage,
  OAuthAirtablePage,
  OAuthGitHubPage,
  PlaygroundPage,
  PrivacyPolicyPage,
  ThankYouPage,
} from "./pages";

function ExternalRedirect({ url }: { url: string }) {
  window.location.replace(url);
  return null;
}

function App() {

  return (
    <>
      <main id="main-content">
        <Routes>
          <Route path="/" element={<ExternalRedirect url="https://docs.declarativeforms.com" />} />
          <Route path="/:id" element={<MainPage />} />
          <Route path="/:id/thank-you" element={<ThankYouPage />} />
          <Route path="/:owner/:repository/*" element={<MainPage />} />
          <Route path="/playground" element={<PlaygroundPage />} />
          <Route path="/connections" element={<ConnectionsPage />} />
          <Route path="/oauth/airtable" element={<OAuthAirtablePage />} />
          <Route path="/oauth/github" element={<OAuthGitHubPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
