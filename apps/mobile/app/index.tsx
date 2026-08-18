import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Plus,
  ArrowUp,
  ChevronDown,
  Disc,
  Hand,
  ShieldCheck,
  ClipboardList,
  ShieldAlert,
  Bot,
  Sparkles,
} from "lucide-react-native";
import { useQuery, useAction } from "convex/react";
import { api } from "@const-ai/backend";

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
import { useRouter } from "expo-router";
import { SlashCommandModal } from "../components/dock/SlashCommandModal";
import { ChatMessageItem } from "../components/chat/ChatMessageItem";
import { ThinkingIndicator } from "../components/chat/ThinkingIndicator";
import { useNavigation } from "../context/NavigationContext";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [isSending, setIsSending] = useState(false);

  const {
    currentUserId,
    currentUser,
    isAuthenticated,
    isAuthLoading,
    activeConversationId,
    activeModel,
    activeOperatingMode,
    setOperatingModeModalOpen,
    setModelSelectorModalOpen,
    setContextMeterOpen,
    setPlusMenuOpen,
    setMentionOpen,
    setSlashCommandOpen,
    promptInput,
    setPromptInput,
    createNewConversation,
    customApiKey,
    customBaseUrl,
  } = useNavigation();

  // Auth Guard
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isAuthLoading]);

  // Query live messages from Convex
  const messages = useQuery(
    api.messages.listMessages,
    activeConversationId && !activeConversationId.startsWith("local_")
      ? { conversationId: activeConversationId as any }
      : "skip"
  );

  // Send action dispatcher
  const sendMessageAction = useAction(api.agent.sendMessage);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages?.length]);

  const handlePromptChange = (text: string) => {
    setPromptInput(text);
    if (text.endsWith("@")) {
      setMentionOpen(true);
    } else if (text.endsWith("/")) {
      setSlashCommandOpen(true);
    }
  };

  const handleSendMessage = async () => {
    const text = promptInput.trim();
    if (!text || isSending) return;

    setPromptInput("");
    setIsSending(true);

    try {
      let convId = activeConversationId;
      if (!convId || convId.startsWith("local_")) {
        const newTitle = text.slice(0, 30) + (text.length > 30 ? "..." : "");
        const createdId = await createNewConversation(newTitle);
        if (createdId) {
          convId = createdId;
        }
      }

      if (!currentUserId || !convId) {
        setIsSending(false);
        return;
      }

      await sendMessageAction({
        userId: currentUserId as any,
        conversationId: convId as any,
        userMessage: text,
        modelOverride: activeModel,
        operatingModeOverride: activeOperatingMode,
        customApiKeyOverride: customApiKey,
        customBaseUrlOverride: customBaseUrl,
      });
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSending(false);
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

  if (isAuthLoading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Bot size={36} color="#38bdf8" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Top Navigation Bar */}
      <HeaderBar />

      {/* Main Chat Scroll View */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.mainScroll}
        contentContainerStyle={styles.mainContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Welcome Banner when conversation is empty */}
        {(!messages || messages.length === 0) && !isSending && (
          <View style={styles.welcomeContainer}>
            <View style={styles.welcomeIconCircle}>
              <Bot size={28} color="#38bdf8" />
            </View>
            <Text style={styles.welcomeTitle}>Const AI Mobile</Text>
            <Text style={styles.welcomeSubtitle}>
              Autonomous On-Device Agent & Productivity Engine
            </Text>

            <View style={styles.sampleSuggestions}>
              <TouchableOpacity
                style={styles.suggestionChip}
                onPress={() =>
                  setPromptInput("Periksa status memori internal dan bersihkan file sampah")
                }
              >
                <Sparkles size={12} color="#a1a1aa" />
                <Text style={styles.suggestionText}>
                  "Bersihkan file sampah & cache storage"
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.suggestionChip}
                onPress={() =>
                  setPromptInput("Buat script server HTTP node.js di port 8000")
                }
              >
                <Sparkles size={12} color="#a1a1aa" />
                <Text style={styles.suggestionText}>
                  "Buat script server HTTP di port 8000"
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.suggestionChip}
                onPress={() =>
                  setPromptInput("Buka aplikasi YouTube via Accessibility spatial tap")
                }
              >
                <Sparkles size={12} color="#a1a1aa" />
                <Text style={styles.suggestionText}>
                  "Buka aplikasi YouTube di HP"
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Live Messages List */}
        {messages?.map((msg: any) => (
          <ChatMessageItem
            key={msg._id}
            message={msg}
            onCopyPrompt={(txt) => setPromptInput(txt)}
          />
        ))}

        {/* Thinking Indicator while AI processes */}
        {isSending && <ThinkingIndicator />}
      </ScrollView>

      {/* Floating Bottom Input Dock */}
      <View
        style={[
          styles.inputDockContainer,
          { paddingBottom: Math.max(insets.bottom, 10) },
        ]}
      >
        <View style={styles.inputBoxContainer}>
          <TextInput
            style={styles.inputTextInput}
            placeholder="Type instructions or ask anything..."
            placeholderTextColor="#71717a"
            multiline
            value={promptInput}
            onChangeText={handlePromptChange}
            onSubmitEditing={handleSendMessage}
          />

          {/* Bottom Dock Action Bar */}
          <View style={styles.dockActionBar}>
            <View style={styles.dockLeftControls}>
              <TouchableOpacity
                style={styles.dockIconButton}
                onPress={() => setPlusMenuOpen(true)}
                activeOpacity={0.7}
                accessibilityLabel="Add attachment or skill commands"
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
                <Text style={styles.modePillText}>{getModeLabel()}</Text>
                <ChevronDown size={11} color="#a1a1aa" />
              </TouchableOpacity>
            </View>

            <View style={styles.dockRightControls}>
              {/* Context Meter Button */}
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
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  Boolean(promptInput.trim()) && styles.sendButtonActive,
                ]}
                onPress={handleSendMessage}
                disabled={isSending || !promptInput.trim()}
                activeOpacity={0.8}
              >
                <ArrowUp
                  size={16}
                  color={promptInput.trim() ? "#09090b" : "#52525b"}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Drawers & Modals Overlays */}
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
    </KeyboardAvoidingView>
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
    paddingBottom: 130,
    flexGrow: 1,
  },
  welcomeContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  welcomeIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  welcomeTitle: {
    color: "#fafafa",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  welcomeSubtitle: {
    color: "#71717a",
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
  sampleSuggestions: {
    marginTop: 24,
    width: "100%",
    gap: 8,
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#141418",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#222228",
  },
  suggestionText: {
    color: "#a1a1aa",
    fontSize: 12,
  },
  inputDockContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    backgroundColor: "transparent",
  },
  inputBoxContainer: {
    backgroundColor: "#141418",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#27272a",
    paddingTop: 10,
    paddingHorizontal: 12,
    paddingBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  inputTextInput: {
    color: "#fafafa",
    fontSize: 14,
    lineHeight: 20,
    maxHeight: 90,
    padding: 0,
    marginBottom: 8,
  },
  dockActionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dockLeftControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dockIconButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1f1f24",
  },
  modePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1f1f24",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  modePillText: {
    color: "#d4d4d8",
    fontSize: 11,
    fontWeight: "500",
  },
  dockRightControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  contextMeterBtn: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1f1f24",
    borderRadius: 6,
  },
  modelPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1f1f24",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
    maxWidth: 100,
  },
  modelPillText: {
    color: "#d4d4d8",
    fontSize: 11,
    fontWeight: "500",
  },
  sendButton: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: "#27272a",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonActive: {
    backgroundColor: "#38bdf8",
  },
});
