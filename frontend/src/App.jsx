
import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Register from "./components/register";
import Authentication from "./components/authentication";
import Dashboard from "./components/dashboard";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const response = await fetch("/api/me");

        if (!response.ok) {
          if (active) setUser(null);
          return;
        }

        const data = await response.json();

        if (active) {
          setUser(data.user);
        }
      } catch (error) {
        console.error("Could not check session");

        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <p>Checking session...</p>;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to={user ? "/dashboard" : "/authentication"}
            replace
          />
        }
      />

      <Route
        path="/authentication"
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Authentication onLogin={setUser} />
          )
        }
      />

      <Route
        path="/register"
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Register />
          )
        }
      />

      <Route
        path="/dashboard"
        element={
          user ? (
            <Dashboard user={user} onLogout={() => setUser(null)} />
          ) : (
            <Navigate to="/authentication" replace />
          )
        }
      />

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}

export default App;
