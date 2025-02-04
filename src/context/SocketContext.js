import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const connect = () => {
      try {
        // Log connection attempt
        console.log('Attempting to connect to Socket.IO server...');
        
        const socketConnection = io({
          path: '/socket.io/',
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
          transports: ['websocket', 'polling']
        });

        socketConnection.on('connect', () => {
          console.log('Successfully connected to Socket.IO server');
          setIsConnected(true);
          setError(null);
        });

        socketConnection.on('disconnect', () => {
          console.log('Disconnected from Socket.IO server');
          setIsConnected(false);
        });

        socketConnection.on('connect_error', (error) => {
          console.error('Socket.IO connection error:', error);
          setError(error.message);
        });

        setSocket(socketConnection);

        return () => {
          console.log('Cleaning up socket connection');
          socketConnection.close();
        };
      } catch (error) {
        console.error('Socket initialization error:', error);
        setError(error.message);
      }
    };

    connect();
  }, []);

  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        margin: '20px', 
        border: '2px solid red',
        borderRadius: '8px',
        backgroundColor: '#fff'
      }}>
        <h2>Connection Error</h2>
        <p>{error}</p>
        <p>Please check your network connection and refresh the page.</p>
      </div>
    );
  }

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {!isConnected ? (
        <div style={{ 
          padding: '20px', 
          margin: '20px', 
          border: '2px solid #ccc',
          borderRadius: '8px',
          backgroundColor: '#fff'
        }}>
          <h2>Connecting to server...</h2>
          <p>Please wait while we establish connection.</p>
        </div>
      ) : children}
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
