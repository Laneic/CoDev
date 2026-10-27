import { useState } from "react";
import { Link } from "react-router-dom";
import "./form.css";
function Authentication() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function signIn(event) {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!username.trim() || !password) {
            setError("Please fill in all fields");
            return;
        }

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: username.trim(),
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Login failed");
                return;
            }

            setSuccess("Login successful!");

            // Later: navigate to your dashboard

        } catch (error) {
            setError("An error occurred while logging in");
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
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Enter password"
                    className="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button type="submit">Sign in</button>

                {error && <p>{error}</p>}
                {success && <p>{success}</p>}
            </form>

            <p>
                Don't have an account? <Link to="/register">Register</Link>
            </p>
        </div>
    );
}

export default Authentication;