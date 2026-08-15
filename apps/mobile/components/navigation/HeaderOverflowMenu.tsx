import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import {
  Pin,
  Pencil,
  Archive,
  Mail,
  FolderOpen,
  Copy,
  FileText,
  Key,
  Settings,
  Sparkles,
  Flag,
} from "lucide-react-native";
import { useNavigation } from "../../context/NavigationContext";

export const HeaderOverflowMenu: React.FC = () => {
  const {
    isOverflowMenuOpen,
    setOverflowMenuOpen,
    setSettingsModalOpen,
  } = useNavigation();

  const handleAction = (actionName: string) => {
    setOverflowMenuOpen(false);
    if (actionName === "config") {
      setSettingsModalOpen(true);
    }
  };

  return (
    <Modal
      visible={isOverflowMenuOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setOverflowMenuOpen(false)}
    >
      <TouchableWithoutFeedback onPress={() => setOverflowMenuOpen(false)}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.menuContainer}>
              <ScrollView bounces={false}>
                {/* Task Operations */}
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleAction("pin")}
                >
                  <Pin size={15} color="#a1a1aa" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Pin task</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleAction("rename")}
                >
                  <Pencil size={15} color="#a1a1aa" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Rename task</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleAction("archive")}
                >
                  <Archive size={15} color="#a1a1aa" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Archive task</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleAction("unread")}
                >
                  <Mail size={15} color="#a1a1aa" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Mark as unread</Text>
                </TouchableOpacity>

                <View style={styles.separator} />

                {/* File & Path Operations */}
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleAction("explorer")}
                >
                  <FolderOpen size={15} color="#a1a1aa" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Open in File Explorer</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleAction("copy_path")}
                >
                  <Copy size={15} color="#a1a1aa" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Copy path</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleAction("copy_task_path")}
                >
                  <Copy size={15} color="#a1a1aa" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Copy task path</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleAction("copy_log")}
                >
                  <FileText size={15} color="#a1a1aa" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Copy log path</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleAction("copy_session")}
                >
                  <Key size={15} color="#a1a1aa" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Copy session ID</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleAction("config")}
                >
                  <Settings size={15} color="#a1a1aa" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Go to config</Text>
                </TouchableOpacity>

                <View style={styles.separator} />

                {/* Trajectory & Support */}
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleAction("trajectory")}
                >
                  <Sparkles size={15} color="#38bdf8" style={styles.menuIcon} />
                  <Text style={[styles.menuText, { color: "#38bdf8" }]}>
                    View model trajectory
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleAction("report")}
                >
                  <Flag size={15} color="#f87171" style={styles.menuIcon} />
                  <Text style={[styles.menuText, { color: "#f87171" }]}>
                    Report issue
                  </Text>
                </TouchableOpacity>
              </ScrollView>
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
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 48,
    paddingRight: 8,
  },
  menuContainer: {
    width: 220,
    backgroundColor: "#18181b",
    borderColor: "#27272a",
    borderWidth: 1,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 20,
    paddingVertical: 4,
    maxHeight: 460,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 6,
  },
  menuIcon: {
    marginRight: 10,
  },
  menuText: {
    color: "#e4e4e7",
    fontSize: 13,
    fontWeight: "400",
  },
  separator: {
    height: 1,
    backgroundColor: "#27272a",
    marginVertical: 4,
    marginHorizontal: 8,
  },
});
