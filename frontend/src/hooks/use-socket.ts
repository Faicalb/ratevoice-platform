'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    // In a real app, this URL should come from env vars
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    socketRef.current = io(socketUrl, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current?.id);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return socketRef.current;
};
