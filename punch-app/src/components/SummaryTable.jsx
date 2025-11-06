import "./SummaryTable.scss";

export default function SummaryTable({ users = [], week = [], onUserClick, isDateFilter = false }) {
  // const formatTime = (timeStr) => timeStr || "--";

  const formatTime = (timeStr) => {
  if (!timeStr) return "--";
  else if(isDateFilter){
    const date = new Date(timeStr);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}
  else{
    return timeStr
  }
  
};

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            {week.map(day => (
              <th key={day}>
                {day}<br />(In | Out)
              </th>
            ))}
            <th>Total Hours</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, idx) => (
            <tr key={u.username} className={idx % 2 === 0 ? "evenRow" : "oddRow"}>
              <td
                className="clickable-username"
                onClick={() => onUserClick(u.username)}
                style={{ cursor: "pointer", color: "blue", textDecoration: "underline" }}
              >
                {u.username}
              </td>
              <td>{u.first_name} {u.last_name}</td>

              {week.map(day => {
                if (isDateFilter) {
                  // Filter punches for this date
                  const punchesForDay = (u.punches || []).filter(p => p.date === day);
                  return (
                    <td key={day}>
                      {punchesForDay.length > 0
                        ? punchesForDay.map((p, i) => (
                            <div
                              key={i}
                              className={`punch-block ${!p.out ? "activePunch" : "hasPunches"}`}
                            >
                              <span className="punch-time">{formatTime(p.in)}</span>
                              <span className="separator">|</span>
                              <span className="punch-time">{formatTime(p.out)}</span>
                            </div>
                          ))
                        : <div className="punch-block">-- | --</div>
                      }
                    </td>
                  );
                } else {
                  // Weekly summary logic
                  return (
                    <td key={day}>
                      {u[day]?.length > 0
                        ? u[day].map((p, i) => (
                            <div
                              key={i}
                              className={`punch-block ${!p.out ? "activePunch" : "hasPunches"}`}
                            >
                              <span className="punch-time">{formatTime(p.in)}</span>
                              <span className="separator">|</span>
                              <span className="punch-time">{formatTime(p.out)}</span>
                            </div>
                          ))
                        : <div className="punch-block">-- | --</div>
                      }
                    </td>
                  );
                }
              })}

              <td>{u.total || "--"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
