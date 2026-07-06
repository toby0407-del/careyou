import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "tw.rehabbridge.app",
  appName: "倍伴練",
  webDir: "dist",
  ios: {
    contentInset: "never",
    allowsLinkPreview: false,
    scrollEnabled: false,
  },
  server: {
    androidScheme: "https",
    iosScheme: "capacitor",
  },
};

export default config;
