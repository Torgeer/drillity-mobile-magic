import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.drillity',
  appName: 'Drillity',
  webDir: 'dist',
  server: {
    url: 'https://8965cbe0-3301-4877-950f-57cfb06b3e7a.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
