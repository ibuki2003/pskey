import { NativeModules } from "react-native";

const { NativeNotifications } = NativeModules;

interface NotificationOptions {
  id: string;
  group: string;
  title?: string;
  body?: string;
  subtitle?: string;
  when?: string; // decimal string of unix timestamp millis

  badgeUrl?: string;
  iconUrl?: string;
}

export const makeNotification: (opts: NotificationOptions) => Promise<void> =
  NativeNotifications.makeNotification;
