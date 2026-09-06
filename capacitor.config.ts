import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bahaicalendar.app',
  appName: "Bahá'í Calendar",
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#ffffff',
      iosSpinnerStyle: 'small',
      spinnerColor: '#4bbdc2',
      showSpinner: false,
    },
    CapacitorHttp: {
      enabled: true,
    },
    Keyboard: {
      resize: 'body',
    },
  },
};

export default config;
