import React, { useState, useRef, useEffect, useMemo } from "react";
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
import { useQuery, useAction, useMutation } from "convex/react";
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
import { FloatingHitlBar } from "../components/hitl/FloatingHitlBar";
import { useDeviceAgentRunner } from "../hooks/useDeviceAgentRunner";
import { useNavigation } from "../context/NavigationContext";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [isSending, setIsSending] = useState(false);
  const [optimisticUserMessage, setOptimisticUserMessage] = useState<{
    content: string;
    createdAt: number;
  } | null>(null);

  const {
    currentUserId,
    currentUser,
    userConfig,
    isAuthenticated,
    isAuthLoading,
    activeConversationId,
    activeTaskTitle,
    setActiveTaskTitle,
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

  // Query pending HITL actions for the active conversation
  const pendingActions = useQuery(
    api.pendingActions.listPendingByConversation,
    activeConversationId && !activeConversationId.startsWith("local_")
      ? { conversationId: activeConversationId as any }
      : "skip"
  );

  // Map pending actions by toolCallId for fast lookup
  const pendingActionMap = useMemo(() => {
    const map: Record<string, any> = {};
    if (pendingActions) {
      for (const pa of pendingActions) {
        if (pa.toolCallId) {
          map[pa.toolCallId] = pa;
        }
      }
    }
    return map;
  }, [pendingActions]);

  const activePendingCount = useMemo(() => {
    return pendingActions?.filter((pa: any) => pa.status === "pending").length || 0;
  }, [pendingActions]);

  // Autonomous On-Device Tool Runner (executes running tool calls via native bridges)
  useDeviceAgentRunner({
    conversationId: activeConversationId,
    userId: currentUserId,
    messages: messages as any,
  });

  // Send action dispatcher & update title mutation
  const sendMessageAction = useAction(api.agent.sendMessage);
  const updateTitleMutation = useMutation(api.conversations.updateConversationTitle);

  // Auto-scroll on new messages or optimistic message
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages?.length, isSending, optimisticUserMessage]);

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
    setOptimisticUserMessage({ content: text, createdAt: Date.now() });

    try {
      let convId = activeConversationId;
      const snippet = text.slice(0, 30) + (text.length > 30 ? "..." : "");

      if (!convId || convId.startsWith("local_")) {
        const createdId = await createNewConversation(snippet);
        if (createdId) {
          convId = createdId;
        }
      } else if (activeTaskTitle === "New Task") {
        setActiveTaskTitle(snippet);
        try {
          await updateTitleMutation({
            conversationId: convId as any,
            title: snippet,
          });
        } catch {
          // ignore
        }
      }

      if (!convId || convId.startsWith("local_")) {
        console.warn("No active conversation ID available for chat.");
        setIsSending(false);
        setOptimisticUserMessage(null);
        return;
      }

      await sendMessageAction({
        userId: currentUserId ? (currentUserId as any) : undefined,
        conversationId: convId as any,
        userMessage: text,
        modelOverride: activeModel,
        operatingModeOverride: activeOperatingMode,
        customApiKeyOverride: customApiKey || undefined,
        customBaseUrlOverride: customBaseUrl || undefined,
      });
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSending(false);
      setOptimisticUserMessage(null);
    }
  };

  const renderModeIcon = () => {
    switch (activeOperatingMode) {
      case "normal_mode":
        return <Bot size={13} color="#22c55e" />;
      case "ask_before_change":
        return <Hand size={13} color="#f59e0b" />;
      case "plan_mode":
        return <ClipboardList size={13} color="#38bdf8" />;
      case "full_access_yolo":
      default:
        return <ShieldAlert size={13} color="#ef4444" />;
    }
  };

  const getModeLabel = () => {
    switch (activeOperatingMode) {
      case "normal_mode":
        return "Normal mode";
      case "ask_before_change":
        return "Ask before changes";
      case "plan_mode":
        return "Plan mode";
      case "full_access_yolo":
      default:
        return "Full access";
    }
  };

  const modelPillLabel = useMemo(() => {
    const customProvs = userConfig?.customProviders || [];
    const keys = userConfig?.customApiKeys;
    const hasAnyConfigured =
      customProvs.some((p: any) => p.isActive !== false && p.models?.length > 0) ||
      Boolean(keys?.gemini || keys?.anthropic || keys?.openAi || keys?.openRouter);

    const raw = activeModel || userConfig?.activeModel || "";
    if (!raw || !hasAnyConfigured) {
      return "Manage models";
    }

    // 1. Search in custom providers
    if (customProvs.length > 0) {
      for (const prov of customProvs) {
        if (prov.isActive !== false && prov.models) {
          const matched = prov.models.find(
            (m: { id: string; name?: string }) => m.id === raw || m.name === raw
          );
          if (matched) {
            return `${prov.name} / ${matched.name || matched.id}`;
          }
        }
      }
    }

    // 2. Format standard cloud models
    if (raw.toLowerCase().startsWith("gemini") || raw.toLowerCase().startsWith("google/")) {
      const clean = raw.replace(/^google\//, "");
      return `Gemini / ${clean === "gemini-2.0-flash" ? "2.0 Flash" : clean === "gemini-2.0-pro-exp-02-05" ? "2.0 Pro" : clean}`;
    }
    if (raw.toLowerCase().startsWith("claude") || raw.toLowerCase().startsWith("anthropic/")) {
      const clean = raw.replace(/^anthropic\//, "");
      return `Claude / ${clean === "claude-3-7-sonnet" ? "3.7 Sonnet" : clean === "claude-3-5-sonnet" ? "3.5 Sonnet" : clean}`;
    }
    if (raw.toLowerCase().startsWith("gpt") || raw.toLowerCase().startsWith("o3") || raw.toLowerCase().startsWith("o1")) {
      return `OpenAI / ${raw === "gpt-4o" ? "GPT-4o" : raw === "gpt-4o-mini" ? "GPT-4o Mini" : raw}`;
    }
    if (raw.toLowerCase().startsWith("deepseek") || raw.toLowerCase().startsWith("openrouter/")) {
      const clean = raw.replace(/^openrouter\//, "");
      return `OpenRouter / ${clean}`;
    }

    if (raw === "Const") return "OmniRoute / Const";
    return raw || "Manage models";
  }, [userConfig, activeModel]);

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
        {(!messages || messages.length === 0) && !optimisticUserMessage && !isSending && (
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
            pendingActionMap={pendingActionMap}
            onCopyPrompt={(txt) => setPromptInput(txt)}
          />
        ))}

        {/* Optimistic User Prompt Bubble immediately rendered upon Send */}
        {optimisticUserMessage &&
          (!messages ||
            !messages.some(
              (m: any) =>
                m.role === "user" && m.content === optimisticUserMessage.content
            )) && (
            <ChatMessageItem
              key="optimistic_user_msg"
              message={{
                _id: "optimistic_temp_id",
                role: "user",
                content: optimisticUserMessage.content,
                createdAt: optimisticUserMessage.createdAt,
              }}
            />
          )}

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
        {/* Floating HITL Banner if actions await approval */}
        <FloatingHitlBar
          pendingCount={activePendingCount}
          onPress={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        />

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
                  {modelPillLabel}
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
