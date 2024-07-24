import React from "react";
import {
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { TabBar, TabView } from "react-native-tab-view";
import ScriptsEditor from "./scriptsEditor";
import { WVRequester, minifyScript } from "./web";
import { useTranslation } from "@/i18n";
import {
  registerServiceWorker,
  unregisterRegistration,
  unregisterServiceWorker,
} from "@/notifications";
import { ScriptsList, parseScripts, serializeScripts } from "@/scriptsConfig";
import { ServerConfig } from "@/serverConfig";
import { useTheme } from "@/theme";

interface Props {
  oldConfig: ServerConfig;
  open: boolean;

  // null: delete, false: cancel
  onClose: (config: ServerConfig | null | false) => void;
  requester: WVRequester | null;
}

// remove from DB, force revalidate api cache, and reload
const EMOJI_REFRESH_SCRIPT = minifyScript(`
(() => {
  const req = fetch('/api/emojis?', { cache: 'no-cache' });
  const db = window.indexedDB.open('keyval-store');
  db.onsuccess = (e) => {
    const trans = e.target.result.transaction('keyval', 'readwrite');
    const store = trans.objectStore('keyval');
    store.delete('emojis');
    store.delete('lastEmojisFetchedAt');
    trans.oncomplete = () => {
      console.log('done');
      req.then(() => location.reload());
    }
  };
})();
`);

const ConfigModal: React.FC<Props> = (props) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [style_fg, style_bg] = React.useMemo(() => {
    return [{ color: theme.foreground }, { backgroundColor: theme.background }];
  }, [theme]);

  // editing props
  const [scripts, setScripts] = React.useState<ScriptsList>([]);
  const [stylesheets, setStylesheets] = React.useState<ScriptsList | null>(
    null
  );

  React.useEffect(() => {
    setScripts(props.oldConfig.userScripts);
  }, [props.oldConfig]);

  React.useEffect(() => {
    setStylesheets(null);
    if (props.open) {
      props
        .requester?.("localStorage.getItem('customCss') ?? ''")
        .then((s) => {
          setStylesheets(parseScripts(s));
        })
        .catch((e) => Alert.alert(t("errorOccured"), e.message));
    }
  }, [props.open]);

  const saveAndClose = async () => {
    if (stylesheets !== null)
      await props.requester?.(
        `localStorage.setItem('customCss', ${JSON.stringify(serializeScripts(stylesheets))})`
      );
    props.onClose({
      ...props.oldConfig,
      userScripts: scripts,
    });
  };

  const customTabBar: typeof TabBar = React.useCallback(
    (props) => (
      <TabBar
        {...props}
        indicatorStyle={{
          backgroundColor: theme.foreground,
        }}
        style={{
          backgroundColor: "transparent",
        }}
        activeColor={theme.foreground}
        inactiveColor={theme.foreground}
      />
    ),
    [theme]
  );

  const [tnIndex, setTnIndex] = React.useState(0);
  const tnTabs = React.useMemo(
    () => [
      { key: "main", title: t("settings.general") },
      { key: "experimental", title: t("settings.experimental") },
      { key: "info", title: t("settings.info") },
    ],
    []
  );

  const mainTab = (
    <View style={styles.flexView}>
      <View style={styles.flexView}>
        <ScriptsEditor
          title={t("customScripts")}
          value={scripts}
          updateValue={setScripts}
          style_fg={style_fg}
          style_bg={style_bg}
        />
        <ScriptsEditor
          title={t("customCSS")}
          value={stylesheets}
          updateValue={setStylesheets}
          style_fg={style_fg}
          style_bg={style_bg}
        />
      </View>
      <Pressable
        style={[styles.button, styles.buttonRemove]}
        onPress={() => props.onClose(null)}
      >
        <Text style={[styles.textStyle]}>{t("deleteThisServer")}</Text>
      </Pressable>
      <Pressable
        style={[styles.button, styles.buttonSave]}
        onPress={saveAndClose}
      >
        <Text style={styles.textStyle}>{t("saveAndClose")}</Text>
      </Pressable>
    </View>
  );

  const experimentalTab = (
    <View style={styles.flexView}>
      <Text style={[style_fg, styles.headingText]}>
        {t("pushNotifications")}
      </Text>
      {/* @ts-expect-error key Release does exist */}
      {Platform.constants["Release"] < 8 ? (
        <Text style={[style_fg, styles.noteText]}>
          {t("becauseOfVersion") + t("pushNotificationsUnsupported")}
        </Text>
      ) : (
        <>
          <Text style={[style_fg, styles.noteText]}>
            {t("pushNotificationsAbout")}
          </Text>
          <Pressable
            style={[styles.button, styles.buttonSave]}
            onPress={() => {
              registerServiceWorker(props.oldConfig.domain)
                .then((s) => props.requester?.(s))
                .catch((e) => Alert.alert(t("errorOccured"), e.message));
            }}
          >
            <Text style={styles.textStyle}>{t("pushNotificationsEnable")}</Text>
          </Pressable>

          <Text style={[style_fg, styles.noteText]}>
            {t("pushNotificationsUnregisterAbout")}
          </Text>
          <Pressable
            style={[styles.button, styles.buttonRemove]}
            onPress={() => {
              unregisterServiceWorker(props.oldConfig.domain)
                .then((s) => props.requester?.(s))
                .catch((e) => Alert.alert(t("errorOccured"), e.message));
            }}
          >
            <Text style={styles.textStyle}>
              {t("pushNotificationsUnregister")}
            </Text>
          </Pressable>

          <Text style={[style_fg, styles.noteText]}>
            {t("pushNotificationsDeleteAbout")}
          </Text>
          <Pressable
            style={[styles.button, styles.buttonRemove]}
            onPress={() => {
              unregisterRegistration(props.oldConfig.domain)
                .then(() => Alert.alert(t("registrationSuccessful")))
                .catch((e) => Alert.alert(t("errorOccured"), e.message));
            }}
          >
            <Text style={styles.textStyle}>{t("pushNotificationsDelete")}</Text>
          </Pressable>
        </>
      )}

      <Text style={[style_fg, styles.headingText]}>{t("refreshEmojis")}</Text>
      <Text style={[style_fg, styles.noteText]}>{t("refreshEmojisAbout")}</Text>
      <Pressable
        style={[styles.button, styles.buttonSave]}
        onPress={() =>
          props
            .requester?.(EMOJI_REFRESH_SCRIPT)
            .catch((e) => Alert.alert(t("errorOccured"), e.message))
        }
      >
        <Text style={styles.textStyle}>{t("refreshEmojis")}</Text>
      </Pressable>
    </View>
  );

  const infoTab = (
    <View style={styles.flexView}>
      <Image
        source={{ uri: "splash_icon" }}
        style={{ width: 100, height: 100 }}
      />
      <Text style={[style_fg, styles.headingText]}>PSkey v1.7.1</Text>
      <Text style={[style_fg, styles.noteText]}>{t("aboutPSkey")}</Text>
      <Pressable
        onPress={() => {
          Linking.openURL("https://github.com/ibuki2003/pskey/wiki");
        }}
      >
        <Text style={[style_fg, styles.noteText, styles.linkText]}>
          https://github.com/ibuki2003/pskey/wiki
        </Text>
      </Pressable>
    </View>
  );

  return (
    <Modal animationType="none" transparent={true} visible={props.open}>
      <View style={styles.centeredView}>
        <View style={[styles.modalView, style_bg]}>
          <View style={[styles.modalTitleView]}>
            <Text style={[styles.modalTitle, style_fg]}>
              {t("serverConfigFor", { serverName: props.oldConfig.name })}
            </Text>
            <Pressable onPress={() => props.onClose(false)} role="button">
              <Text style={[{ fontSize: 20 }, style_fg]} aria-label="close">
                X
              </Text>
            </Pressable>
          </View>
          <TabView
            style={styles.flexView}
            navigationState={{
              index: tnIndex,
              routes: tnTabs,
            }}
            renderTabBar={customTabBar}
            onIndexChange={setTnIndex}
            renderScene={({ route }) => {
              switch (route.key) {
                case "main":
                  return mainTab;
                case "experimental":
                  return experimentalTab;
                case "info":
                  return infoTab;
              }
            }}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    width: "90%",
    height: "95%",
    margin: 10,
    borderRadius: 5,
    padding: 15,
    paddingTop: 5,
    elevation: 5,
    alignItems: "stretch",
  },

  flexView: {
    flex: 1,
  },

  modalTitleView: {
    marginVertical: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    flex: 1,
    textAlign: "center",
  },

  textStyle: {
    fontWeight: "bold",
    textAlign: "center",
  },

  codeEditor: {
    flex: 1,
    height: 300,
    borderColor: "#888",
    borderWidth: 1,
    textAlignVertical: "top",
    fontFamily: "monospace",
  },

  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginVertical: 5,
  },
  buttonRemove: {
    backgroundColor: "#f99",
  },
  buttonSave: {
    backgroundColor: "#29f",
  },

  headingText: {
    marginTop: 5,
    fontSize: 15,
    fontWeight: "bold",
  },
  noteText: {
    fontSize: 12,
    lineHeight: 17,
  },
  linkText: {
    color: "#29f",
    textDecorationLine: "underline",
  },
});

export default ConfigModal;
