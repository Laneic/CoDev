
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/logout", {
        method: "POST",
      });

      if (!response.ok) {
        setError("Could not log out. Please try again.");
        return;
      }

      // Clear authenticated user state in App.jsx
      onLogout();

      // Redirect to authentication
      navigate("/authentication", { replace: true });
    } catch (error) {
      setError("An error occurred while logging out.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Welcome to the Dashboard</h1>

      {user && <p>Hello, {user.username}!</p>}

      <p>
        This is a protected route. Only authenticated
        users can access this page.
      </p>

      <button onClick={logout} disabled={loading}>
        {loading ? "Logging out..." : "Logout"}
      </button>

      {error && <p role="alert">{error}</p>}
    </div>
  );
}

export default Dashboard;
