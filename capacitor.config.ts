import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.eatio.app',
  appName: 'Eatio',
  webDir: 'dist/public',
  server: {
    // Enable HTTPS/SSL error tolerance for development
    cleartext: true,
    androidScheme: 'https'
  },
  android: {
    // Allow network access for debugging
    allowMixedContent: true,
    // Enable web debugging
    webContentsDebuggingEnabled: true
  }
};

export default config;
