import type { Message } from '../types/support';

type Props = {
  messages: Message[];
};

export default function MessageList({
  messages,
}: Props) {

  return (
    <div className="message-list">

      {messages.map((m)=>(
        <div
          key={m.id}
          className={
            m.senderRole === 'customer'
            ? 'message customer'
            : 'message agent'
          }
        >

          <strong>
            {
              m.senderRole === 'customer'
              ? 'You'
              : 'Support'
            }
          </strong>

          <p>
            {m.message}
          </p>

          <small>
            {
              new Date(
                m.timestamp
              ).toLocaleTimeString()
            }
          </small>

        </div>
      ))}

    </div>
  );
}
