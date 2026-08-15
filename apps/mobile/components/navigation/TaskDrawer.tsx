import React, { useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import {
  Plus,
  Search,
  Clock,
  Puzzle,
  Hash,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Smartphone,
  Settings,
  X,
  Sparkles,
} from "lucide-react-native";
import { useNavigation, TaskItem } from "../../context/NavigationContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 320);

export const TaskDrawer: React.FC = () => {
  const {
    isTaskDrawerOpen,
    closeTaskDrawer,
    filterMode,
    setFilterMode,
    projects,
    activeConversationId,
    selectTask,
    setSettingsModalOpen,
  } = useNavigation();

  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isTaskDrawerOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isTaskDrawerOpen]);

  if (!isTaskDrawerOpen) {
    // Hidden when closed
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={isTaskDrawerOpen ? "auto" : "none"}>
      {/* Dimmed backdrop */}
      <TouchableWithoutFeedback onPress={closeTaskDrawer}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>

      {/* Animated Sliding Drawer */}
      <Animated.View
        style={[
          styles.drawerContainer,
          {
            width: DRAWER_WIDTH,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {/* Drawer Header with Close button */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Text style={styles.brandTitle}>Const AI</Text>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={closeTaskDrawer}
            accessibilityLabel="Close drawer"
          >
            <X size={18} color="#a1a1aa" />
          </TouchableOpacity>
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              closeTaskDrawer();
            }}
          >
            <View style={styles.actionLeft}>
              <Plus size={15} color="#e4e4e7" style={styles.actionIcon} />
              <Text style={styles.actionBtnText}>New task</Text>
            </View>
            <Text style={styles.shortcutText}>Ctrl+N</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <View style={styles.actionLeft}>
              <Search size={15} color="#a1a1aa" style={styles.actionIcon} />
              <Text style={styles.actionBtnSecondaryText}>Search</Text>
            </View>
            <Text style={styles.shortcutText}>Ctrl+K</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <View style={styles.actionLeft}>
              <Clock size={15} color="#a1a1aa" style={styles.actionIcon} />
              <Text style={styles.actionBtnSecondaryText}>Automations</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <View style={styles.actionLeft}>
              <Puzzle size={15} color="#a1a1aa" style={styles.actionIcon} />
              <Text style={styles.actionBtnSecondaryText}>Skills</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Segmented Filter Switch (# Group vs 📁 Project) */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filterMode === "group" && styles.filterTabActive,
            ]}
            onPress={() => setFilterMode("group")}
          >
            <Hash size={13} color={filterMode === "group" ? "#fafafa" : "#71717a"} />
            <Text
              style={[
                styles.filterTabText,
                filterMode === "group" && styles.filterTabTextActive,
              ]}
            >
              Group
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              filterMode === "project" && styles.filterTabActive,
            ]}
            onPress={() => setFilterMode("project")}
          >
            <Folder size={13} color={filterMode === "project" ? "#fafafa" : "#71717a"} />
            <Text
              style={[
                styles.filterTabText,
                filterMode === "project" && styles.filterTabTextActive,
              ]}
            >
              Project
            </Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable Tasks & Projects List */}
        <ScrollView style={styles.taskScroll} bounces={false}>
          <Text style={styles.sectionHeader}>Projects</Text>

          {projects.map((project) => (
            <View key={project.id} style={styles.projectBlock}>
              {/* Folder Row */}
              <View style={styles.folderRow}>
                <Folder size={14} color="#a1a1aa" style={styles.folderIcon} />
                <Text style={styles.folderName}>{project.name}</Text>
              </View>

              {/* Tasks under this Project */}
              {project.tasks.length === 0 ? (
                <Text style={styles.emptyTaskText}>No tasks yet</Text>
              ) : (
                <View style={styles.taskList}>
                  {project.tasks.map((task) => {
                    const isActive = task.id === activeConversationId;
                    return (
                      <TouchableOpacity
                        key={task.id}
                        style={[
                          styles.taskItemRow,
                          isActive && styles.taskItemRowActive,
                        ]}
                        onPress={() => selectTask(task)}
                      >
                        <Text
                          style={[
                            styles.taskItemTitle,
                            isActive && styles.taskItemTitleActive,
                          ]}
                          numberOfLines={1}
                        >
                          {task.title}
                        </Text>
                        <Text style={styles.taskItemTime}>{task.timeAgo}</Text>
                      </TouchableOpacity>
                    );
                  })}
                  {project.tasks.length > 4 && (
                    <TouchableOpacity style={styles.showMoreBtn}>
                      <Text style={styles.showMoreText}>Show more</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {/* User Profile & Device Status Footer */}
        <View style={styles.footer}>
          <View style={styles.profileLeft}>
            {/* Avatar badge */}
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>AC</Text>
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>
                Alif Constantine
              </Text>
              <View style={styles.deviceStatusRow}>
                <Smartphone size={11} color="#22c55e" />
                <Text style={styles.deviceStatusText}>Android • Online</Text>
              </View>
            </View>
          </View>

          {/* Settings button */}
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => {
              closeTaskDrawer();
              setSettingsModalOpen(true);
            }}
            accessibilityLabel="Open settings"
          >
            <Settings size={18} color="#a1a1aa" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  drawerContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "#111114",
    borderRightWidth: 1,
    borderRightColor: "#222228",
    zIndex: 100,
    display: "flex",
    flexDirection: "column",
  },
  header: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e24",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandTitle: {
    color: "#fafafa",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 6,
  },
  quickActions: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e24",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionIcon: {
    marginRight: 10,
  },
  actionBtnText: {
    color: "#fafafa",
    fontSize: 13,
    fontWeight: "500",
  },
  actionBtnSecondaryText: {
    color: "#a1a1aa",
    fontSize: 13,
  },
  shortcutText: {
    color: "#52525b",
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: "#18181b",
    gap: 5,
  },
  filterTabActive: {
    backgroundColor: "#27272a",
    borderWidth: 1,
    borderColor: "#3f3f46",
  },
  filterTabText: {
    color: "#71717a",
    fontSize: 12,
    fontWeight: "500",
  },
  filterTabTextActive: {
    color: "#fafafa",
    fontWeight: "600",
  },
  taskScroll: {
    flex: 1,
    paddingHorizontal: 10,
  },
  sectionHeader: {
    color: "#71717a",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 6,
  },
  projectBlock: {
    marginBottom: 12,
  },
  folderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  folderIcon: {
    marginRight: 8,
  },
  folderName: {
    color: "#a1a1aa",
    fontSize: 12,
    fontWeight: "500",
  },
  emptyTaskText: {
    color: "#52525b",
    fontSize: 12,
    paddingLeft: 28,
    paddingVertical: 4,
    fontStyle: "italic",
  },
  taskList: {
    paddingLeft: 12,
    gap: 2,
  },
  taskItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  taskItemRowActive: {
    backgroundColor: "#222228",
    borderLeftWidth: 2,
    borderLeftColor: "#38bdf8",
  },
  taskItemTitle: {
    color: "#a1a1aa",
    fontSize: 12.5,
    flex: 1,
    marginRight: 6,
  },
  taskItemTitleActive: {
    color: "#fafafa",
    fontWeight: "500",
  },
  taskItemTime: {
    color: "#52525b",
    fontSize: 11,
  },
  showMoreBtn: {
    paddingVertical: 4,
    paddingLeft: 8,
  },
  showMoreText: {
    color: "#71717a",
    fontSize: 11.5,
  },
  footer: {
    height: 54,
    borderTopWidth: 1,
    borderTopColor: "#1e1e24",
    backgroundColor: "#0d0d10",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  profileLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 9,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fafafa",
    fontSize: 12,
    fontWeight: "bold",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: "#fafafa",
    fontSize: 13,
    fontWeight: "600",
  },
  deviceStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 1,
  },
  deviceStatusText: {
    color: "#22c55e",
    fontSize: 10.5,
    fontWeight: "500",
  },
  settingsBtn: {
    padding: 8,
    borderRadius: 6,
  },
});
