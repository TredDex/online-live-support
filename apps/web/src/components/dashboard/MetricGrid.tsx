import StatCard from "./StatCard";

export default function MetricGrid(){
  return (
    <div className="metric-grid">
      <StatCard title="Active Chats" value="0" />
      <StatCard title="Waiting Visitors" value="0" />
      <StatCard title="AI Resolutions" value="0%" />
      <StatCard title="Response Time" value="<1 min" />
    </div>
  );
}
