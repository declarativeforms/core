import { Route, Routes } from "react-router-dom";
import {
  MainPage,
  ConnectionsPage,
  OAuthAirtablePage,
  OAuthGitHubPage,
  OAuthGooglePage,
  PrivacyPolicyPage,
  ThankYouPage,
} from "./pages";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/demo" element={<MainPage />} />
      <Route path="/:id" element={<MainPage />} />
      <Route path="/:owner/:repository/:file" element={<MainPage />} />
      <Route path="/thank-you" element={<ThankYouPage />} />
      <Route path="/connections" element={<ConnectionsPage />} />
      <Route path="/oauth/airtable" element={<OAuthAirtablePage />} />
      <Route path="/oauth/github" element={<OAuthGitHubPage />} />
      <Route path="/oauth/google" element={<OAuthGooglePage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
    </Routes>
  );
}

export default App;
