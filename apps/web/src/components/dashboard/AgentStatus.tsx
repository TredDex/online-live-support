interface AgentStatusProps {
  status: {
    api: string;
    socket: string;
    service: string;
  } | null;
}

export default function AgentStatus({
  status,
}: AgentStatusProps) {

  return (
    <div className="dashboard-card">
      <h3>Agent Status</h3>

      <div>
        Status:{" "}
        {status
          ? "Online"
          : "Offline"}
      </div>

      <div>
        Socket:{" "}
        {status?.socket ?? "Unavailable"}
      </div>

    </div>
  );
}
