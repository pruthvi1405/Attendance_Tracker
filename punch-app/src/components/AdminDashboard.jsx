import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { signOut } from "firebase/auth";
import PunchList from "./PunchList";

export default function AdminDashboard() {
  const [punches, setPunches] = useState([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const loadPunches = async () => {
    let q = query(collection(db, "punches"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    setPunches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => { loadPunches(); }, []);

  const handleSearch = async () => {
    let q = collection(db, "punches");
    const filters = [];
    if (email) filters.push(where("email", "==", email));
    if (from && to) filters.push(where("timestamp", ">=", new Date(from)), where("timestamp", "<=", new Date(to)));

    const snap = await getDocs(query(q, ...filters, orderBy("timestamp", "desc")));
    setPunches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <div>
        <input placeholder="Search by Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
        <input type="date" value={to} onChange={e => setTo(e.target.value)} />
        <button onClick={handleSearch}>Search</button>
        <button onClick={() => signOut(auth)}>Sign Out</button>
      </div>
      <PunchList punches={punches} />
    </div>
  );
}
