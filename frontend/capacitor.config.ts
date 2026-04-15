import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.palenterprise.ledger',
  appName: 'PAL Enterprise',
  webDir: 'dist',
  server: {
    // For development, point to your live backend
    // For production APK, the frontend is bundled inside the APK
    // and API calls go to the deployed Render backend
    url: undefined, // Set to undefined for production (uses bundled files)
    cleartext: true, // Allow HTTP for development
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#020617',
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#020617',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerColor: '#4f46e5',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#020617',
    },
  },
};

export default config;
