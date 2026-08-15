import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
} from "react-native";
import {
  Search,
  Folder,
  Check,
  FolderOpen,
  Cloud,
  Globe,
  X,
  Plus,
} from "lucide-react-native";
import { useNavigation, WorkspaceItem } from "../../context/NavigationContext";

export const WorkspaceModal: React.FC = () => {
  const {
    isWorkspaceModalOpen,
    setWorkspaceModalOpen,
    workspaces,
    activeWorkspace,
    setActiveWorkspace,
  } = useNavigation();

  const [searchQuery, setSearchQuery] = useState("");

  const filteredWorkspaces = workspaces.filter((ws) =>
    ws.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectWorkspace = (ws: WorkspaceItem) => {
    setActiveWorkspace(ws.name);
    setWorkspaceModalOpen(false);
  };

  return (
    <Modal
      visible={isWorkspaceModalOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setWorkspaceModalOpen(false)}
    >
      <TouchableWithoutFeedback onPress={() => setWorkspaceModalOpen(false)}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.popoverContainer}>
              {/* Header with Search */}
              <View style={styles.searchContainer}>
                <Search size={14} color="#71717a" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search workspaces"
                  placeholderTextColor="#71717a"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <X size={14} color="#a1a1aa" />
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView style={styles.listContainer} bounces={false}>
                {/* Workspaces List */}
                <View style={styles.section}>
                  {filteredWorkspaces.map((ws) => {
                    const isSelected = ws.name === activeWorkspace;
                    return (
                      <TouchableOpacity
                        key={ws.id}
                        style={[styles.itemRow, isSelected && styles.itemRowActive]}
                        onPress={() => handleSelectWorkspace(ws)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.itemLeft}>
                          <Folder
                            size={15}
                            color={isSelected ? "#e4e4e7" : "#a1a1aa"}
                            style={styles.itemIcon}
                          />
                          <Text
                            style={[
                              styles.itemText,
                              isSelected && styles.itemTextActive,
                            ]}
                          >
                            {ws.name}
                          </Text>
                        </View>
                        {isSelected && <Check size={15} color="#e4e4e7" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.separator} />

                {/* Quick Workspace Actions */}
                <View style={styles.section}>
                  <TouchableOpacity
                    style={styles.actionRow}
                    onPress={() => setWorkspaceModalOpen(false)}
                    activeOpacity={0.7}
                  >
                    <FolderOpen size={15} color="#a1a1aa" style={styles.itemIcon} />
                    <Text style={styles.actionText}>Open folder</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionRow}
                    onPress={() => setWorkspaceModalOpen(false)}
                    activeOpacity={0.7}
                  >
                    <Cloud size={15} color="#a1a1aa" style={styles.itemIcon} />
                    <Text style={styles.actionText}>Remote connection</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionRow}
                    onPress={() => setWorkspaceModalOpen(false)}
                    activeOpacity={0.7}
                  >
                    <Globe size={15} color="#a1a1aa" style={styles.itemIcon} />
                    <Text style={styles.actionText}>Work outside a project</Text>
                  </TouchableOpacity>
                </View>
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 52,
  },
  popoverContainer: {
    width: "88%",
    maxWidth: 320,
    backgroundColor: "#18181b",
    borderColor: "#27272a",
    borderWidth: 1,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
    overflow: "hidden",
    maxHeight: 360,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#222228",
    backgroundColor: "#141418",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#fafafa",
    fontSize: 13,
    padding: 0,
    borderWidth: 0,
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : {}),
  },
  listContainer: {
    paddingVertical: 4,
  },
  section: {
    paddingVertical: 2,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  itemRowActive: {
    backgroundColor: "#222228",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  itemIcon: {
    marginRight: 10,
  },
  itemText: {
    color: "#d4d4d8",
    fontSize: 13,
    fontWeight: "400",
  },
  itemTextActive: {
    color: "#fafafa",
    fontWeight: "500",
  },
  separator: {
    height: 1,
    backgroundColor: "#222228",
    marginVertical: 4,
    marginHorizontal: 8,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  actionText: {
    color: "#a1a1aa",
    fontSize: 13,
  },
});
