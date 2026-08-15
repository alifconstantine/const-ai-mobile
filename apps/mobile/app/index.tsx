import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Plus,
  ArrowUp,
  Shield,
  FileCode,
  Globe,
  ChevronDown,
  ChevronRight,
  Undo2,
  ExternalLink,
  Terminal as TerminalIcon,
  CircleDot,
  Disc,
  Hand,
  ShieldCheck,
  ClipboardList,
  ShieldAlert,
} from "lucide-react-native";
import { HeaderBar } from "../components/navigation/HeaderBar";
import { TaskDrawer } from "../components/navigation/TaskDrawer";
import { WorkspaceModal } from "../components/navigation/WorkspaceModal";
import { HeaderOverflowMenu } from "../components/navigation/HeaderOverflowMenu";
import { ReviewSidePanel } from "../components/review/ReviewSidePanel";
import { SettingsModal } from "../components/settings/SettingsModal";
import { TerminalDrawer } from "../components/terminal/TerminalDrawer";
import { OperatingModeModal } from "../components/modals/OperatingModeModal";
import { ModelSelectorModal } from "../components/modals/ModelSelectorModal";
import { ContextWindowModal } from "../components/modals/ContextWindowModal";
import { PlusActionMenu } from "../components/dock/PlusActionMenu";
import { MentionContextModal } from "../components/dock/MentionContextModal";
import { SlashCommandModal } from "../components/dock/SlashCommandModal";
import { ExecutionProgressCard } from "../components/chat/ExecutionProgressCard";
import { useNavigation } from "../context/NavigationContext";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  const {
    openReviewPanel,
    setActiveReviewTab,
    activeModel,
    activeOperatingMode,
    setOperatingModeModalOpen,
    setModelSelectorModalOpen,
    setContextMeterOpen,
    isPlusMenuOpen,
    setPlusMenuOpen,
    setMentionOpen,
    setSlashCommandOpen,
    promptInput,
    setPromptInput,
    openSideTab,
  } = useNavigation();

  const handlePromptChange = (text: string) => {
    setPromptInput(text);
    if (text.endsWith("@")) {
      setMentionOpen(true);
    } else if (text.endsWith("/")) {
      setSlashCommandOpen(true);
    }
  };

  const renderModeIcon = () => {
    switch (activeOperatingMode) {
      case "ask_before_change":
        return <Hand size={13} color="#f59e0b" />;
      case "edit_automatically":
        return <ShieldCheck size={13} color="#22c55e" />;
      case "plan_mode":
        return <ClipboardList size={13} color="#38bdf8" />;
      case "full_access_yolo":
      default:
        return <ShieldAlert size={13} color="#f59e0b" />;
    }
  };

  const getModeLabel = () => {
    switch (activeOperatingMode) {
      case "ask_before_change":
        return "Ask before changes";
      case "edit_automatically":
        return "Edit automatically";
      case "plan_mode":
        return "Plan mode";
      case "full_access_yolo":
      default:
        return "Full access";
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Navigation Bar */}
      <HeaderBar />

      {/* Main Workspace Body */}
      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.mainContent}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* User Prompt Message */}
        <View style={styles.userMessageContainer}>
          <View style={styles.userBubble}>
            <Text style={styles.userText}>apakah sudah?? dan di run??</Text>
          </View>
        </View>

        {/* Rich AI Execution Progress Stream (Image 4 & 5) */}
        <ExecutionProgressCard />

        {/* AI Markdown Explanation */}
        <View style={styles.aiMessageBlock}>
          <Text style={styles.aiParagraph}>
            Saya telah memeriksa server HTTP lokal dan memastikannya berjalan secara
            persisten di port 8000.
          </Text>
          <Text style={styles.aiParagraph}>
            File <Text style={styles.inlineCode}>server.js</Text> telah dibuat dan di-run
            di latar belakang. Anda dapat meninjau diff kode atau membuka preview web secara langsung.
          </Text>
        </View>

        {/* Action Card: Web Server Preview */}
        <View style={styles.actionCard}>
          <View style={styles.actionCardLeft}>
            <View style={styles.actionIconContainer}>
              <Globe size={18} color="#38bdf8" />
            </View>
            <View>
              <Text style={styles.actionCardTitle}>localhost:8000</Text>
              <Text style={styles.actionCardSubtitle}>Website preview running</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.btnActionOpen}
            onPress={() => {
              openSideTab({
                id: "tab-browser",
                type: "Browser",
                title: "localhost:8000",
                url: "http://localhost:8000/",
                isClosable: true,
              });
            }}
          >
            <Text style={styles.btnActionOpenText}>Open</Text>
            <ChevronRight size={13} color="#d4d4d8" />
          </TouchableOpacity>
        </View>

        {/* Action Card: File Changes Diff */}
        <View style={styles.actionCard}>
          <View style={styles.actionCardLeft}>
            <View style={styles.actionIconContainer}>
              <FileCode size={18} color="#eab308" />
            </View>
            <View>
              <View style={styles.fileCardHeader}>
                <Text style={styles.actionCardTitle}>server.js</Text>
                <Text style={styles.diffPill}>+42 -0</Text>
              </View>
              <Text style={styles.actionCardSubtitle}>1 file modified</Text>
            </View>
          </View>

          <View style={styles.fileCardButtons}>
            <TouchableOpacity
              style={styles.btnReviewCode}
              onPress={() => {
                openSideTab({
                  id: "tab-file-server",
                  type: "File",
                  title: "server.js",
                  filename: "server.js",
                  isClosable: true,
                });
              }}
            >
              <Text style={styles.btnReviewCodeText}>Review</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnUndoMini}>
              <Undo2 size={13} color="#a1a1aa" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Input Dock */}
      <View style={[styles.inputDockContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.inputBoxContainer}>
          <TextInput
            style={styles.inputTextInput}
            placeholder="Ask for follow-up changes..."
            placeholderTextColor="#71717a"
            multiline
            value={promptInput}
            onChangeText={handlePromptChange}
          />

          {/* Bottom Dock Action Bar */}
          <View style={styles.dockActionBar}>
            <View style={styles.dockLeftControls}>
              <TouchableOpacity
                style={styles.dockIconButton}
                onPress={() => setPlusMenuOpen(true)}
                activeOpacity={0.7}
                accessibilityLabel="Add attachment, context, or commands"
              >
                <Plus size={16} color="#a1a1aa" />
              </TouchableOpacity>

              {/* Operating Mode Pill */}
              <TouchableOpacity
                style={styles.modePill}
                onPress={() => setOperatingModeModalOpen(true)}
                activeOpacity={0.7}
              >
                {renderModeIcon()}
                <Text style={styles.modePillText}>
                  {getModeLabel()}
                </Text>
                <ChevronDown size={11} color="#a1a1aa" />
              </TouchableOpacity>
            </View>

            <View style={styles.dockRightControls}>
              {/* Context Meter Ring Button */}
              <TouchableOpacity
                style={styles.contextMeterBtn}
                onPress={() => setContextMeterOpen(true)}
                activeOpacity={0.7}
                accessibilityLabel="Context window meter"
              >
                <Disc size={13} color="#71717a" />
              </TouchableOpacity>

              {/* Active Model Pill */}
              <TouchableOpacity
                style={styles.modelPill}
                onPress={() => setModelSelectorModalOpen(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.modelPillText} numberOfLines={1}>
                  {activeModel}
                </Text>
                <ChevronDown size={11} color="#a1a1aa" />
              </TouchableOpacity>

              {/* Send Button */}
              <TouchableOpacity style={styles.sendButton}>
                <ArrowUp size={16} color="#09090b" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Overlays & Drawers */}
      <TaskDrawer />
      <ReviewSidePanel />
      <WorkspaceModal />
      <HeaderOverflowMenu />
      <SettingsModal />
      <TerminalDrawer />
      <OperatingModeModal />
      <ModelSelectorModal />
      <ContextWindowModal />
      <PlusActionMenu />
      <MentionContextModal />
      <SlashCommandModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#09090b",
  },
  mainScroll: {
    flex: 1,
  },
  mainContent: {
    padding: 14,
    paddingBottom: 120,
  },
  userMessageContainer: {
    alignItems: "flex-end",
    marginBottom: 16,
  },
  userBubble: {
    backgroundColor: "#1f1f23",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    maxWidth: "85%",
    borderWidth: 1,
    borderColor: "#2a2a30",
  },
  userText: {
    color: "#f4f4f5",
    fontSize: 13.5,
    lineHeight: 19,
  },
  accordionCard: {
    backgroundColor: "#111114",
    borderColor: "#1e1e24",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  accordionTitle: {
    color: "#a1a1aa",
    fontSize: 12,
    fontWeight: "500",
  },
  accordionSteps: {
    marginTop: 8,
    paddingLeft: 20,
    gap: 6,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stepIcon: {
    marginRight: 2,
  },
  stepText: {
    color: "#71717a",
    fontSize: 12,
  },
  stepCommand: {
    color: "#e4e4e7",
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  stepFile: {
    color: "#fafafa",
    fontSize: 12,
    fontWeight: "500",
  },
  stepDiff: {
    color: "#4ade80",
    fontSize: 11,
    fontWeight: "bold",
  },
  aiMessageBlock: {
    marginBottom: 16,
    gap: 10,
  },
  aiParagraph: {
    color: "#d4d4d8",
    fontSize: 13.5,
    lineHeight: 20,
  },
  inlineCode: {
    backgroundColor: "#1e1e24",
    color: "#38bdf8",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 12,
  },
  actionCard: {
    backgroundColor: "#121215",
    borderColor: "#222228",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  actionCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  actionIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 7,
    backgroundColor: "#18181b",
    alignItems: "center",
    justifyContent: "center",
  },
  actionCardTitle: {
    color: "#fafafa",
    fontSize: 13,
    fontWeight: "600",
  },
  actionCardSubtitle: {
    color: "#71717a",
    fontSize: 11,
    marginTop: 1,
  },
  fileCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  diffPill: {
    color: "#4ade80",
    fontSize: 11,
    fontWeight: "bold",
  },
  btnActionOpen: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e24",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  btnActionOpenText: {
    color: "#e4e4e7",
    fontSize: 12,
    fontWeight: "500",
  },
  fileCardButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  btnReviewCode: {
    backgroundColor: "#1e1e24",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  btnReviewCodeText: {
    color: "#e4e4e7",
    fontSize: 12,
    fontWeight: "500",
  },
  btnUndoMini: {
    backgroundColor: "#18181b",
    padding: 5,
    borderRadius: 6,
  },
  inputDockContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: "rgba(9, 9, 11, 0.95)",
  },
  inputBoxContainer: {
    backgroundColor: "#141418",
    borderColor: "#27272a",
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  inputTextInput: {
    color: "#fafafa",
    fontSize: 13,
    minHeight: 36,
    maxHeight: 90,
    padding: 0,
    textAlignVertical: "top",
    borderWidth: 0,
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : {}),
  },
  dockActionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#1e1e24",
  },
  dockLeftControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dockIconButton: {
    padding: 4,
  },
  modePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e24",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  modePillText: {
    color: "#e4e4e7",
    fontSize: 11,
    fontWeight: "500",
  },
  dockRightControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  contextMeterBtn: {
    padding: 4,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  modelPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e24",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    maxWidth: 160,
  },
  modelPillText: {
    color: "#e4e4e7",
    fontSize: 11,
    fontWeight: "500",
  },
  sendButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fafafa",
    alignItems: "center",
    justifyContent: "center",
  },
});
