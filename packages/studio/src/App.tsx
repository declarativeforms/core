import { Route, Routes } from "react-router-dom";

import { AppLayout } from "@/components";
import { DashboardPage, FormEditorPage, NotFoundPage } from "./pages";

function App() {
  return (
    <main id="main-content" className="h-dvh bg-background">
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
