import { Route, Routes } from "react-router-dom";
import {
  AdminSlugSubmissionsPage,
  OAuthGitHubPage,
  MainPage,
  ThankYouPage,
} from "./pages";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/:id" element={<MainPage />} />
      <Route path="/:owner/:repository/:file" element={<MainPage />} />
      <Route path="/thank-you" element={<ThankYouPage />} />
      <Route path="/oauth/github" element={<OAuthGitHubPage />} />
      <Route
        path="/admin/:owner/:repository/:file/submissions"
        element={<AdminSlugSubmissionsPage />}
      />
    </Routes>
  );
}

export default App;
