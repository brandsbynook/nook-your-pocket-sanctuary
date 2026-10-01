import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.vercel.nook_sanctuary',
  appName: 'nook.',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
