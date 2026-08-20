import MetricGrid from "../components/dashboard/MetricGrid";
import ActivityFeed from "../components/dashboard/ActivityFeed";
import LiveVisitors from "../components/dashboard/LiveVisitors";
import AgentStatus from "../components/dashboard/AgentStatus";
import MarketPanel from "../components/dashboard/MarketPanel";
import SystemHealth from "../components/dashboard/SystemHealth";
import { useDashboard } from "../hooks/useDashboard";

export default function Dashboard() {
  const data = useDashboard();

  return (
    <section className="dashboard-page">

      <MetricGrid />

      <div className="dashboard-grid">
        <LiveVisitors />
        <AgentStatus />
        <ActivityFeed />
        <MarketPanel />
        <SystemHealth />
      </div>

    </section>
  );
}
