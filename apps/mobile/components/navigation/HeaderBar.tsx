import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Platform } from "react-native";
import {
  Menu,
  Folder,
  ChevronDown,
  Terminal,
  Columns2,
  MoreVertical,
  Sliders,
} from "lucide-react-native";
import { useNavigation } from "../../context/NavigationContext";

export const HeaderBar: React.FC = () => {
  const {
    toggleTaskDrawer,
    toggleReviewPanel,
    isReviewPanelOpen,
    toggleTerminal,
    isTerminalOpen,
    activeWorkspace,
    activeTaskTitle,
    setWorkspaceModalOpen,
    setOverflowMenuOpen,
  } = useNavigation();

  return (
    <View style={styles.container}>
      {/* Left section: Hamburger button */}
      <View style={styles.leftSection}>
        <TouchableOpacity
          style={styles.hamburgerButton}
          onPress={toggleTaskDrawer}
          accessibilityLabel="Toggle menu drawer"
        >
          <Menu size={19} color="#e4e4e7" />
        </TouchableOpacity>
      </View>

      {/* Center section: Task title & Workspace Pill */}
      <View style={styles.centerSection}>
        <Text style={styles.taskTitle} numberOfLines={1} ellipsizeMode="tail">
          {activeTaskTitle}
        </Text>

        <TouchableOpacity
          style={styles.workspacePill}
          onPress={() => setWorkspaceModalOpen(true)}
          accessibilityLabel="Switch workspace"
        >
          <Folder size={13} color="#e4e4e7" style={styles.workspaceIcon} />
          <Text style={styles.workspaceText} numberOfLines={1}>
            {activeWorkspace}
          </Text>
          <ChevronDown size={12} color="#a1a1aa" />
        </TouchableOpacity>
      </View>

      {/* Right section: Terminal, Side Panel, Overflow Menu */}
      <View style={styles.rightSection}>
        <TouchableOpacity
          style={[styles.actionButton, isTerminalOpen && styles.actionButtonActive]}
          onPress={toggleTerminal}
          accessibilityLabel="Toggle terminal drawer"
        >
          <Terminal size={17} color={isTerminalOpen ? "#38bdf8" : "#a1a1aa"} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, isReviewPanelOpen && styles.actionButtonActive]}
          onPress={toggleReviewPanel}
          accessibilityLabel="Toggle side panel"
        >
          <Columns2 size={17} color={isReviewPanelOpen ? "#38bdf8" : "#a1a1aa"} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setOverflowMenuOpen(true)}
          accessibilityLabel="More options"
        >
          <MoreVertical size={17} color="#a1a1aa" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 48,
    backgroundColor: "#0d0d10",
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e24",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    zIndex: 10,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  hamburgerButton: {
    padding: 6,
    borderRadius: 6,
  },
  centerSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginHorizontal: 8,
    gap: 8,
  },
  taskTitle: {
    color: "#f4f4f5",
    fontSize: 13,
    fontWeight: "500",
    maxWidth: "50%",
  },
  workspacePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 5,
    maxWidth: 130,
  },
  workspaceIcon: {
    marginRight: 1,
  },
  workspaceText: {
    color: "#e4e4e7",
    fontSize: 12,
    fontWeight: "500",
    maxWidth: 85,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  actionButtonActive: {
    backgroundColor: "#1e1e24",
    borderWidth: 1,
    borderColor: "#38bdf8",
  },
});
