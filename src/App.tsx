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
import { setBackgroundColorAsync } from "expo-navigation-bar";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import lightOrDarkColor from '@check-light-or-dark/color';

export default function App() {
  const webViewRef = React.useRef<WebView>(null);

  const [backgroundColor, setBackgroundColor] = React.useState("#000");
  React.useEffect(() => {
    if (Platform.OS === "android") {
      setBackgroundColorAsync(backgroundColor);
    }
  }, [backgroundColor]);

  const isDark = React.useMemo(() => lightOrDarkColor(backgroundColor) === 'dark' , [backgroundColor]);

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
    <View style={[styles.container, { backgroundColor }]}>
      <SafeAreaView />
      <ExpoStatusBar style={isDark ? "light" : "dark"} />
      <WebView
        ref={webViewRef}
        source={{ uri: "https://bskey.social/" }}
        style={styles.webview}
        scrollEnabled={false}
        applicationNameForUserAgent="Pskey mobile" // including 'mobile' to use mobile layout
        injectedJavaScript={`
        (() => {
          let value = '#fff';
          const styleObserver = new MutationObserver((mutations) => {
            const currentValue = mutations[0].target.style.getPropertyValue('--bg');

            if (currentValue !== value) {
              value = currentValue;
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'bgcolor', value }))
            }
          });

          styleObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['style'],
          });
        })();

        true
        `}
        onMessage={(event) => {
          const { type, value } = JSON.parse(event.nativeEvent.data) as {
            type: string;
            value: string;
          };
          console.log({ type, value });

          if (type === "bgcolor") setBackgroundColor(value);
        }}
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
