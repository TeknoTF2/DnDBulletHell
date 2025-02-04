import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  useEffect(() => {
    const connect = () => {
      try {
        const socketConnection = io({
          path: '/socket.io/',
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
          transports: ['websocket', 'polling']
        });

        socketConnection.on('connect', () => {
          console.log('Connected to server');
          setIsConnected(true);
        });

        socketConnection.on('disconnect', () => {
          console.log('Disconnected from server');
          setIsConnected(false);
        });

        socketConnection.on('connect_error', (error) => {
          console.error('Connection error:', error);
          setConnectionAttempts(prev => prev + 1);
        });

        setSocket(socketConnection);

        return () => socketConnection.close();
      } catch (error) {
        console.error('Socket initialization error:', error);
      }
    };

    connect();
  }, []);

  if (connectionAttempts > 10) {
    return <div>Unable to connect to server. Please refresh the page.</div>;
  }

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
