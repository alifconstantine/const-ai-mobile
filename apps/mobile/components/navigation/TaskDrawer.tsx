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
  Image,
} from "react-native";
import {
  Plus,
  Search,
  Clock,
  Puzzle,
  Hash,
  Folder,
  Smartphone,
  Settings,
  X,
  MessageSquare,
} from "lucide-react-native";
import { useNavigation } from "../../context/NavigationContext";
import { useQuery } from "convex/react";
import { api } from "@const-ai/backend";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 320);

export const TaskDrawer: React.FC = () => {
  const {
    currentUserId,
    currentUser,
    isTaskDrawerOpen,
    closeTaskDrawer,
    filterMode,
    setFilterMode,
    activeConversationId,
    setActiveConversationId,
    setActiveTaskTitle,
    createNewConversation,
    setSettingsModalOpen,
  } = useNavigation();

  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const dbConversations = useQuery(
    api.conversations.listConversations,
    currentUserId ? { userId: currentUserId as any } : {}
  );

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

  const handleCreateNewTask = async () => {
    closeTaskDrawer();
    await createNewConversation("New Task");
  };

  const handleSelectConv = (conv: { _id: string; title: string }) => {
    setActiveConversationId(conv._id);
    setActiveTaskTitle(conv.title);
    closeTaskDrawer();
  };

  const formatTimeAgo = (timestamp: number) => {
    const diffMins = Math.floor((Date.now() - timestamp) / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents={isTaskDrawerOpen ? "auto" : "none"}
    >
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
            <Text style={styles.brandTitle}>Const AI Mobile</Text>
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
            onPress={handleCreateNewTask}
          >
            <View style={styles.actionLeft}>
              <Plus size={15} color="#e4e4e7" style={styles.actionIcon} />
              <Text style={styles.actionBtnText}>New task</Text>
            </View>
            <Text style={styles.shortcutText}>+ Task</Text>
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
            <Hash
              size={13}
              color={filterMode === "group" ? "#fafafa" : "#71717a"}
            />
            <Text
              style={[
                styles.filterTabText,
                filterMode === "group" && styles.filterTabTextActive,
              ]}
            >
              Tasks
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              filterMode === "project" && styles.filterTabActive,
            ]}
            onPress={() => setFilterMode("project")}
          >
            <Folder
              size={13}
              color={filterMode === "project" ? "#fafafa" : "#71717a"}
            />
            <Text
              style={[
                styles.filterTabText,
                filterMode === "project" && styles.filterTabTextActive,
              ]}
            >
              Projects
            </Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable Tasks & Projects List */}
        <ScrollView style={styles.taskScroll} bounces={false}>
          <Text style={styles.sectionHeader}>Active Tasks</Text>

          {!dbConversations || dbConversations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MessageSquare size={20} color="#3f3f46" />
              <Text style={styles.emptyTaskText}>No active tasks yet</Text>
              <TouchableOpacity
                style={styles.btnCreateFirst}
                onPress={handleCreateNewTask}
              >
                <Text style={styles.btnCreateFirstText}>+ Create Task</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.taskList}>
              {dbConversations.map((conv) => {
                const isActive = conv._id === activeConversationId;
                return (
                  <TouchableOpacity
                    key={conv._id}
                    style={[
                      styles.taskItemRow,
                      isActive && styles.taskItemRowActive,
                    ]}
                    onPress={() => handleSelectConv(conv)}
                  >
                    <Text
                      style={[
                        styles.taskItemTitle,
                        isActive && styles.taskItemTitleActive,
                      ]}
                      numberOfLines={1}
                    >
                      {conv.title}
                    </Text>
                    <Text style={styles.taskItemTime}>
                      {formatTimeAgo(conv.updatedAt)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* User Profile & Device Status Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.profileLeft}
            onPress={() => {
              closeTaskDrawer();
              setSettingsModalOpen(true);
            }}
            activeOpacity={0.8}
          >
            <View style={styles.avatar}>
              {currentUser?.avatarUrl ? (
                <Image
                  source={{ uri: currentUser.avatarUrl }}
                  style={styles.avatarImg}
                />
              ) : (
                <Text style={styles.avatarText}>
                  {currentUser?.initials ||
                    (currentUser?.name
                      ? currentUser.name.slice(0, 2).toUpperCase()
                      : "AC")}
                </Text>
              )}
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>
                {currentUser?.name || "Alif Constantine"}
              </Text>
              <View style={styles.deviceStatusRow}>
                <Smartphone size={10} color="#22c55e" />
                <Text style={styles.deviceStatusText} numberOfLines={1}>
                  @{currentUser?.username || "alif"} • Online
                </Text>
              </View>
            </View>
          </TouchableOpacity>

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
    fontFamily: "monospace",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#141418",
    marginHorizontal: 10,
    marginTop: 8,
    borderRadius: 8,
    gap: 4,
  },
  filterTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
    borderRadius: 6,
    gap: 5,
  },
  filterTabActive: {
    backgroundColor: "#22222a",
  },
  filterTabText: {
    color: "#71717a",
    fontSize: 12,
    fontWeight: "500",
  },
  filterTabTextActive: {
    color: "#fafafa",
  },
  taskScroll: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  sectionHeader: {
    color: "#71717a",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginVertical: 6,
    paddingHorizontal: 6,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
    gap: 8,
  },
  emptyTaskText: {
    color: "#71717a",
    fontSize: 12,
  },
  btnCreateFirst: {
    backgroundColor: "#27272a",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 4,
  },
  btnCreateFirstText: {
    color: "#f4f4f5",
    fontSize: 12,
    fontWeight: "500",
  },
  taskList: {
    gap: 2,
  },
  taskItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  taskItemRowActive: {
    backgroundColor: "#1f1f26",
  },
  taskItemTitle: {
    color: "#a1a1aa",
    fontSize: 12,
    flex: 1,
    marginRight: 6,
  },
  taskItemTitleActive: {
    color: "#fafafa",
    fontWeight: "500",
  },
  taskItemTime: {
    color: "#52525b",
    fontSize: 10,
    fontFamily: "monospace",
  },
  footer: {
    height: 54,
    borderTopWidth: 1,
    borderTopColor: "#1e1e24",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    backgroundColor: "#111114",
  },
  profileLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
    overflow: "hidden",
  },
  avatarImg: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: "#fafafa",
    fontSize: 12,
    fontWeight: "500",
  },
  deviceStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 1,
  },
  deviceStatusText: {
    color: "#71717a",
    fontSize: 10,
  },
  settingsBtn: {
    padding: 6,
    borderRadius: 6,
  },
});
