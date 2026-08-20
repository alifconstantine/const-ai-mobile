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
  Globe,
  X,
  Plus,
  Terminal,
  Smartphone,
  HardDrive,
  MessageSquare,
} from "lucide-react-native";
import { useNavigation, WorkspaceItem } from "../../context/NavigationContext";

const PRESET_DIRECTORIES = [
  {
    name: "Termux Projects (~/projects)",
    path: "/data/data/com.termux/files/home/projects",
    icon: Terminal,
  },
  {
    name: "Termux Home (~)",
    path: "/data/data/com.termux/files/home",
    icon: Terminal,
  },
  {
    name: "Download Storage (/sdcard/Download)",
    path: "/sdcard/Download",
    icon: HardDrive,
  },
  {
    name: "Android Shared Storage (/sdcard)",
    path: "/sdcard",
    icon: Smartphone,
  },
];

export const WorkspaceModal: React.FC = () => {
  const {
    isWorkspaceModalOpen,
    setWorkspaceModalOpen,
    workspaces,
    activeWorkspace,
    activeWorkspaceType,
    activeWorkingDirectory,
    setActiveWorkspace,
    setConversationWorkspace,
    createNewConversation,
    addCustomWorkspace,
  } = useNavigation();

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingCustomPath, setIsAddingCustomPath] = useState(false);
  const [customPathInput, setCustomPathInput] = useState("");
  const [customNameInput, setCustomNameInput] = useState("");

  const filteredWorkspaces = workspaces.filter((ws) =>
    ws.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectStandalone = async () => {
    await setConversationWorkspace("standalone", undefined);
    setActiveWorkspace("Standalone Chat");
    setWorkspaceModalOpen(false);
  };

  const handleSelectWorkspace = async (ws: WorkspaceItem) => {
    await setConversationWorkspace("project_folder", ws.path);
    setActiveWorkspace(ws.name);
    setWorkspaceModalOpen(false);
  };

  const handleSelectPreset = async (preset: { name: string; path: string }) => {
    await setConversationWorkspace("project_folder", preset.path);
    addCustomWorkspace(preset.name.split(" (")[0], preset.path);
    setWorkspaceModalOpen(false);
  };

  const handleSaveCustomPath = async () => {
    if (!customPathInput.trim()) return;
    const path = customPathInput.trim();
    const name =
      customNameInput.trim() ||
      path.split("/").filter(Boolean).pop() ||
      "Project Folder";

    addCustomWorkspace(name, path);
    await setConversationWorkspace("project_folder", path);
    setIsAddingCustomPath(false);
    setCustomPathInput("");
    setCustomNameInput("");
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
                  placeholder="Cari workspace / folder..."
                  placeholderTextColor="#71717a"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <X size={14} color="#a1a1aa" />
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView style={styles.listContainer} bounces={false}>
                {/* 1. Mode Standalone / Tanpa Folder */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>MODE OBROLAN</Text>
                  <TouchableOpacity
                    style={[
                      styles.itemRow,
                      activeWorkspaceType === "standalone" && styles.itemRowActive,
                    ]}
                    onPress={handleSelectStandalone}
                    activeOpacity={0.7}
                  >
                    <View style={styles.itemLeft}>
                      <MessageSquare
                        size={15}
                        color={activeWorkspaceType === "standalone" ? "#38bdf8" : "#a1a1aa"}
                        style={styles.itemIcon}
                      />
                      <View>
                        <Text
                          style={[
                            styles.itemText,
                            activeWorkspaceType === "standalone" && styles.itemTextActive,
                          ]}
                        >
                          Tanpa Folder (Standalone)
                        </Text>
                        <Text style={styles.itemSubText}>
                          Obrolan asisten umum tanpa terikat direktori lokal
                        </Text>
                      </View>
                    </View>
                    {activeWorkspaceType === "standalone" && (
                      <Check size={15} color="#38bdf8" />
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.separator} />

                {/* 2. Registered Workspaces */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>PROJECT WORKSPACES (DALAM FOLDER)</Text>
                  {filteredWorkspaces.map((ws) => {
                    const isSelected =
                      activeWorkspaceType === "project_folder" &&
                      (ws.name === activeWorkspace || ws.path === activeWorkingDirectory);

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
                            color={isSelected ? "#38bdf8" : "#a1a1aa"}
                            style={styles.itemIcon}
                          />
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.itemText,
                                isSelected && styles.itemTextActive,
                              ]}
                              numberOfLines={1}
                            >
                              {ws.name}
                            </Text>
                            <Text style={styles.itemSubText} numberOfLines={1}>
                              {ws.path}
                            </Text>
                          </View>
                        </View>
                        {isSelected && <Check size={15} color="#38bdf8" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.separator} />

                {/* 3. Quick Folder Presets */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>FOLDER PRESET CEPAT</Text>
                  {PRESET_DIRECTORIES.map((preset, idx) => {
                    const Icon = preset.icon;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={styles.presetRow}
                        onPress={() => handleSelectPreset(preset)}
                        activeOpacity={0.7}
                      >
                        <Icon size={14} color="#71717a" style={styles.itemIcon} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.presetName}>{preset.name}</Text>
                          <Text style={styles.presetPath} numberOfLines={1}>
                            {preset.path}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 4. Custom Path Input */}
                <View style={styles.customPathSection}>
                  {isAddingCustomPath ? (
                    <View style={styles.customPathForm}>
                      <Text style={styles.customPathTitle}>Tambah Folder Proyek Kustom</Text>
                      <TextInput
                        style={styles.customInput}
                        placeholder="Nama Proyek (misal: my-app)"
                        placeholderTextColor="#71717a"
                        value={customNameInput}
                        onChangeText={setCustomNameInput}
                      />
                      <TextInput
                        style={styles.customInput}
                        placeholder="Path Folder (misal: ~/projects/my-app)"
                        placeholderTextColor="#71717a"
                        value={customPathInput}
                        onChangeText={setCustomPathInput}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <View style={styles.customPathBtnRow}>
                        <TouchableOpacity
                          style={styles.btnCancel}
                          onPress={() => setIsAddingCustomPath(false)}
                        >
                          <Text style={styles.btnCancelText}>Batal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.btnSave}
                          onPress={handleSaveCustomPath}
                        >
                          <Text style={styles.btnSaveText}>Buka Folder</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.addFolderBtn}
                      onPress={() => setIsAddingCustomPath(true)}
                      activeOpacity={0.7}
                    >
                      <Plus size={14} color="#38bdf8" />
                      <Text style={styles.addFolderBtnText}>+ Input Path Folder Lain</Text>
                    </TouchableOpacity>
                  )}
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
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  popoverContainer: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#141418",
    borderColor: "#27272a",
    borderWidth: 1,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 20,
    overflow: "hidden",
    maxHeight: 460,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#202026",
    backgroundColor: "#18181d",
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
    paddingVertical: 6,
  },
  section: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  sectionLabel: {
    color: "#71717a",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    textTransform: "uppercase",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginVertical: 1,
  },
  itemRowActive: {
    backgroundColor: "#202028",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  itemIcon: {
    marginRight: 10,
  },
  itemText: {
    color: "#d4d4d8",
    fontSize: 12.5,
    fontWeight: "500",
  },
  itemTextActive: {
    color: "#fafafa",
    fontWeight: "600",
  },
  itemSubText: {
    color: "#71717a",
    fontSize: 10.5,
    marginTop: 1,
  },
  separator: {
    height: 1,
    backgroundColor: "#222228",
    marginVertical: 4,
    marginHorizontal: 10,
  },
  presetRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  presetName: {
    color: "#a1a1aa",
    fontSize: 12,
    fontWeight: "500",
  },
  presetPath: {
    color: "#52525b",
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  customPathSection: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  addFolderBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#1a1a20",
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#262630",
  },
  addFolderBtnText: {
    color: "#38bdf8",
    fontSize: 11.5,
    fontWeight: "600",
  },
  customPathForm: {
    backgroundColor: "#18181d",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#262630",
    gap: 8,
  },
  customPathTitle: {
    color: "#fafafa",
    fontSize: 12,
    fontWeight: "600",
  },
  customInput: {
    backgroundColor: "#111114",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: "#fafafa",
    fontSize: 11.5,
  },
  customPathBtnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 4,
  },
  btnCancel: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  btnCancelText: {
    color: "#71717a",
    fontSize: 11,
  },
  btnSave: {
    backgroundColor: "#38bdf8",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  btnSaveText: {
    color: "#09090b",
    fontSize: 11,
    fontWeight: "700",
  },
});

