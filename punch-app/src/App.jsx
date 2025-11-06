import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import UserDashboard from "./components/UserDashboard";
import AdminDashboard from "./components/AdminDashboard";
import UserDetail from "./components/UserDetail";

export default function App() {
  const [user, setUser] = useState(null);

  const getToken = () => {
    const itemStr = localStorage.getItem("user");
    if (!itemStr) return null;

    const item = JSON.parse(itemStr);
    const now = new Date();

    if (now.getTime() > item.expiry) {
      localStorage.removeItem("user");
      return null;
    }
    return item;
  };

  useEffect(() => {
    const userData = getToken();
    if (userData) {
      setUser({
        username: userData.username,
        is_admin: userData.isAdmin,
        access_token: userData.token,
      });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null); // ✅ Important: reset state
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            user ? (
              user.is_admin ? (
                <Navigate to="/admin/dashboard" />
              ) : (
                <Navigate to="/user/dashboard" />
              )
            ) : (
              <Login onLogin={setUser} />
            )
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            user && user.is_admin ? (
              <AdminDashboard token={user.access_token} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route
          path="/user/dashboard"
          element={
            user && !user.is_admin ? (
              <UserDashboard user={user} token={user.access_token} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route
  path="/user/:username"
  element={
    user && user.access_token ? (
      <UserDetail token={user.access_token} user={user} onLogout={handleLogout} />
    ) : (
      <Navigate to="/" />
    )
  }
/>



        <Route path="*" element={<Navigate to="/" />} />

       

      </Routes>
    </Router>
  );
}
