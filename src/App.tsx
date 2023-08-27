import React from "react";
import {
  Alert,
  Linking,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Pressable } from "react-native";
import RNBootSplash from "react-native-bootsplash";
import Dialog from "react-native-dialog";
import WebView from "react-native-webview";
import ImagedPicker from "@/ImagedPicker";
import { setBackgroundColor } from "@/background";
import ConfigModal from "@/components/configModal";
import Web from "@/components/web";
import { useTranslation } from "@/i18n";
import messageHandler from "@/notifications";
import * as ServerConfig from "@/serverConfig";
import { MKTheme, ThemeProvider } from "@/theme";
import { normalizeServerURL } from "@/utils";
import { usePushKeys } from "@/webPushCrypto";
import lightOrDarkColor from "@check-light-or-dark/color";
import messaging from "@react-native-firebase/messaging";

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
      const isLight = lightOrDarkColor(theme.background) === "light";
      setBackgroundColor(theme.background, isLight);
    }
  }, [theme.background]);
  const [style_fg, style_bg] = React.useMemo(() => {
    return [{ color: theme.foreground }, { backgroundColor: theme.background }];
  }, [theme]);

  const servers = ServerConfig.useServers();

  const webRef = React.useRef<WebView>(null);

  React.useEffect(() => {
    if (!servers.loading) RNBootSplash.hide();
  }, [servers.loading]);

  const [firstTick, setFirstTick] = React.useState(true);
  React.useEffect(() => {
    setFirstTick(false);
  }, []);

  React.useEffect(() => {
    const unsubscribe = messaging().onMessage(messageHandler);
    return unsubscribe;
  }, []);

  // ensure push keys are generated
  usePushKeys();

  return (
    <ThemeProvider value={theme}>
      <View style={[styles.container, style_bg]}>
        <SafeAreaView />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 10,
          }}
        >
          <ImagedPicker
            selectedValue={
              addServerModalVisible ? "_add" : servers.selected ?? "_add"
            }
            onChange={(itemValue) => {
              if (itemValue === null) return;
              if (itemValue === "_add") {
                setModalVisible(true);
              } else {
                servers.select(itemValue);
              }
            }}
            style={[{ flex: 1 }, style_fg, style_bg]}
            items={[
              ...Array.from(servers.servers)
                .sort((a, b) => b[1].lastUsedAt - a[1].lastUsedAt)
                .map(([k, v]) => ({
                  value: k,
                  label: v.name,
                  imageUrl: v.iconUrl,
                })),
              { value: "_add", label: t("addServer"), imageUrl: "" },
            ]}
          />
          <ServerAddDialog
            visible={
              (addServerModalVisible || servers.servers.size === 0) &&
              !firstTick
            }
            cancellable={servers.servers.size > 0}
            onClose={async (v: string | null) => {
              if (v === null) {
                setModalVisible(false);
                return;
              }
              try {
                v = normalizeServerURL(v);
              } catch (e) {
                Alert.alert(t("invalidURL"), t("confirmYourURL"));
                return Promise.reject();
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
                  return Promise.reject();
                });
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
                  t("deletingServer", {
                    serverName: servers.servers.get(configModal)!.name,
                  }),
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
            onRequestInject={(script) =>
              webRef.current?.injectJavaScript(script)
            }
          />
        )}
        {servers.selected === null ? (
          <Text style={{ flex: 1 }}>No servers</Text>
        ) : (
          <Web
            uri={`https://${servers.selected}${servers.path}`}
            key={servers.selected}
            style={styles.webview}
            onThemeChange={(newTheme) => setTheme(newTheme)}
            userScripts={servers.servers.get(servers.selected)!.userScripts}
            onOpenExternalURL={(url) => {
              if (!servers.openURL(url)) {
                Linking.openURL(url);
              }
            }}
            ref={webRef}
          />
        )}
      </View>
    </ThemeProvider>
  );
}

const ServerAddDialog: React.FC<{
  visible: boolean;
  onClose: (v: string | null) => Promise<void>;
  cancellable?: boolean;
}> = (props) => {
  const { t } = useTranslation();
  const [str, setStr] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const sendAndClose = () => {
    setPending(true);
    props
      .onClose(str)
      .then(() => {
        setStr("");
      })
      .catch(() => {})
      .finally(() => {
        setPending(false);
      });
  };

  return (
    <Dialog.Container visible={props.visible}>
      <Dialog.Title>{t("addingServer")}</Dialog.Title>
      <Dialog.Description>{t("enterServerURL")}</Dialog.Description>
      <Dialog.Input
        autoCapitalize="none"
        placeholder={"misskey.io"}
        onChangeText={setStr}
        onSubmitEditing={sendAndClose}
        value={str}
      />

      {props.cancellable && (
        <Dialog.Button
          label="Cancel"
          style={[pending && { opacity: 0.5 }]}
          disabled={pending}
          onPress={() => {
            props.onClose(null);
          }}
        />
      )}
      <Dialog.Button
        label="OK"
        style={[pending && { opacity: 0.5 }]}
        disabled={pending}
        onPress={sendAndClose}
      />
    </Dialog.Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "stretch",
    justifyContent: "center",
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
