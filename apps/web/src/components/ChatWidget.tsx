import {
  useState,
} from 'react';

import type {
  Message,
  Conversation,
} from '../types/support';

import MessageList from './MessageList';

import type {
  Socket,
} from 'socket.io-client';


type Props = {
  socket: Socket | null;

  conversation: Conversation | null;

  setConversation:
    (c: Conversation) => void;

  messages: Message[];

  setMessages:
    (m: Message[]) => void;
};


export default function ChatWidget({
  socket,
  conversation,
  setConversation,
  messages,
  setMessages,
}: Props) {

  const [input, setInput] = useState('');


  function startChat() {

    if (!socket) return;


    const id = crypto.randomUUID();


    const c: Conversation = {
      conversationId: id,
      status: 'waiting_for_agent',
    };


    setConversation(c);


    socket.emit(
      'customer:create',
      {
        conversationId: id,
      },
    );
  }



  function send() {

    const text = input.trim();


    if (
      !text ||
      !conversation ||
      !socket
    ) {
      return;
    }


    const msg: Message = {
      id: crypto.randomUUID(),

      conversationId:
        conversation.conversationId,

      senderId: 'customer',

      senderRole: 'customer',

      message: text,

      timestamp:
        new Date().toISOString(),
    };


    setMessages([
      ...messages,
      msg,
    ]);


    socket.emit(
      'message:send',
      {
        conversationId:
          msg.conversationId,

        senderId:
          msg.senderId,

        senderRole:
          msg.senderRole,

        message:
          msg.message,
      },
    );


    setInput('');
  }



  return (
    <div className="chat-widget">

      <h2>
        💬 Live Support
      </h2>


      {
        !conversation ?

        <button onClick={startChat}>
          Start Chat
        </button>

        :

        <>

          <MessageList
            messages={messages}
          />


          <input
            value={input}
            onChange={
              e => setInput(
                e.target.value,
              )
            }
            placeholder="Type message..."
          />


          <button onClick={send}>
            Send
          </button>

        </>
      }

    </div>
  );
}
