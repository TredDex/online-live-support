import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://127.0.0.1:3000";

interface DashboardStatus {
  api: string;
  socket: string;
  service: string;
}

interface Conversation {
  conversationId: string;
  visitorId: string;
  status: string;
  customerSocketId?: string;
  agentId?: string;
  createdAt: string;
  updatedAt: string;
}

interface DashboardData {
  conversations: Conversation[];
  visitors: unknown[];
  status: DashboardStatus | null;
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData>({
    conversations: [],
    visitors: [],
    status: null,
  });

  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [
        conversationsResponse,
        statusResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/api/conversations`),
        fetch(`${API_URL}/api/status`),
      ]);

      const conversations =
        await conversationsResponse.json();

      const status =
        await statusResponse.json();

      setData({
        conversations,
        visitors: [],
        status,
      });

    } catch (error) {
      console.error(
        "Dashboard loading failed",
        error
      );

    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {

    load();


    const socket = io(API_URL, {
      transports: [
        "websocket",
        "polling"
      ],
      withCredentials: true,
    });


    socket.on(
      "conversation:updated",
      () => {
        load();
      }
    );


    socket.on(
      "message:received",
      () => {
        load();
      }
    );


    const timer = setInterval(
      load,
      15000
    );


    return () => {
      clearInterval(timer);
      socket.disconnect();
    };

  }, []);


  return {
    ...data,
    loading,
    refresh: load,
  };
}
