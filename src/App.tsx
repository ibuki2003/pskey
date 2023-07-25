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
import ConfigModal from "./components/configModal";
import { normalizeServerURL } from "./utils";
import Web from "@/components/web";
import * as ServerConfig from "@/serverConfig";
import lightOrDarkColor from "@check-light-or-dark/color";
import { Picker } from "@react-native-picker/picker";
import { registerRootComponent } from "expo";
import { setBackgroundColorAsync } from "expo-navigation-bar";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";

export default function App() {
  const [addServerModalVisible, setModalVisible] = React.useState(false);

  const [configModal, setConfigModal] = React.useState<string | null>(null);

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
  console.log({ isDark });

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
          style={[{ flex: 1 }, isDark && styles.textDarkTheme]}
          dropdownIconColor={isDark ? "#fff" : "#000"}
        >
          {/* TODO: contentDescription; not released yet */}
          {Array.from(servers.servers)
            .sort((a, b) => b[1].lastUsedAt - a[1].lastUsedAt)
            .map(([k, v]) => (
              <Picker.Item key={k} label={v.name} value={k} />
            ))}
          <Picker.Item label="別のサーバーを追加" value="_add" />
        </Picker>

        <DialogInput
          isDialogVisible={addServerModalVisible || servers.servers.size === 0}
          title="サーバーを追加する"
          message="サーバーURLを入力してください"
          hintInput={"misskey.io"}
          submitInput={async (v: string) => {
            try {
              v = normalizeServerURL(v);
            } catch (e) {
              Alert.alert(
                "サーバーURLの形式が間違っています。",
                "入力したURLが正しいか確認してください。"
              );
              return;
            }
            await servers
              .add(v)
              .then(() => {
                setModalVisible(false);
              })
              .catch((e) => {
                Alert.alert(
                  "サーバー情報の取得に失敗しました。",
                  "入力したURLが正しいか確認してください。\n" + e.message
                );
              });
          }}
          closeDialog={() => {
            setModalVisible(false);
          }}
        />

        <Pressable
          style={[styles.menuButton]}
          onPress={() => {
            setConfigModal(servers.selected);
          }}
          role="button"
        >
          <Text
            style={[styles.menuButtonText, isDark && styles.textDarkTheme]}
            aria-label="サーバーの設定"
          >
            ...
          </Text>
        </Pressable>
      </View>
      {configModal && (
        <ConfigModal
          open={configModal !== null}
          oldConfig={servers.servers.get(configModal)!}
          onClose={(v) => {
            if (v === false) {
              setConfigModal(null);
              return;
            }
            if (v === null) {
              Alert.alert(
                "Are you sure?",
                'Delete "' + servers.servers.get(configModal)!.name + '"',
                [
                  { text: "Cancel", onPress: () => {}, style: "cancel" },
                  {
                    text: "OK",
                    onPress: () => {
                      setConfigModal(null);
                      servers.remove(configModal);
                    },
                    style: "destructive",
                  },
                ]
              );
            } else {
              servers.update(configModal, v);
              setConfigModal(null);
            }
          }}
        />
      )}
      {servers.selected === null ? (
        <Text>No servers</Text>
      ) : (
        <Web
          uri={`https://${servers.selected}`}
          style={styles.webview}
          onBGColorChange={(color) => setBackgroundColor(color)}
          userScripts={servers.servers.get(servers.selected)!.userScripts}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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

  textDarkTheme: {
    color: "#fff",
  },
});

registerRootComponent(App);
