"use client";
import { useState, useEffect } from "react";

export default function OnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        background: "#f59e0b",
        color: "#000",
        padding: "8px",
        textAlign: "center",
      }}
    >
      {isOnline ? "You're online" : "You're offline"}
    </div>
  );
}
