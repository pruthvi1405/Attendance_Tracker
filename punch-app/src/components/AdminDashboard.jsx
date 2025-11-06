import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
import SummaryTable from "./SummaryTable";
import SearchBar from "./SearchBar";
import { getWeeklySummary, getDailySummary, searchUsers,exportAttendance } from "../api";
import "./AdminDashboard.scss";

export default function AdminDashboard({ token, onLogout }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [period, setPeriod] = useState("this week");
  const [week, setWeek] = useState([]);
  const [searchParams, setSearchParams] = useState({});

  // Navigate to user details page
  const goToUserDetails = (username) => {
    navigate(`/user/${username}`);
  };

  const handleExport = async (from, to) => {
  try {
    const blob = await exportAttendance(token,from, to);
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `attendance_${from}_to_${to}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (err) {
    console.error("Export failed", err);
  }
};

  // Handle date filter changes
  const handleDateChange = ({ from, to }) => {
    setSearchParams(prev => ({ ...prev, from, to }));
  };

  // Fetch summary data
  const fetchSummary = async (period, filters = {}) => {
  try {
    let res;
    let queryParams = {};

    if (filters.name || filters.email || filters.from || filters.to) {
      res = await searchUsers(token, filters);
    } else if (period === "this week") {
      queryParams.period = "current";
      res = await getWeeklySummary(token, queryParams);
    } else if (period === "previous week") {
      queryParams.period = "previous";
      res = await getWeeklySummary(token, queryParams);
    } else if (period === "daily") {
      const today = new Date().toISOString().slice(0, 10);
      res = await getDailySummary(token, { date: today });
    }

    // Fix here: normalize users array depending on response
    let rawUsers = [];
    if (res.data.users) {
      rawUsers = res.data.users; // weekly summary
    } else if (res.data.results) {
      rawUsers = res.data.results; // date filter / searchUsers
    } else {
      rawUsers = res.data || [];
    }

    // Normalize users
    const users = rawUsers.map(u => ({
      ...u,
      punches: u.punches || [],
      total: u.total_seconds_in_range
        ? `${Math.floor(u.total_seconds_in_range / 3600)}h ${Math.floor((u.total_seconds_in_range % 3600) / 60)}m`
        : u.total || "0h 0m"
    }));

    setUsers(users);

    // Compute week keys for table header
    if (users.length > 0) {
      const dayKeys = isDateFilter(filters)
        ? getDateRangeKeys(filters.from, filters.to)
        : Object.keys(users[0]).filter(k => /\d{4}-\d{2}-\d{2}/.test(k));
      setWeek(dayKeys);
    } else {
      setWeek([]);
    }

  } catch (err) {
    console.error(err);
    setUsers([]);
    setWeek([]);
  }
};

// Helper functions
const isDateFilter = (filters) => !!(filters.from || filters.to);

const getDateRangeKeys = (from, to) => {
  if (!from || !to) return [from].filter(Boolean);
  const start = new Date(from);
  const end = new Date(to);
  const keys = [];
  for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
};


  // Fetch whenever period, token, or searchParams change
  useEffect(() => {
    fetchSummary(period, searchParams);
  }, [period, token, searchParams]);

  return (
    <div className="admin-dashboard">
      <NavBar onLogout={onLogout} />

      <div className="content">
        <div className="header">
            <select
  value={period}
  onChange={(e) => {
    const value = e.target.value;
    setPeriod(value);

    // Clear date filter if switching to daily
    if (value === "daily") {
      setSearchParams({});
    }
  }}
  className="period-dropdown"
>
            <option value="daily" >Today</option>
            <option value="this week">This week</option>
            <option value="previous week">Previous week</option>
          </select>
        </div>

        <SearchBar
          users={users}
          onSelectUser={goToUserDetails}
          onDateChange={handleDateChange}
          onExport={handleExport}
        />

        <SummaryTable
          users={users}
          week={week}
          onUserClick={goToUserDetails}
          isDateFilter={!!(searchParams.from || searchParams.to)}
        />
      </div>
    </div>
  );
}
