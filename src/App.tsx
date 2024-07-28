import React from "react";
import {
  Alert,
  Linking,
  NativeAppEventEmitter,
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
import Web, { WVRequester } from "@/components/web";
import { useTranslation } from "@/i18n";
import messageHandler, { unregisterRegistration } from "@/notifications";
import * as ServerConfig from "@/serverConfig";
import { MKTheme, ThemeProvider } from "@/theme";
import { normalizeServerURL } from "@/utils";
import { usePushKeys } from "@/webPushCrypto";
import lightOrDarkColor from "@check-light-or-dark/color";
import messaging from "@react-native-firebase/messaging";

type IntentExtras = { [key: string]: string };
interface IntentArgs {
  extras: IntentExtras;
}

const getIntentURL = (e: IntentExtras) => {
  if (!("type" in e)) return;
  const t = e.type;

  switch (t) {
    case "NOTIFICATION_TAP": {
      return (e.url ?? e.server_domain)
        ? `https://${e.server_domain}/my/notifications`
        : null;
    }
  }
};

export default function App(props: {
  initial_extras: IntentExtras;
}): React.JSX.Element {
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

  const webRef = React.useRef<WebView>(null);
  const requesterRef = React.useRef<WVRequester | null>(null);

  const servers = ServerConfig.useServers(() => {
    if (props.initial_extras) {
      return getIntentURL(props.initial_extras) ?? null;
    }
    return null;
  });

  React.useEffect(() => {
    if (servers.selected === null) return;
    const server = servers.servers.get(servers.selected)!;
    if (server.themeCache !== undefined) {
      setTheme(server.themeCache);
    }
  }, [servers.selected, servers.servers]);

  React.useEffect(() => {
    if (!servers.loading) RNBootSplash.hide();
  }, [servers.loading]);

  React.useEffect(() => {
    // ensure FCM works
    messaging().getToken();
  }, []);

  React.useEffect(() => {
    const unsubscribe = messaging().onMessage(messageHandler);
    return unsubscribe;
  }, []);

  // intent handler
  React.useEffect(() => {
    // first intent from props

    const listener = NativeAppEventEmitter.addListener(
      "onIntent",
      (e: IntentArgs) => {
        if (e.extras) {
          const url = getIntentURL(e.extras);
          if (url) {
            webRef.current?.injectJavaScript(`location.href = "${url}"`);
          }
        }
      }
    );

    return () => {
      listener.remove();
    };
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
              addServerModalVisible ? "_add" : (servers.selected ?? "_add")
            }
            onChange={(itemValue) => {
              if (itemValue === null) return;
              if (itemValue === servers.selected) return;
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
              addServerModalVisible ||
              (servers.servers.size === 0 && !servers.loading)
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
                        unregisterRegistration(configModal);
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
            requester={requesterRef.current}
          />
        )}
        {servers.selected === null ? (
          <Text style={{ flex: 1 }}>No servers</Text>
        ) : (
          <Web
            uri={`https://${servers.selected}${servers.path}`}
            key={servers.selected}
            innerProps={{
              style: styles.webview,
            }}
            onThemeChange={(newTheme) => {
              const oldConfig = servers.servers.get(servers.selected!)!;
              if (
                JSON.stringify(oldConfig.themeCache) !==
                JSON.stringify(newTheme)
              ) {
                servers.update(servers.selected!, {
                  ...servers.servers.get(servers.selected!)!,
                  themeCache: newTheme,
                });
              }
              setTheme(newTheme);
            }}
            userScripts={servers.servers.get(servers.selected)!.userScripts}
            onOpenExternalURL={(url) => {
              if (!servers.openExternal(url)) {
                Linking.openURL(url);
              }
            }}
            innerRef={webRef}
            requesterRef={requesterRef}
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
        autoFocus={true}
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
