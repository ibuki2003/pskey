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
import WebView from "react-native-webview";
import ConfigModal from "./components/configModal";
import { normalizeServerURL } from "./utils";
import Web from "@/components/web";
import { useTranslation } from "@/i18n";
import * as ServerConfig from "@/serverConfig";
import { MKTheme, ThemeProvider } from "@/theme";
import lightOrDarkColor from "@check-light-or-dark/color";
import { Picker } from "@react-native-picker/picker";
import { registerRootComponent } from "expo";
import { setBackgroundColorAsync } from "expo-navigation-bar";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";

export default function App() {
  const { t } = useTranslation();

  const [addServerModalVisible, setModalVisible] = React.useState(false);

  const [configModal, setConfigModal] = React.useState<string | null>(null);

  const [theme, setTheme] = React.useState<MKTheme>({
    background: "#fff",
    foreground: "#000",
  });
  React.useEffect(() => {
    if (Platform.OS === "android") {
      setBackgroundColorAsync(theme.background);
    }
  }, [theme.background]);
  const [style_fg, style_bg] = React.useMemo(() => {
    return [{ color: theme.foreground }, { backgroundColor: theme.background }];
  }, [theme]);

  const isDark = React.useMemo(
    () => lightOrDarkColor(theme.background) === "dark",
    [theme.background]
  );
  console.log({ isDark });

  const servers = ServerConfig.useServers();

  const webRef = React.useRef<WebView>(null);

  if (servers.loading) {
    return <Text>Loading...</Text>;
  }

  return (
    <ThemeProvider value={theme}>
      <View style={[styles.container, style_bg]}>
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
            style={[{ flex: 1 }, style_fg]}
            dropdownIconColor={theme.foreground}
          >
            {/* TODO: contentDescription; not released yet */}
            {Array.from(servers.servers)
              .sort((a, b) => b[1].lastUsedAt - a[1].lastUsedAt)
              .map(([k, v]) => (
                <Picker.Item key={k} label={v.name} value={k} />
              ))}
            <Picker.Item label={t("addServer")} value="_add" />
          </Picker>

          <DialogInput
            isDialogVisible={
              addServerModalVisible || servers.servers.size === 0
            }
            title={t("addingServer")}
            message={t("enterServerURL")}
            hintInput={"misskey.io"}
            submitInput={async (v: string) => {
              try {
                v = normalizeServerURL(v);
              } catch (e) {
                Alert.alert(t("invalidURL"), t("confirmYourURL"));
                return;
              }
              await servers
                .add(v)
                .then(() => {
                  setModalVisible(false);
                })
                .catch((e) => {
                  Alert.alert(
                    t("failedToFetchServer"),
                    t("confirmYourURL") + "\n" + e.message
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
              style={[styles.menuButtonText, style_fg]}
              aria-label={t("serverConfig")}
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
                  t("deletingServer_s").replace(
                    "%s",
                    servers.servers.get(configModal)!.name
                  ),
                  t("areYouSure"),
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
                webRef.current?.reload();
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
            key={servers.selected}
            style={styles.webview}
            onThemeChange={(newTheme) => setTheme(newTheme)}
            userScripts={servers.servers.get(servers.selected)!.userScripts}
            ref={webRef}
          />
        )}
      </View>
    </ThemeProvider>
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
