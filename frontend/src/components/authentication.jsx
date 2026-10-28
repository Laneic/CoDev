
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./form.css";

function Authentication({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function signIn(event) {
    event.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed");
        return;
      }

      // Fetch the logged-in user
      const meResponse = await fetch("/api/me");
      const meData = await meResponse.json();

      if (!meResponse.ok) {
        setError("Could not retrieve your session. Please try again.");
        return;
      }

      // Update App.jsx authentication state
      onLogin(meData.user);

      // Go to dashboard
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setError("An error occurred while logging in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h1>CoDev</h1>
      <h2>Log in</h2>

      <form onSubmit={signIn} className="AuthForm">
        <input
          type="text"
          placeholder="Enter username"
          className="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
        />

        <input
          type="password"
          placeholder="Enter password"
          className="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>

        {error && <p role="alert">{error}</p>}
      </form>

      <p>
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}

export default Authentication;
