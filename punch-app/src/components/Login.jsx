import { useState } from "react";
import "./Login.scss";
import { login, signup } from "../api"; // <-- add signup API
import { useNavigate } from "react-router-dom";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSignup, setIsSignup] = useState(false); // toggle login/signup

  const navigate = useNavigate();

  const setTokenWithExpiry = (token, username, isAdmin, ttl = 3600 * 1000) => {
    const now = new Date();
    const item = {
      token,
      username,
      isAdmin,
      expiry: now.getTime() + ttl,
    };
    localStorage.setItem("user", JSON.stringify(item));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (isSignup) {
        // Signup flow
        await signup({
          username,
          first_name: firstName,
          last_name: lastName,
          email,
          password,
          is_admin: false, // always false
        });
        // After successful signup, switch to login
        setIsSignup(false);
        setUsername("");
        setPassword("");
        setFirstName("");
        setLastName("");
        setEmail("");
        setError("Signup successful! Please login.");
      } else {
        // Login flow
        const res = await login(username, password);
        const token = res.data.access_token;
        const admin = res.data.is_admin;

        if (token) {
          setTokenWithExpiry(token, username, admin, 3600 * 1000);
          onLogin({ username, is_admin: admin, access_token: token });
        } else {
          setError("Login failed: no token returned");
        }
      }
    } catch (err) {
      console.error(err.response?.data || err.message);
      setError(err.response?.data?.error || "Server error");
    }
  };

  return (
    <div className="login-modal">
      <div className="login-box">
        <h2>{isSignup ? "Sign Up" : "Login"}</h2>
        <form className="login-form" onSubmit={handleSubmit}>
          {isSignup && (
            <>
              <input
                className="login-input"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <input
                className="login-input"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
              <input
                className="login-input"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </>
          )}

          <input
            className="login-input"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            className="login-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="login-button" type="submit">
            {isSignup ? "Sign Up" : "Login"}
          </button>
        </form>

        {error && <p className="login-error">{error}</p>}

        <p className="toggle-link">
          {isSignup ? (
            <>
              Already have an account?{" "}
              <span onClick={() => setIsSignup(false)}>Login</span>
            </>
          ) : (
            <>
              Don't have an account?{" "}
              <span onClick={() => setIsSignup(true)}>Sign Up</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
