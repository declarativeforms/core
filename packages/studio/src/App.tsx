import { Route, Routes, Navigate } from "react-router-dom";

import { AppLayout } from "@/components";
import { useAuth } from "@/hooks";
import {
  CallbackPage,
  DashboardPage,
  FormEditorPage,
  LoginPage,
  NotFoundPage,
} from "./pages";

function App() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <main id="main-content" className="h-dvh bg-background">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<CallbackPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    );
  }

  return (
    <main id="main-content" className="h-dvh bg-background">
      <AppLayout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/forms/:formId" element={<FormEditorPage />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/auth/callback" element={<CallbackPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppLayout>
    </main>
  );
}

export default App;
