import React from "react";
import {
  Alert,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Pressable } from "react-native";
import DialogInput from "react-native-dialog-input";
import Web from "@/components/web";
import * as ServerConfig from "@/serverConfig";
import lightOrDarkColor from "@check-light-or-dark/color";
import { Picker } from "@react-native-picker/picker";
import { registerRootComponent } from "expo";
import { setBackgroundColorAsync } from "expo-navigation-bar";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";

export default function App() {
  const [addServerModalVisible, setModalVisible] = React.useState(false);

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

  const servers = ServerConfig.useServers();

  if (servers.loading) {
    return <Text>Loading...</Text>;
  }

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
          selectedValue={servers.selected}
          onValueChange={(itemValue) => {
            if (itemValue === null) return;
            if (itemValue === "_add") {
              setModalVisible(true);
            } else {
              servers.select(itemValue);
            }
          }}
          mode="dropdown"
          style={{ flex: 1 }}
        >
          {/* TODO: contentDescription; not released yet */}
          {Array.from(servers.servers)
            .sort((a, b) => b[1].lastUsedAt - a[1].lastUsedAt)
            .map(([k, v]) => (
              <Picker.Item key={k} label={v.name} value={k} />
            ))}
          <Picker.Item label="Add another server" value="_add" />
        </Picker>

        <DialogInput
          isDialogVisible={addServerModalVisible || servers.servers.size === 0}
          title="Add Server"
          message="Please enter the server URL."
          hintInput={"misskey.io"}
          submitInput={async (v: string) => {
            servers.add(v);
            setModalVisible(false);
          }}
          closeDialog={() => {
            setModalVisible(false);
          }}
        />

        <Pressable
          style={[styles.menuButton]}
          onPress={() => {
            const s = servers.selected;
            if (s === null) return;
            Alert.alert(
              "Are you sure?",
              'Delete "' + servers.servers.get(s)!.name + '"',
              [
                { text: "Cancel", onPress: () => {}, style: "cancel" },
                {
                  text: "OK",
                  onPress: () => {
                    servers.remove(s);
                  },
                  style: "destructive",
                },
              ]
            );
          }}
        >
          <Text style={styles.menuButtonText}>x</Text>
        </Pressable>
      </View>
      {servers.selected === null ? (
        <Text>No servers</Text>
      ) : (
        <Web
          uri={`https://${servers.selected}`}
          style={styles.webview}
          onBGColorChange={(color) => setBackgroundColor(color)}
        />
      )}
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

  menuButton: {
    padding: 10,
  },
  menuButtonText: {
    color: "#000",
    fontWeight: "bold",
    textAlign: "center",
  },
});

registerRootComponent(App);
