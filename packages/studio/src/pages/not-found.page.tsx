import { useEffect } from "react";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  useEffect(() => {
    document.title = "404 — Studio";
  }, []);

  return (
    <>
      <h1>Page Not Found</h1>
      <Link to="/">Back to Dashboard</Link>
    </>
  );
}
