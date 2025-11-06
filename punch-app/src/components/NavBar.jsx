export default function NavBar({ onLogout }) {
  return (
    <nav className="navbar">
      <h1 className="logo"> Dashboard</h1>
      <button className="logout-btn" onClick={onLogout}>Logout</button>
    </nav>
  );
}
