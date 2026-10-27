
import { useState } from "react";
import "./form.css";
import { Link } from "react-router-dom";

function register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !username.trim() ||
      !email.trim() ||
      !password.trim()
    ) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Registration failed");
        return;
      }

      setSuccess("Registration successful!");
      

    } catch (error) {
      setError("Could not connect to the server. Please try again.");
    }
  }

  return (
    <div className="container">
      <h1>CoDev</h1>
      <h2>Register</h2>

      <form onSubmit={handleSubmit} className="AuthForm">
        <input
          type="text"
          value={username}
          placeholder="Enter username"
          className="username"
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="email"
          value={email}
          placeholder="Enter email"
          className="email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          value={password}
          placeholder="Enter password"
          className="password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">Submit</button>
        <p>
          Already have an account? <Link to="/authentication">Login</Link>
        </p>

        {error && <p>{error}</p>}
        {success && <p>{success}</p>}
      </form>
    </div>
  );
}

export default register;

