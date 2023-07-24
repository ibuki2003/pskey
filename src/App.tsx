import React from "react";
import {
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import Web from "@/components/web";
import lightOrDarkColor from "@check-light-or-dark/color";
import { Picker } from "@react-native-picker/picker";
import { registerRootComponent } from "expo";
import { setBackgroundColorAsync } from "expo-navigation-bar";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";

export default function App() {
  const [backgroundColor, setBackgroundColor] = React.useState("#000");
  React.useEffect(() => {
    if (Platform.OS === "android") {
      setBackgroundColorAsync(backgroundColor);
    }
  }, [backgroundColor]);

  const isDark = React.useMemo(
    () => lightOrDarkColor(backgroundColor) === "dark",
    [backgroundColor]
  );

  const [selectedServer, setSelectedServer] = React.useState("bskey.social");

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <SafeAreaView />
      <ExpoStatusBar style={isDark ? "light" : "dark"} />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 10,
        }}
      >
        <Picker
          selectedValue={selectedServer}
          onValueChange={(itemValue) => setSelectedServer(itemValue)}
          mode="dropdown"
          style={{ flex: 1 }}
        >
          {/* TODO: contentDescription; not released yet */}
          <Picker.Item label="ぶるーすきー!" value="bskey.social" />
          <Picker.Item label="misskey.io" value="misskey.io" />
        </Picker>
      </View>
      <Web
        uri={`https://${selectedServer}`}
        style={styles.webview}
        onBGColorChange={(color) => setBackgroundColor(color)}
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
