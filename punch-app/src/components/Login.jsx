import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import Signup from "./Signup";

export default function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPass] = useState("");
  const [showSignup, setShowSignup] = useState(false);

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      alert(err.message);
    }
  };

  if (showSignup) return <Signup onSwitch={() => setShowSignup(false)} />;

  return (
    <div>
      <h2>Login</h2>
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={e => setPass(e.target.value)} />
      <button onClick={handleLogin}>Login</button>
      <p>Don’t have an account? <span onClick={() => setShowSignup(true)} style={{ color: "blue", cursor: "pointer" }}>Sign Up</span></p>
    </div>
  );
}
