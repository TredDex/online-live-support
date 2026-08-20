import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const API_URL =
  import.meta.env.VITE_API_URL ||
  window.location.origin;

export function useSocket() {
  const [socket,setSocket] = useState<Socket | null>(null);
  const [connected,setConnected] = useState(false);

  useEffect(() => {

    const s = io(API_URL,{
      transports:[
        'websocket',
        'polling'
      ],
      withCredentials:true
    });

    s.on('connect',()=>{
      setConnected(true);
    });

    s.on('disconnect',()=>{
      setConnected(false);
    });

    setSocket(s);

    return ()=>{
      s.disconnect();
    };

  },[]);


  return {
    socket,
    connected
  };
}
