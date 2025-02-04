import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to the server's WebSocket
    const socketConnection = io(window.location.origin, {
      transports: ['websocket']
    });

    socketConnection.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    socketConnection.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    setSocket(socketConnection);

    return () => {
      socketConnection.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
