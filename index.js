/**
 * @format
 */
import { AppRegistry } from "react-native";
import App from "./src/App";
import { name as appName } from "./src/app.json";
import messageHandler from "./src/notifications";
import messaging from "@react-native-firebase/messaging";

// Register background handler
messaging().setBackgroundMessageHandler(messageHandler);

AppRegistry.registerComponent(appName, () => App);
