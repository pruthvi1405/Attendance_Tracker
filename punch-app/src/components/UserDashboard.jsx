import { useEffect, useState } from "react";
import NavBar from "./NavBar";
import { punchIn, punchOut, getMyAttendance } from "../api";
import "./UserDashboard.scss";

export default function UserDashboard({ user, token, onLogout }) {
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [todayRecord, setTodayRecord] = useState(null);
  const [history, setHistory] = useState([]);

  // Helper function to format time
const formatTime = (isoString) => {
  if (!isoString) return "—";
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const calculateTotalHours = (punchIn, punchOut) => {
  if (!punchIn) return "0h 0m";

  const start = new Date(punchIn);
  const end = punchOut ? new Date(punchOut) : new Date(); // If not punched out, use current time
  const diffMs = end - start;

  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return `${diffHrs}h ${diffMins}m`;
};




  // Fetch attendance (all punches, latest 7 in table)
  const fetchAttendance = async () => {
    try {
      const res = await getMyAttendance(token);
      const attendance = res.data.attendance || [];

      // Determine active punch-in for toggle
      setIsPunchedIn(!!res.data.active_punch_in);

      // Get latest active punch for today (if any)
      const today = new Date().toISOString().slice(0, 10);
      const todayPunches = attendance.filter(a => a.date === today);
      const latestToday = todayPunches.length
        ? todayPunches[todayPunches.length - 1]
        : null;
      setTodayRecord(latestToday);

      // Sort newest first for table
      const sortedHistory = attendance
        .sort((a, b) => new Date(b.punch_in) - new Date(a.punch_in))
        .slice(0, 7);
      setHistory(sortedHistory);
    } catch (err) {
      console.error("Failed to fetch attendance", err);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  // Punch In
  const handlePunchIn = async () => {
    try {
      const res = await punchIn(token, user.username);
      const updatedPunch = res.data.attendance;

      // Update today record
      setTodayRecord(updatedPunch);
      setIsPunchedIn(true);

      // Add new punch to history (top)
      setHistory(prev => [updatedPunch, ...prev].slice(0, 7));

      alert("Punched in!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to punch in");
    }
  };

  // Punch Out
  const handlePunchOut = async () => {
    try {
      const res = await punchOut(token, user.username);
      const updatedPunch = res.data.attendance;

      setTodayRecord(updatedPunch);
      setIsPunchedIn(false);

      // Replace matching punch in history or add if missing
      setHistory(prev => {
        const index = prev.findIndex(r => r.id === updatedPunch.id);
        if (index !== -1) {
          const newHistory = [...prev];
          newHistory[index] = updatedPunch;
          return newHistory;
        }
        return [updatedPunch, ...prev].slice(0, 7);
      });

      alert("Punched out!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to punch out");
    }
  };

  return (
    <div className="user-dashboard">
      <NavBar onLogout={onLogout} />

      <div className="content">
  <h2>Welcome , {user.username}</h2>

  {isPunchedIn ? (
    <button onClick={handlePunchOut} className="btn punch-out">Punch Out</button>
  ) : (
    <button onClick={handlePunchIn} className="btn punch-in">Punch In</button>
  )}

  {todayRecord && (
    <div className="today-status">
      <h3>Today's Status</h3>
      <p><strong>Punch In:</strong> {formatTime(todayRecord.punch_in) || "—"}</p>
      <p><strong>Punch Out:</strong> {formatTime(todayRecord.punch_out) || "—"}</p>
      <p><strong>Total:</strong> {todayRecord.total_human || calculateTotalHours(todayRecord.punch_in, todayRecord.punch_out)}</p>
    </div>
  )}

  <div className="table-container">
    <h3>Recent History</h3>
    {history.length === 0 ? (
      <p>No attendance records found.</p>
    ) : (
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Punch In</th>
            <th>Punch Out</th>
            <th>Total Hours</th>
          </tr>
        </thead>
        <tbody>
          {history.map(rec => (
            <tr key={rec.id}>
              <td>{rec.date}</td>
              <td>{formatTime(rec.punch_in) || "—"}</td>
              <td>{formatTime(rec.punch_out) || "—"}</td>
              <td>
  {rec.total_human || calculateTotalHours(rec.punch_in, rec.punch_out)}
</td>

            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
</div>

    </div>
  );
}
