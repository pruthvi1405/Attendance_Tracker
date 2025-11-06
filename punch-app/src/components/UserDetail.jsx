import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import NavBar from "./NavBar";
import { getUserAttendance } from "../api";
import "./UserDashboard.scss"; // Reuse same styles

export default function UserDetail({ token, onLogout }) {
  const { username } = useParams();
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState({});
  const [weeklyTotal, setWeeklyTotal] = useState("0h 0m");

  const formatTime = (isoString) => {
    if (!isoString) return "—";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const calculateTotalHours = (punchIn, punchOut) => {
    if (!punchIn) return "0h 0m";
    const start = new Date(punchIn);
    const end = punchOut ? new Date(punchOut) : new Date();
    const diffMs = end - start;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHrs}h ${diffMins}m`;
  };

  const fetchAttendance = async () => {
    try {
      const res = await getUserAttendance(token, username);
      setAttendance(res.data.attendance || {});
      setWeeklyTotal(res.data.weekly_total_human || "0h 0m");
    } catch (err) {
      console.error("Failed to fetch user attendance", err);
    }
  };

  useEffect(() => {
    if (token) fetchAttendance();
  }, [token, username]);

  return (
    <div className="user-dashboard">
      <NavBar onLogout={onLogout} />
      <div className="content">
        <button
          className="btn back-btn"
          onClick={() => navigate("/admin/dashboard")}
          style={{ marginBottom: "1rem" }}
        >
          ← Back to Dashboard
        </button>

        <h2>{username}'s Attendance</h2>

        <div className="table-container">
          <h3>Attendance History</h3>
          {Object.keys(attendance).length === 0 ? (
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
                {Object.entries(attendance)
                  .sort((a, b) => new Date(b[0]) - new Date(a[0])) // Sort by date desc
                  .map(([date, punches]) =>
                    punches.map((p, idx) => (
                      <tr key={p.id}>
                        {idx === 0 && <td rowSpan={punches.length}>{date}</td>}
                        <td>{formatTime(p.punch_in)}</td>
                        <td>{formatTime(p.punch_out)}</td>
                        <td>{p.total_human || calculateTotalHours(p.punch_in, p.punch_out)}</td>
                      </tr>
                    ))
                  )}
                <tr>
                  <td colSpan={3} style={{ textAlign: "right", fontWeight: "bold" }}>
                    Weekly Total:
                  </td>
                  <td style={{ fontWeight: "bold" }}>{weeklyTotal}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
