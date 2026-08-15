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
  FileText,
  Globe,
  Terminal,
  SquareCode,
  FolderTree,
  RotateCcw,
  Sparkles,
} from "lucide-react-native";
import { useNavigation, SideTabItem } from "../../context/NavigationContext";

interface SlashCommand {
  command: string;
  desc: string;
  icon: any;
  actionType: "plan" | "browse" | "terminal" | "review" | "explore" | "clear";
}

const COMMANDS: SlashCommand[] = [
  {
    command: "/plan",
    desc: "Draft implementation plan before editing",
    icon: FileText,
    actionType: "plan",
  },
  {
    command: "/browse",
    desc: "Open Web Browser preview for localhost:8000",
    icon: Globe,
    actionType: "browse",
  },
  {
    command: "/terminal",
    desc: "Open interactive PowerShell / bash terminal",
    icon: Terminal,
    actionType: "terminal",
  },
  {
    command: "/review",
    desc: "Review modified code files and git diffs",
    icon: SquareCode,
    actionType: "review",
  },
  {
    command: "/explore",
    desc: "Browse project file tree and code structure",
    icon: FolderTree,
    actionType: "explore",
  },
  {
    command: "/clear",
    desc: "Reset conversation context & clear history",
    icon: RotateCcw,
    actionType: "clear",
  },
];

export const SlashCommandModal: React.FC = () => {
  const {
    isSlashCommandOpen,
    setSlashCommandOpen,
    insertTextToPrompt,
    openSideTab,
    setTerminalOpen,
  } = useNavigation();

  const handleSelectCommand = (cmd: SlashCommand) => {
    insertTextToPrompt(`${cmd.command} `);
    setSlashCommandOpen(false);

    if (cmd.actionType === "plan") {
      openSideTab({
        id: "tab-plan",
        type: "Plan",
        title: "Plan",
        isClosable: false,
      });
    } else if (cmd.actionType === "browse") {
      openSideTab({
        id: "tab-browser",
        type: "Browser",
        title: "localhost:8000",
        url: "http://localhost:8000/",
        isClosable: true,
      });
    } else if (cmd.actionType === "terminal") {
      setTerminalOpen(true);
    } else if (cmd.actionType === "review") {
      openSideTab({
        id: "tab-review",
        type: "Review",
        title: "Review",
        isClosable: false,
      });
    } else if (cmd.actionType === "explore") {
      openSideTab({
        id: "tab-explore",
        type: "Explore",
        title: "Explore",
        isClosable: false,
      });
    }
  };

  return (
    <Modal
      visible={isSlashCommandOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setSlashCommandOpen(false)}
    >
      <TouchableWithoutFeedback onPress={() => setSlashCommandOpen(false)}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.cardContainer}>
              <Text style={styles.sectionHeader}>COMMANDS</Text>
              <ScrollView bounces={false} style={styles.scrollArea}>
                {COMMANDS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <TouchableOpacity
                      key={item.command}
                      style={styles.itemRow}
                      onPress={() => handleSelectCommand(item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.iconContainer}>
                        <Icon size={14} color="#38bdf8" />
                      </View>
                      <View style={styles.textContainer}>
                        <Text style={styles.commandName}>{item.command}</Text>
                        <Text style={styles.commandDesc}>{item.desc}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
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
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 135,
    paddingHorizontal: 12,
  },
  cardContainer: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#161619",
    borderColor: "#27272e",
    borderWidth: 1,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 24,
    overflow: "hidden",
    maxHeight: 330,
    paddingVertical: 8,
  },
  sectionHeader: {
    color: "#71717a",
    fontSize: 10.5,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  scrollArea: {
    paddingHorizontal: 6,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 5,
    backgroundColor: "#1e1e24",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  commandName: {
    color: "#fafafa",
    fontSize: 13,
    fontWeight: "600",
  },
  commandDesc: {
    color: "#a1a1aa",
    fontSize: 11,
    marginTop: 1,
  },
});
