import { useState, useEffect, useRef } from "react";
import "./SearchBar.scss";

export default function SearchBar({ users = [], onSelectUser, onDateChange, onExport }) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const containerRef = useRef();

  useEffect(() => {
    if (!query) {
      setMatches([]);
      setShowDropdown(false);
      return;
    }

    const filtered = users.filter(u => {
      const queryParts = query.toLowerCase().trim().split(" ");
      return queryParts.every(
        part =>
          u.first_name.toLowerCase().includes(part) ||
          u.last_name.toLowerCase().includes(part)
      );
    });

    setMatches(filtered);
    setShowDropdown(filtered.length > 0);
  }, [query, users]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (user) => {
    setQuery(`${user.first_name} ${user.last_name}`);
    setShowDropdown(false);
    onSelectUser(user.username);
  };

  const handleDateChange = (type, value) => {
    if (type === "from") setFromDate(value);
    if (type === "to") setToDate(value);

    onDateChange({
      from: type === "from" ? value : fromDate,
      to: type === "to" ? value : toDate,
    });
  };

  const clearDates = () => {
    setFromDate("");
    setToDate("");
    onDateChange({ from: "", to: "" });
  };

  return (
    <div className="search-bar" ref={containerRef}>
      <div className="search-box">
        <input
          type="text"
          placeholder="Search by name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowDropdown(matches.length > 0)}
        />

        {showDropdown && (
          <ul className="dropdown">
            {matches.map((user) => (
              <li key={user.username} onClick={() => handleSelect(user)}>
                {user.first_name} {user.last_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="date-input">
        <label>From</label>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => handleDateChange("from", e.target.value)}
        />
      </div>

      <div className="date-input">
        <label>To</label>
        <input
          type="date"
          value={toDate}
          onChange={(e) => handleDateChange("to", e.target.value)}
        />

        {(fromDate || toDate) && (
          <button className="clear-btn" onClick={clearDates}>
            Clear
          </button>
        )}
      </div>

      {/* Export Button - only shows if both dates selected */}
      {fromDate && toDate && (
        <button className="export-btn" onClick={() => onExport(fromDate, toDate)}>
          Export XLS
        </button>
      )}
    </div>
  );
}
