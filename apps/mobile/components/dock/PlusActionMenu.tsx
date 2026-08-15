import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import {
  Paperclip,
  AtSign,
  SquareTerminal,
  Command,
} from "lucide-react-native";
import { useNavigation } from "../../context/NavigationContext";

export const PlusActionMenu: React.FC = () => {
  const {
    isPlusMenuOpen,
    setPlusMenuOpen,
    setMentionOpen,
    setSlashCommandOpen,
    insertTextToPrompt,
  } = useNavigation();

  const handleAction = (type: "attachment" | "mention" | "command") => {
    setPlusMenuOpen(false);
    if (type === "attachment") {
      insertTextToPrompt("[Attachment: uploaded file]");
    } else if (type === "mention") {
      insertTextToPrompt("@");
      setMentionOpen(true);
    } else if (type === "command") {
      insertTextToPrompt("/");
      setSlashCommandOpen(true);
    }
  };

  return (
    <Modal
      visible={isPlusMenuOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setPlusMenuOpen(false)}
    >
      <TouchableWithoutFeedback onPress={() => setPlusMenuOpen(false)}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.popoverCard}>
              {/* Option 1: Add attachment */}
              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => handleAction("attachment")}
                activeOpacity={0.7}
              >
                <Paperclip size={15} color="#a1a1aa" style={styles.menuIcon} />
                <Text style={styles.menuText}>Add attachment</Text>
              </TouchableOpacity>

              {/* Option 2: Use @ to add context */}
              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => handleAction("mention")}
                activeOpacity={0.7}
              >
                <AtSign size={15} color="#a1a1aa" style={styles.menuIcon} />
                <Text style={styles.menuText}>Use @ to add context</Text>
              </TouchableOpacity>

              {/* Option 3: Use / for commands or capabilities */}
              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => handleAction("command")}
                activeOpacity={0.7}
              >
                <SquareTerminal size={15} color="#a1a1aa" style={styles.menuIcon} />
                <Text style={styles.menuText}>Use / for commands or capabilities</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
    alignItems: "flex-start",
    paddingBottom: 135,
    paddingLeft: 12,
  },
  popoverCard: {
    width: 250,
    backgroundColor: "#1c1c20",
    borderColor: "#2a2a32",
    borderWidth: 1,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 22,
    paddingVertical: 5,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginHorizontal: 3,
  },
  menuIcon: {
    marginRight: 10,
  },
  menuText: {
    color: "#e4e4e7",
    fontSize: 12.5,
    fontWeight: "400",
  },
});
