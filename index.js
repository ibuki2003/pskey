/**
 * @format
 */
import { AppRegistry } from "react-native";
import App from "./src/App";
import { name as appName } from "./src/app.json";
import messageHandler from "./src/notifications";
import {
  getMessaging,
  setBackgroundMessageHandler,
} from "@react-native-firebase/messaging";

const messaging = getMessaging();

setBackgroundMessageHandler(messaging, messageHandler);

AppRegistry.registerComponent(appName, () => App);
