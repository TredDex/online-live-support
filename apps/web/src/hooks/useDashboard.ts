import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:3000";

export function useDashboard() {
  const [data, setData] = useState({
    conversations: [],
    visitors: [],
    status: null
  });

  async function load() {
    try {
      const [conversations, status] = await Promise.all([
        fetch(`${API_URL}/api/conversations`).then(r => r.json()),
        fetch(`${API_URL}/api/status`).then(r => r.json())
      ]);

      setData({
        conversations,
        visitors: [],
        status
      });
    } catch (error) {
      console.error("Dashboard loading failed", error);
    }
  }

  useEffect(() => {
    load();

    const timer = setInterval(load, 5000);

    return () => clearInterval(timer);
  }, []);

  return data;
}
