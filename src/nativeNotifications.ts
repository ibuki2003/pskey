import { NativeModules } from "react-native";

const { NativeNotifications } = NativeModules;

export interface NotificationOptions {
  id: string;
  group: string;
  title?: string;
  body?: string;
  subtitle?: string;
  when?: string; // decimal string of unix timestamp millis
  server_domain?: string;

  badgeUrl?: string;
  iconUrl?: string;
}

export const makeNotification: (opts: NotificationOptions) => Promise<void> =
  NativeNotifications.makeNotification;
