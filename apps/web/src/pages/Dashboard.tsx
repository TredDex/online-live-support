import MetricGrid from "../components/dashboard/MetricGrid";
import ActivityFeed from "../components/dashboard/ActivityFeed";
import LiveVisitors from "../components/dashboard/LiveVisitors";
import AgentStatus from "../components/dashboard/AgentStatus";
import MarketPanel from "../components/dashboard/MarketPanel";
import SystemHealth from "../components/dashboard/SystemHealth";
import { useDashboard } from "../hooks/useDashboard";

export default function Dashboard() {
  const {
    conversations,
    visitors,
    status,
    loading
  } = useDashboard();


  if (loading) {
    return (
      <section className="dashboard-page">
        <h2>Loading support dashboard...</h2>
      </section>
    );
  }


  const activeChats = conversations.filter(
    (item) =>
      item.status !== "resolved"
  ).length;


  const resolvedChats = conversations.filter(
    (item) =>
      item.status === "resolved"
  ).length;


  return (
    <section className="dashboard-page">

      <MetricGrid
        activeChats={activeChats}
        visitors={visitors.length}
        resolved={resolvedChats}
        socket={status?.socket ?? "offline"}
      />


      <div className="dashboard-grid">

        <LiveVisitors
          visitors={visitors}
        />


        <AgentStatus
          status={status}
        />


        <ActivityFeed
          conversations={conversations}
        />


        <MarketPanel />


        <SystemHealth
          status={status}
        />

      </div>

    </section>
  );
}
