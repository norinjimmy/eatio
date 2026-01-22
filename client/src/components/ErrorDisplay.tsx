import { useEffect, useState } from 'react';

interface ErrorLog {
  type: 'error' | 'rejection';
  message: string;
  timestamp: number;
}

export function ErrorDisplay() {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setErrors(prev => [...prev, {
        type: 'error',
        message: event.error?.message || event.message || 'Unknown error',
        timestamp: Date.now()
      }]);
      setVisible(true);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      setErrors(prev => [...prev, {
        type: 'rejection',
        message: event.reason?.message || String(event.reason) || 'Unknown rejection',
        timestamp: Date.now()
      }]);
      setVisible(true);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  // Don't render if no errors
  if (errors.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.95)',
      color: 'white',
      zIndex: 99999,
      padding: '20px',
      overflow: 'auto',
      fontFamily: 'monospace',
      fontSize: '12px',
      pointerEvents: visible ? 'auto' : 'none',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.2s'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ color: '#ff4444', margin: 0 }}>⚠️ Error Log ({errors.length})</h2>
        <button 
          onClick={() => setVisible(false)}
          style={{
            background: '#333',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Close
        </button>
      </div>
      {errors.map((error, i) => (
        <div key={i} style={{
          background: '#1a1a1a',
          padding: '12px',
          marginBottom: '10px',
          borderRadius: '4px',
          borderLeft: `4px solid ${error.type === 'error' ? '#ff4444' : '#ff8844'}`
        }}>
          <div style={{ color: '#888', fontSize: '10px', marginBottom: '4px' }}>
            {new Date(error.timestamp).toLocaleTimeString()} - {error.type}
          </div>
          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {error.message}
          </div>
        </div>
      ))}
      <div style={{ marginTop: '20px', padding: '12px', background: '#1a1a1a', borderRadius: '4px' }}>
        <strong>Environment:</strong>
        <div style={{ marginTop: '8px' }}>
          API_URL: {import.meta.env.VITE_API_URL || '(not set)'}
        </div>
        <div>
          SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL || '(not set)'}
        </div>
        <div>
          HAS_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Yes' : 'No'}
        </div>
      </div>
    </div>
  );
}
