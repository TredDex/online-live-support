type Conversation = {
  id: string;
  visitorId: string;
  status: string;
};


export default function ConversationList({
  conversations,
  onSelect
}: {
  conversations: Conversation[];
  onSelect: (id: string) => void;
}) {

  return (
    <div className="conversation-list">

      <h2>
        Conversations
      </h2>

      {conversations.map((c) => (

        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className="conversation-item"
        >

          <div>
            Visitor {c.visitorId}
          </div>

          <span>
            {c.status}
          </span>

        </button>

      ))}

    </div>
  );

}
