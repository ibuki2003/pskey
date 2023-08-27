import React from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "@/i18n";
import { registerServiceWorker } from "@/notifications";
import { ServerConfig } from "@/serverConfig";
import { useTheme } from "@/theme";

interface Props {
  oldConfig: ServerConfig;
  open: boolean;

  // null: delete, false: cancel
  onClose: (config: ServerConfig | null | false) => void;
  onRequestInject: (script: string) => void;
}

const ConfigModal: React.FC<Props> = (props) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [style_fg, style_bg] = React.useMemo(() => {
    return [{ color: theme.foreground }, { backgroundColor: theme.background }];
  }, [theme]);

  const [script, setScript] = React.useState("");

  React.useEffect(() => {
    setScript(props.oldConfig.userScripts[0]);
  }, [props.oldConfig]);

  const saveAndClose = () => {
    props.onClose({
      ...props.oldConfig,
      userScripts: [script],
    });
  };

  const [scvHeight, setScvHeight] = React.useState(100);

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
          <ScrollView
            style={styles.flexView}
            overScrollMode="never"
            onLayout={(e) => setScvHeight(e.nativeEvent.layout.height)}
          >
            <View style={{ height: scvHeight * 0.95 }}>
              <View style={styles.flexView}>
                <Text style={[styles.heading2Text, style_fg]}>
                  {t("customScript")}
                </Text>
                <TextInput
                  multiline={true}
                  value={script}
                  onChangeText={setScript}
                  style={[styles.codeEditor, style_fg]}
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
            {/* experimental settings */}
            <View style={{ height: scvHeight * 0.7 }}>
              <Text style={[style_fg, styles.heading1Text]}>
                {t("experimentalSettings")}
              </Text>
              <Text style={[style_fg, styles.heading2Text]}>
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
                        .then((s) => props.onRequestInject(s))
                        .catch((e) => console.error(e));
                    }}
                  >
                    <Text style={styles.textStyle}>
                      {t("pushNotificationsEnable")}
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          </ScrollView>
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

  heading1Text: {
    fontSize: 20,
    fontWeight: "bold",
  },
  heading2Text: {
    fontSize: 15,
    fontWeight: "bold",
  },
  noteText: {
    fontSize: 12,
  },
});

export default ConfigModal;
