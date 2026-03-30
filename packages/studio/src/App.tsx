import { Route, Routes } from "react-router-dom";

import { DashboardPage } from "./pages";

function NotFoundPage() {
  return <h1>404</h1>;
}

function App() {
  return (
    <main id="main-content">
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </main>
  );
}

export default App;
