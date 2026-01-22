import { Route, Routes } from "react-router-dom";
import { MainPage, OAuthGitHubPage, ThankYouPage } from "./pages";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/thank-you" element={<ThankYouPage />} />
      <Route path="/oauth/github" element={<OAuthGitHubPage />} />
    </Routes>
  );
}

export default App;
