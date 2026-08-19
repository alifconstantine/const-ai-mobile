import React, { useRef, useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  TextInput,
  Platform,
} from "react-native";
import {
  X,
  Plus,
  Terminal as TerminalIcon,
  Trash2,
} from "lucide-react-native";
import { useNavigation } from "../../context/NavigationContext";
import { TermuxBridge } from "../../services/termux/TermuxBridge";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DRAWER_HEIGHT = Math.min(SCREEN_HEIGHT * 0.45, 340);

export const TerminalDrawer: React.FC = () => {
  const { isTerminalOpen, setTerminalOpen } = useNavigation();
  const [commandInput, setCommandInput] = useState("");
  const [history, setHistory] = useState<string[]>([
    "Const AI Terminal — On-Device Environment",
    "Connected to Linux Termux / ADB Bridge",
    "",
    "Ready for commands (e.g. ls, pwd, git, node, python)...",
  ]);

  const slideAnim = useRef(new Animated.Value(DRAWER_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isTerminalOpen) {
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
          toValue: DRAWER_HEIGHT,
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
  }, [isTerminalOpen]);

  const handleRunCommand = async () => {
    if (!commandInput.trim()) return;
    const cmd = commandInput.trim();
    setCommandInput("");
    setHistory((prev) => [...prev, `$ ${cmd}`]);

    if (cmd === "clear" || cmd === "cls") {
      setHistory([]);
      return;
    }

    try {
      const result = await TermuxBridge.executeScript(cmd);
      const outputText = result.stdout || result.output || result.stderr || "";
      const lines = outputText.split("\n").filter((l) => l.length > 0);
      setHistory((prev) => [
        ...prev,
        ...lines,
        `[Process exited with code ${result.exitCode} in ${result.durationMs || 10}ms]`,
      ]);
    } catch (err: any) {
      setHistory((prev) => [
        ...prev,
        `Error: ${err?.message || String(err)}`,
        `[Process exited with code 1]`,
      ]);
    }
  };

  if (!isTerminalOpen) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={isTerminalOpen ? "auto" : "none"}>
      {/* Dimmed backdrop */}
      <TouchableWithoutFeedback onPress={() => setTerminalOpen(false)}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>

      {/* Terminal Sheet */}
      <Animated.View
        style={[
          styles.drawerContainer,
          {
            height: DRAWER_HEIGHT,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Terminal Header Tabs */}
        <View style={styles.header}>
          <View style={styles.tabGroup}>
            <View style={styles.activeTab}>
              <TerminalIcon size={13} color="#fafafa" style={styles.tabIcon} />
              <Text style={styles.activeTabText}>Terminal</Text>
            </View>

            <View style={styles.secondaryTab}>
              <Text style={styles.secondaryTabText}>PowerShell</Text>
            </View>

            <View style={styles.sessionPill}>
              <Text style={styles.sessionPillText}>default</Text>
              <TouchableOpacity onPress={() => {}}>
                <X size={11} color="#71717a" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.addTabBtn}>
              <Plus size={14} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => setHistory([])}
              accessibilityLabel="Clear terminal"
            >
              <Trash2 size={13} color="#71717a" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setTerminalOpen(false)}
              accessibilityLabel="Close terminal"
            >
              <X size={16} color="#a1a1aa" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Terminal Body */}
        <ScrollView style={styles.terminalBody} bounces={false}>
          {history.map((line, idx) => (
            <Text
              key={idx}
              style={[
                styles.terminalText,
                line.includes("Server running") && styles.terminalSuccessText,
                line.startsWith("PS ") && styles.terminalPromptText,
              ]}
            >
              {line}
            </Text>
          ))}
        </ScrollView>

        {/* Command Input Bar */}
        <View style={styles.inputBar}>
          <Text style={styles.promptPrefix}>PS &gt;</Text>
          <TextInput
            style={styles.commandInput}
            value={commandInput}
            onChangeText={setCommandInput}
            placeholder="Type command and press Enter..."
            placeholderTextColor="#52525b"
            onSubmitEditing={handleRunCommand}
            returnKeyType="send"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  drawerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0d0d10",
    borderTopWidth: 1,
    borderTopColor: "#222228",
    zIndex: 150,
    display: "flex",
    flexDirection: "column",
  },
  header: {
    height: 38,
    backgroundColor: "#141418",
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e24",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  tabGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  activeTab: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e24",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  tabIcon: {
    marginRight: 5,
  },
  activeTabText: {
    color: "#fafafa",
    fontSize: 12,
    fontWeight: "600",
  },
  secondaryTab: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  secondaryTabText: {
    color: "#71717a",
    fontSize: 12,
    fontWeight: "500",
  },
  sessionPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  sessionPillText: {
    color: "#a1a1aa",
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  addTabBtn: {
    padding: 4,
    borderRadius: 4,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerIconBtn: {
    padding: 6,
    borderRadius: 4,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 4,
  },
  terminalBody: {
    flex: 1,
    backgroundColor: "#09090b",
    padding: 10,
  },
  terminalText: {
    color: "#d4d4d8",
    fontSize: 11.5,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    lineHeight: 18,
  },
  terminalPromptText: {
    color: "#38bdf8",
    fontWeight: "500",
  },
  terminalSuccessText: {
    color: "#4ade80",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111114",
    borderTopWidth: 1,
    borderTopColor: "#1e1e24",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  promptPrefix: {
    color: "#38bdf8",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginRight: 6,
  },
  commandInput: {
    flex: 1,
    color: "#fafafa",
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    padding: 0,
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : {}),
  },
});
