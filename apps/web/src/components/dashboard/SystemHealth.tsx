interface SystemHealthProps {
  status: {
    api: string;
    socket: string;
    service: string;
  } | null;
}

export default function SystemHealth({
  status,
}: SystemHealthProps) {

  return (
    <div className="dashboard-card">
      <h3>System Health</h3>

      <div>
        API:
        {" "}
        {status?.api ?? "offline"}
      </div>

      <div>
        Socket:
        {" "}
        {status?.socket ?? "offline"}
      </div>

      <div>
        Service:
        {" "}
        {status?.service ?? "unknown"}
      </div>

    </div>
  );
}
