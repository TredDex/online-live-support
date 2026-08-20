import { useEffect, useState } from "react";
import { io } from "socket.io-client";


type Conversation = {
  id: string;
  conversationId: string;
  visitorId: string;
  status: string;
};


const API_URL =
import.meta.env.VITE_API_URL ??
"http://127.0.0.1:3000";


export function useConversations(){

  const [conversations,setConversations] =
    useState<Conversation[]>([]);


  useEffect(()=>{

    fetch(`${API_URL}/api/conversations`)
      .then(res=>res.json())
      .then(data=>{

        setConversations(
          data.map((c:any)=>({
            id:c.conversationId,
            conversationId:c.conversationId,
            visitorId:c.visitorId,
            status:c.status
          }))
        );

      })
      .catch(console.error);



    const socket = io(API_URL,{
      transports:["websocket","polling"],
      withCredentials:true
    });



    socket.on(
      "conversation:incoming",
      (conversation:any)=>{

        const incoming:Conversation={
          id:conversation.conversationId,
          conversationId:conversation.conversationId,
          visitorId:conversation.visitorId,
          status:conversation.status
        };


        setConversations(prev=>{

          const exists =
          prev.some(
            c=>c.id===incoming.id
          );


          return exists
          ? prev
          : [
              incoming,
              ...prev
            ];

        });

      }
    );



    socket.on(
      "conversation:updated",
      (conversation:any)=>{

        setConversations(prev=>

          prev.map(c=>

            c.id===conversation.conversationId

            ?

            {
              ...c,
              status:conversation.status
            }

            :

            c

          )

        );

      }
    );



    return ()=>{

      socket.disconnect();

    };


  },[]);



  return {
    conversations
  };

}
