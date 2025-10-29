import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { collection, addDoc, query, where, orderBy, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import PunchList from "./PunchList";

export default function UserDashboard({ user }) {
  const [punches, setPunches] = useState([]);

  const loadPunches = async () => {
    const q = query(collection(db, "punches"), where("email", "==", user.email), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    setPunches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => { loadPunches(); }, []);

  const handlePunch = async (type) => {
    await addDoc(collection(db, "punches"), {
      email: user.email,
      type,
      timestamp: new Date(),
    });
    loadPunches();
  };

  return (
    <div>
      <h2>Welcome {user.email}</h2>
      <button onClick={() => handlePunch("IN")}>Punch In</button>
      <button onClick={() => handlePunch("OUT")}>Punch Out</button>
      <button onClick={() => signOut(auth)}>Sign Out</button>
      <PunchList punches={punches} />
    </div>
  );
}
