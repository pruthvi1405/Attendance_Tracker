import React from "react";

export default function PunchList({ punches }) {
  return (
    <div>
      <h3>Punch Records</h3>
      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>Email</th>
            <th>Type</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {punches.map(p => (
            <tr key={p.id}>
              <td>{p.email}</td>
              <td>{p.type}</td>
              <td>{new Date(p.timestamp.seconds * 1000).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
