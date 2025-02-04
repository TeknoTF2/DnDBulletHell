import '../styles/globals.css';
import { SocketProvider } from '../context/SocketContext';
import { useEffect } from 'react';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Add visible console logging on the client
    console.log('App mounted');
    
    // Log any unhandled errors
    window.onerror = function(msg, url, lineNo, columnNo, error) {
      console.error('Window Error:', { msg, url, lineNo, columnNo, error });
      return false;
    };

    window.onunhandledrejection = function(event) {
      console.error('Unhandled Promise Rejection:', event.reason);
    };
  }, []);

  return (
    <div style={{ minHeight: '100vh' }}>
      <SocketProvider>
        <Component {...pageProps} />
      </SocketProvider>
    </div>
  );
}

export default MyApp;
