import React, { useState, useEffect } from "react";
import Signup from "./components/Signup";
import Login from "./components/Login";
import UserDashboard from "./components/UserDashboard";
import AdminDashboard from "./components/AdminDashboard";
import { auth } from "./firebase";

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(u => setUser(u));
    return unsubscribe;
  }, []);

  if (!user) return <Login setUser={setUser} />;

  // Hardcoded admin email for now
  if (user.email === "admin@intel.com") return <AdminDashboard user={user} />;
  return <UserDashboard user={user} />;
}
