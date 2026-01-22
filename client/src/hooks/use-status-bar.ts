import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

/**
 * Configure status bar for mobile devices
 * Makes status bar light/dark based on theme and overlays content properly
 */
export function useStatusBar() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return; // Only run on mobile
    }

    const configureStatusBar = async () => {
      try {
        // Set status bar style (light content for dark background, dark for light)
        await StatusBar.setStyle({ style: Style.Light });
        
        // Make status bar overlay the webview (allows content behind it)
        await StatusBar.setOverlaysWebView({ overlay: true });
        
        // Set background color with transparency
        await StatusBar.setBackgroundColor({ color: '#00000000' }); // Transparent
        
        console.log('[StatusBar] Configured successfully');
      } catch (error) {
        console.error('[StatusBar] Configuration error:', error);
      }
    };

    configureStatusBar();
  }, []);
}
