import React from "react";
import {
  BackHandler,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { registerRootComponent } from "expo";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";

export default function App() {
  const webViewRef = React.useRef<WebView>(null);

  const handleBack = React.useCallback(() => {
    try {
      webViewRef.current?.goBack();
    } catch (err) {
      console.log(err);
    }
    return true;
  }, [webViewRef]);

  React.useEffect(() => {
    BackHandler.addEventListener("hardwareBackPress", handleBack);
    return () => {
      BackHandler.removeEventListener("hardwareBackPress", handleBack);
    };
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView />
      <ExpoStatusBar style="auto" />
      <WebView
        ref={webViewRef}
        source={{ uri: "https://bskey.social/" }}
        style={styles.webview}
        scrollEnabled={false}
        applicationNameForUserAgent="Pskey mobile" // including 'mobile' to use mobile layout
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "stretch",
    justifyContent: "center",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },

  webview: {
    flex: 1,
  },
});

registerRootComponent(App);
