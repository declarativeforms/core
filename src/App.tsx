import { Route, Routes } from "react-router-dom";
import { DeclarativeForm } from "./components";
import ThankYou from "./components/thank-you";

function App() {
  return (
    <Routes>
      <Route path="/" element={<DeclarativeForm />} />
      <Route path="/thank-you" element={<ThankYou />} />
    </Routes>
  );
}

export default App;
