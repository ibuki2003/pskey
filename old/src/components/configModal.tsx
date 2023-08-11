import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "@/i18n";
import { ServerConfig } from "@/serverConfig";
import { useTheme } from "@/theme";

interface Props {
  oldConfig: ServerConfig;
  open: boolean;

  // null: delete, false: cancel
  onClose: (config: ServerConfig | null | false) => void;
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

  return (
    <Modal animationType="none" transparent={true} visible={props.open}>
      <View style={styles.centeredView}>
        <View style={[styles.modalView, style_bg]}>
          <Text style={[styles.modalTitle, style_fg]}>
            {t("serverConfigFor", { serverName: props.oldConfig.name })}
          </Text>
          <Pressable
            style={{ position: "absolute", right: 0, top: 0, paddingRight: 10 }}
            onPress={() => props.onClose(false)}
            role="button"
          >
            <Text style={[{ fontSize: 30 }, style_fg]} aria-label="close">
              x
            </Text>
          </Pressable>
          <ScrollView style={{ flex: 1 }}>
            <Text style={[styles.heading, style_fg]}>{t("customScript")}</Text>
            <TextInput
              multiline={true}
              value={script}
              onChangeText={setScript}
              style={[styles.codeEditor, style_fg]}
            />
          </ScrollView>
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
    alignItems: "stretch",
    elevation: 5,
  },

  textStyle: {
    fontWeight: "bold",
    textAlign: "center",
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 15,
    textAlign: "center",
  },

  heading: {
    fontSize: 15,
    fontWeight: "bold",
  },
  codeEditor: {
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
});

export default ConfigModal;
