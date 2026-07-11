import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bahaicalendar.app',
  appName: "Bahá'í Calendar",
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      iosSpinnerStyle: 'small',
      spinnerColor: '#4bbdc2',
      showSpinner: false,
    },
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
