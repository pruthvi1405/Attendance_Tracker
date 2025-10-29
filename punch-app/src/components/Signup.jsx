import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

export default function Signup({ onSwitch }) {
  const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPass] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleSignup = async () => {
    if (password !== confirm) return alert("Passwords don’t match!");

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", userCred.user.uid), {
        firstName,
        lastName,
        email,
        createdAt: new Date(),
      });
      alert("Signup successful!");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <h2>Sign Up</h2>
      <input placeholder="First Name" value={firstName} onChange={e => setFirst(e.target.value)} />
      <input placeholder="Last Name" value={lastName} onChange={e => setLast(e.target.value)} />
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={e => setPass(e.target.value)} />
      <input type="password" placeholder="Retype Password" value={confirm} onChange={e => setConfirm(e.target.value)} />
      <button onClick={handleSignup}>Sign Up</button>
      <p>Already have an account? <span onClick={onSwitch} style={{ color: "blue", cursor: "pointer" }}>Login</span></p>
    </div>
  );
}
