import { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,

  name: "PSkey",
  slug: "pskey",
  version: "1.1.1",
  orientation: "portrait",
  icon: "./src/assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./src/assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
  },
  android: {
    versionCode: 2,
    adaptiveIcon: {
      foregroundImage: "./src/assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    package: "dev.fuwa.pskey",
  },
  web: {
    favicon: "./src/assets/favicon.png",
  },
  extra: {
    eas: {
      projectId: "527fe02e-929e-458c-876a-ae76b6e854db",
    },
  },
  plugins: [
    "expo-localization",
  ],
});
