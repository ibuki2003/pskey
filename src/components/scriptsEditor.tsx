import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { useTranslation } from "@/i18n";
import { ScriptsItem, ScriptsList } from "@/scriptsConfig";

interface Props {
  title: string;
  value: ScriptsList | null; // null if loading
  updateValue: (
    content: ScriptsList | ((content: ScriptsList | null) => ScriptsList)
  ) => void;

  style_fg: StyleProp<TextStyle>;
  style_bg: StyleProp<ViewStyle>;
}

const ScriptsEditor: React.FC<Props> = (props) => {
  const { t } = useTranslation();
  const [editing, setEditing] = React.useState<{
    idx: number;
    content: string;
  } | null>(null);

  const renderItem = ({
    item,
    index,
  }: {
    item: ScriptsItem;
    index: number;
  }) => {
    return (
      <TouchableOpacity
        onPress={() => setEditing({ idx: index, content: item.content })}
        style={[styles.listitem]}
      >
        <Text style={[styles.listitem_label, props.style_fg]} numberOfLines={1}>
          {item.content.split("\n", 1)[0]}
        </Text>
        <Switch
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={item.enabled ? "#f5dd4b" : "#f4f3f4"}
          onValueChange={(v) =>
            props.updateValue((c) => {
              const newContent = c ? [...c] : [];
              newContent[index] = { ...item, enabled: v };
              return newContent;
            })
          }
          value={item.enabled}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container]}>
      <View style={[styles.rowView]}>
        <Text style={[styles.titleText, props.style_fg]}>{props.title}</Text>
        <Pressable
          onPress={() => {
            if (props.value)
              setEditing({
                idx: props.value.length,
                content: "/* script here */",
              });
          }}
          role="button"
          style={[
            styles.addButton,
            props.value === null && styles.buttonDisabled,
          ]}
          disabled={props.value === null}
        >
          <Text style={[styles.addButtonText]} aria-label="Add new">
            +
          </Text>
        </Pressable>
      </View>
      {props.value === null ? (
        <View style={[props.style_bg, styles.listBox]}>
          <ActivityIndicator color={(props.style_fg as any).color} />
        </View>
      ) : (
        <FlatList
          data={props.value}
          style={[props.style_bg, styles.listBox]}
          renderItem={renderItem}
          keyExtractor={(_, index) => index.toString()}
        />
      )}
      <Modal animationType="none" transparent={true} visible={editing !== null}>
        <View style={styles.centeredView}>
          <View style={[styles.modalView, props.style_bg]}>
            <TextInput
              multiline={true}
              value={editing?.content ?? ""}
              onChangeText={(v) =>
                setEditing((editing) => editing && { ...editing, content: v })
              }
              style={[styles.codeEditor, props.style_fg]}
            />
            <View style={[styles.rowView]}>
              <Pressable
                style={[styles.button]}
                onPress={() => {
                  setEditing(null);
                }}
              >
                <Text style={[styles.buttonText]}>{t("cancel")}</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.buttonPrimary]}
                onPress={() => {
                  if (editing === null) return;
                  props.updateValue((c) => {
                    const newContent = c ? [...c] : [];
                    if (editing.idx < newContent.length) {
                      newContent[editing.idx] = {
                        ...newContent[editing.idx],
                        content: editing.content,
                      };
                    } else {
                      newContent.push({
                        content: editing.content,
                        enabled: true,
                      });
                    }
                    return newContent;
                  });
                  setEditing(null);
                }}
              >
                <Text style={[styles.buttonText]}>{t("saveAndClose")}</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.buttonDanger]}
                onPress={() => {
                  if (editing === null) return;
                  props.updateValue((c) =>
                    c ? c.filter((_, i) => i != editing.idx) : []
                  );
                  setEditing(null);
                }}
              >
                <Text style={[styles.buttonText]}>{t("delete")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
  },
  rowView: {
    // flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  titleText: {
    marginTop: 5,
    fontSize: 15,
    fontWeight: "bold",
    flexGrow: 1,
  },
  addButton: {
    borderRadius: 1000,
    width: 35,
    height: 35,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    margin: 2,

    backgroundColor: "#29f",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 20,
  },

  listBox: {
    borderWidth: 1,
    borderColor: "#888",
    flex: 1,
  },
  listitem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
  },
  listitem_label: {
    flex: 1,
    flexGrow: 1,
  },

  codeEditor: {
    flex: 1,
    height: 300,
    borderColor: "#888",
    borderWidth: 1,
    textAlignVertical: "top",
    fontFamily: "monospace",
  },

  // modal
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

  button: {
    borderRadius: 5,
    padding: 10,
    elevation: 2,
    marginVertical: 5,
    marginHorizontal: 10,
    backgroundColor: "#aaa",
  },
  buttonDanger: {
    backgroundColor: "#f99",
  },
  buttonPrimary: {
    backgroundColor: "#29f",
  },
  buttonText: {
    color: "#000",
  },
  buttonDisabled: {
    backgroundColor: "#999",
    opacity: 0.5,
    color: "#000",
  },
});

export default ScriptsEditor;
