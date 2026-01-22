import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';

/**
 * OAuth callback page
 * Handles the redirect from OAuth providers and sets the session
 */
export default function LoginCallback() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the hash fragment from URL (contains tokens)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          // Set the session
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('[OAuth] Error setting session:', error);
            setLocation('/login');
          } else {
            console.log('[OAuth] Session set successfully, redirecting to home');
            setLocation('/');
          }
        } else {
          // No tokens found, redirect to login
          console.log('[OAuth] No tokens found in URL');
          setLocation('/login');
        }
      } catch (error) {
        console.error('[OAuth] Error in callback:', error);
        setLocation('/login');
      }
    };

    handleCallback();
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loggar in...</p>
      </div>
    </div>
  );
}
