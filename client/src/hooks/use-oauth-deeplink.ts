import { useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { supabase } from '@/lib/supabase';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

/**
 * Hook to handle deep link OAuth callbacks on mobile
 * Listens for com.eatio.app://login-callback URLs
 */
export function useOAuthDeepLink() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return; // Only run on mobile
    }

    const handleAppUrlOpen = async (event: { url: string }) => {
      console.log('[OAuth] Deep link received:', event.url);
      
      // Check if it's our OAuth callback
      if (event.url.startsWith('com.eatio.app://login-callback')) {
        try {
          // Close the in-app browser
          await Browser.close();
          
          // Extract the hash fragment from the URL
          // URL format: com.eatio.app://login-callback#access_token=...&refresh_token=...
          const hashIndex = event.url.indexOf('#');
          if (hashIndex !== -1) {
            const hashFragment = event.url.substring(hashIndex + 1);
            
            // Parse the hash fragment
            const params = new URLSearchParams(hashFragment);
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            
            if (accessToken && refreshToken) {
              // Set the session in Supabase
              const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              
              if (error) {
                console.error('[OAuth] Error setting session:', error);
              } else {
                console.log('[OAuth] Session set successfully');
              }
            }
          }
        } catch (error) {
          console.error('[OAuth] Error handling deep link:', error);
        }
      }
    };

    // Add listener for app URL open events
    CapacitorApp.addListener('appUrlOpen', handleAppUrlOpen);

    return () => {
      CapacitorApp.removeAllListeners();
    };
  }, []);
}
