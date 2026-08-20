interface Conversation {
  conversationId: string;
  visitorId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ActivityFeedProps {
  conversations: Conversation[];
}

export default function ActivityFeed({
  conversations,
}: ActivityFeedProps) {

  return (
    <div className="dashboard-card">
      <h3>Conversation Activity</h3>

      {conversations.length === 0 ? (
        <p>No conversations yet</p>
      ) : (
        <ul>
          {conversations.map((conversation) => (
            <li key={conversation.conversationId}>
              {conversation.visitorId}
              {" - "}
              {conversation.status}
            </li>
          ))}
        </ul>
      )}

    </div>
  );
}
