import { useState } from "react";
import "./Login.scss";
import { login } from "../api"
import { useNavigate } from "react-router-dom"; 

export default function Login({onLogin}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [user,setUser]=useState({});
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
    setError(""); // clear previous errors

    try {
      const res = await login(username, password);
      const token = res.data.access_token;
      const admin = res.data.is_admin

     
    if (token) {
      setTokenWithExpiry(token, username, admin, 3600 * 1000);
      onLogin({ username, is_admin: admin, access_token: token });

      // Optional: navigate here if App doesn't handle routing
      // navigate(admin ? "/admin/dashboard" : "/user/dashboard");

    } else {
      setError("Login failed: no token returned");
    }
    } catch (err) {
      console.error(err.response?.data || err.message);
      setError(err.response?.data?.error || "Server error");
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Login</h2>
      <form className="login-form" onSubmit={handleSubmit}>
        <input
          className="login-input"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <input
          className="login-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button className="login-button" type="submit">Login</button>
      </form>
      {error && <p className="login-error">{error}</p>}
    </div>
  );
}
