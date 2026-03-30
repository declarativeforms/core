import { Route, Routes } from "react-router-dom";

import { AppLayout } from "@/components/app-layout";
import { DashboardPage, FormEditorPage, NotFoundPage } from "./pages";

function App() {
  return (
    <main id="main-content">
      <AppLayout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/forms/:formId" element={<FormEditorPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppLayout>
    </main>
  );
}

export default App;
