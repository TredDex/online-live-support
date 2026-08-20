interface LiveVisitorsProps {
  visitors: unknown[];
}

export default function LiveVisitors({
  visitors,
}: LiveVisitorsProps) {

  return (
    <div className="dashboard-card">
      <h3>Live Visitors</h3>

      {visitors.length === 0 ? (
        <p>No active visitors</p>
      ) : (
        <ul>
          {visitors.map((visitor, index) => (
            <li key={index}>
              Visitor {index + 1}
            </li>
          ))}
        </ul>
      )}

    </div>
  );
}
