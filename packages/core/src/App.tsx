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
import { useI18n } from "./i18n";

function ExternalRedirect({ url }: { url: string }) {
  window.location.replace(url);
  return null;
}

function App() {
  const { t } = useI18n();

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:text-sm focus:font-medium"
      >
        {t("app.skip_to_main_content")}
      </a>
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
