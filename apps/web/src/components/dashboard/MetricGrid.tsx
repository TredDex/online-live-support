interface MetricGridProps {
  activeChats: number;
  visitors: number;
  resolved: number;
  socket: string;
}

export default function MetricGrid({
  activeChats,
  visitors,
  resolved,
  socket,
}: MetricGridProps) {

  const metrics = [
    {
      label: "Active Chats",
      value: activeChats,
    },
    {
      label: "Visitors",
      value: visitors,
    },
    {
      label: "Resolved",
      value: resolved,
    },
    {
      label: "Socket",
      value: socket,
    },
  ];


  return (
    <div className="metric-grid">
      {metrics.map((item) => (
        <div
          className="stat-card"
          key={item.label}
        >
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}
