import { Route, Routes } from "react-router-dom";
import { DeclarativeForm } from "./components";

function App() {
  return (
    <Routes>
      <Route path="/" element={<DeclarativeForm />} />
    </Routes>
  );
}

export default App;
