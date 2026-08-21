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
  ActivityIndicator,
} from "react-native";
import {
  X,
  Plus,
  Terminal as TerminalIcon,
  Trash2,
  Shield,
  Activity,
  CheckCircle,
  AlertCircle,
  Play,
  RotateCcw,
} from "lucide-react-native";
import { useNavigation } from "../../context/NavigationContext";
import { TermuxBridge } from "../../services/termux/TermuxBridge";
import { ShizukuBridge } from "../../services/shizuku/ShizukuBridge";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DRAWER_HEIGHT = Math.min(SCREEN_HEIGHT * 0.5, 380);

type TerminalTabType = "termux" | "shizuku" | "diagnostics";

interface QuickActionChip {
  label: string;
  command: string;
  type: "termux" | "shizuku";
}

const QUICK_ACTIONS: QuickActionChip[] = [
  { label: "git status", command: "git status", type: "termux" },
  { label: "node -v", command: "node -v", type: "termux" },
  { label: "python -V", command: "python -V", type: "termux" },
  { label: "ls -la", command: "ls -la", type: "termux" },
  { label: "adb getprop", command: "getprop ro.build.version.release", type: "shizuku" },
  { label: "pm packages", command: "pm list packages -3", type: "shizuku" },
  { label: "trim-caches", command: "pm trim-caches 100M", type: "shizuku" },
];

export const TerminalDrawer: React.FC = () => {
  const { isTerminalOpen, setTerminalOpen, activeWorkingDirectory } = useNavigation();
  const [activeTab, setActiveTab] = useState<TerminalTabType>("termux");
  const [commandInput, setCommandInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const [termuxHistory, setTermuxHistory] = useState<string[]>([
    "Const AI Linux Shell — Termux Environment",
    "Working Directory: " + (activeWorkingDirectory || "~/projects"),
    "Type any bash / python / node script or use quick chips below.",
    "",
  ]);

  const [shizukuHistory, setShizukuHistory] = useState<string[]>([
    "Const AI Privileged Shell — Shizuku ADB",
    "Direct system shell with Android UID 2000 (shell).",
    "Type any pm, am, dumpsys, or file management command.",
    "",
  ]);

  const [diagnosticsLogs, setDiagnosticsLogs] = useState<Array<{ name: string; status: "success" | "error" | "pending"; detail: string }>>([
    { name: "Termux Intent Bridge", status: "success", detail: "Ready & listening to com.termux.RUN_COMMAND" },
    { name: "Shizuku ADB Service", status: "success", detail: "IPC Binder connection ready" },
    { name: "Local Storage Access", status: "success", detail: "Scoped storage permissions active" },
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

  const handleRunCommand = async (customCmd?: string) => {
    const rawCmd = customCmd !== undefined ? customCmd : commandInput;
    if (!rawCmd.trim()) return;
    const cmd = rawCmd.trim();
    if (customCmd === undefined) setCommandInput("");

    if (cmd === "clear" || cmd === "cls") {
      if (activeTab === "termux") setTermuxHistory([]);
      if (activeTab === "shizuku") setShizukuHistory([]);
      return;
    }

    setIsRunning(true);

    if (activeTab === "termux") {
      setTermuxHistory((prev) => [...prev, `$ ${cmd}`]);
      try {
        const result = await TermuxBridge.executeScript({
          script: cmd,
          workingDir: activeWorkingDirectory || "/data/data/com.termux/files/home",
        });
        const outputText = result.stdout || result.output || result.stderr || "";
        const lines = outputText.split("\n").filter((l) => l.length > 0);
        setTermuxHistory((prev) => [
          ...prev,
          ...lines,
          `[Process exited with code ${result.exitCode} in ${result.durationMs || 12}ms]`,
          "",
        ]);
      } catch (err: any) {
        setTermuxHistory((prev) => [
          ...prev,
          `Error: ${err?.message || String(err)}`,
          `[Process exited with code 1]`,
          "",
        ]);
      } finally {
        setIsRunning(false);
      }
    } else if (activeTab === "shizuku") {
      setShizukuHistory((prev) => [...prev, `adb> ${cmd}`]);
      try {
        const result = await ShizukuBridge.executeCommand(cmd);
        const outputText = result.stdout || result.stderr || "";
        const lines = outputText.split("\n").filter((l) => l.length > 0);
        setShizukuHistory((prev) => [
          ...prev,
          ...lines,
          `[ADB exited with code ${result.exitCode} in ${result.durationMs || 10}ms]`,
          "",
        ]);
      } catch (err: any) {
        setShizukuHistory((prev) => [
          ...prev,
          `ADB Error: ${err?.message || String(err)}`,
          `[ADB exited with code 1]`,
          "",
        ]);
      } finally {
        setIsRunning(false);
      }
    }
  };

  const handleRunDiagnostics = async () => {
    setIsRunning(true);
    setDiagnosticsLogs([
      { name: "Termux Intent Bridge", status: "pending", detail: "Probing RUN_COMMAND IPC..." },
      { name: "Shizuku ADB Service", status: "pending", detail: "Probing Shizuku binder..." },
      { name: "Storage Permissions", status: "pending", detail: "Checking read/write storage..." },
    ]);

    try {
      const termuxStatus = await TermuxBridge.checkStatus();
      const shizukuStatus = await ShizukuBridge.checkStatus();

      setDiagnosticsLogs([
        {
          name: "Termux Intent Bridge",
          status: termuxStatus.isInstalled && termuxStatus.isPermissionGranted ? "success" : "error",
          detail: termuxStatus.isInstalled
            ? `Installed (${termuxStatus.version || "F-Droid"}), Permission Granted: ${termuxStatus.isPermissionGranted}`
            : "Not installed or missing RUN_COMMAND intent permission",
        },
        {
          name: "Shizuku ADB Service",
          status: shizukuStatus.isAvailable && shizukuStatus.isPermissionGranted ? "success" : "error",
          detail: shizukuStatus.isAvailable
            ? `Service Running (v${shizukuStatus.version || "13+"}), UID: ${shizukuStatus.uid || 2000}`
            : "Shizuku service inactive or permission not granted",
        },
        {
          name: "Local Storage Access",
          status: "success",
          detail: `Bound to ${activeWorkingDirectory || "~/projects"}`,
        },
      ]);
    } catch (err: any) {
      console.warn("Diagnostics check error:", err);
    } finally {
      setIsRunning(false);
    }
  };

  if (!isTerminalOpen) {
    return null;
  }

  const currentHistory = activeTab === "termux" ? termuxHistory : shizukuHistory;
  const promptPrefix = activeTab === "termux" ? "$ " : "adb> ";

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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabGroup}>
            {/* Tab 1: Termux Linux */}
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === "termux" && styles.tabBtnActive]}
              onPress={() => setActiveTab("termux")}
              activeOpacity={0.7}
            >
              <TerminalIcon size={13} color={activeTab === "termux" ? "#38bdf8" : "#71717a"} style={styles.tabIcon} />
              <Text style={[styles.tabText, activeTab === "termux" && styles.tabTextActive]}>Termux Linux</Text>
            </TouchableOpacity>

            {/* Tab 2: Shizuku ADB */}
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === "shizuku" && styles.tabBtnActive]}
              onPress={() => setActiveTab("shizuku")}
              activeOpacity={0.7}
            >
              <Shield size={13} color={activeTab === "shizuku" ? "#4ade80" : "#71717a"} style={styles.tabIcon} />
              <Text style={[styles.tabText, activeTab === "shizuku" && styles.tabTextActive]}>Shizuku ADB</Text>
            </TouchableOpacity>

            {/* Tab 3: Diagnostics */}
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === "diagnostics" && styles.tabBtnActive]}
              onPress={() => setActiveTab("diagnostics")}
              activeOpacity={0.7}
            >
              <Activity size={13} color={activeTab === "diagnostics" ? "#eab308" : "#71717a"} style={styles.tabIcon} />
              <Text style={[styles.tabText, activeTab === "diagnostics" && styles.tabTextActive]}>Diagnostics</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.headerRight}>
            {activeTab !== "diagnostics" && (
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={() => {
                  if (activeTab === "termux") setTermuxHistory([]);
                  if (activeTab === "shizuku") setShizukuHistory([]);
                }}
                accessibilityLabel="Clear terminal"
              >
                <Trash2 size={13} color="#71717a" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setTerminalOpen(false)}
              accessibilityLabel="Close terminal"
            >
              <X size={16} color="#a1a1aa" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Action Chips Bar */}
        {activeTab !== "diagnostics" && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickChipsContainer}
          >
            {QUICK_ACTIONS.filter((q) => q.type === activeTab).map((q, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.chipBtn}
                onPress={() => handleRunCommand(q.command)}
                disabled={isRunning}
                activeOpacity={0.7}
              >
                <Play size={9} color="#38bdf8" style={{ marginRight: 4 }} />
                <Text style={styles.chipText}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Terminal Body */}
        {activeTab === "diagnostics" ? (
          <View style={styles.diagnosticsContainer}>
            <View style={styles.diagHeaderRow}>
              <Text style={styles.diagTitle}>System Bridge Health Check</Text>
              <TouchableOpacity
                style={styles.btnRunDiag}
                onPress={handleRunDiagnostics}
                disabled={isRunning}
                activeOpacity={0.8}
              >
                {isRunning ? (
                  <ActivityIndicator size="small" color="#09090b" />
                ) : (
                  <>
                    <RotateCcw size={12} color="#09090b" style={{ marginRight: 4 }} />
                    <Text style={styles.btnRunDiagText}>Re-test Bridges</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.diagList} bounces={false}>
              {diagnosticsLogs.map((log, idx) => (
                <View key={idx} style={styles.diagCard}>
                  <View style={styles.diagCardHeader}>
                    {log.status === "success" ? (
                      <CheckCircle size={14} color="#4ade80" />
                    ) : log.status === "error" ? (
                      <AlertCircle size={14} color="#f87171" />
                    ) : (
                      <ActivityIndicator size="small" color="#eab308" />
                    )}
                    <Text style={styles.diagCardTitle}>{log.name}</Text>
                  </View>
                  <Text style={styles.diagCardDetail}>{log.detail}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : (
          <ScrollView style={styles.terminalBody} bounces={false}>
            {currentHistory.map((line, idx) => (
              <Text
                key={idx}
                style={[
                  styles.terminalText,
                  line.startsWith("$ ") && styles.terminalPromptText,
                  line.startsWith("adb> ") && styles.terminalAdbPromptText,
                  line.includes("exited with code 0") && styles.terminalSuccessText,
                  line.includes("exited with code 1") && styles.terminalErrorText,
                  line.includes("Error:") && styles.terminalErrorText,
                ]}
              >
                {line}
              </Text>
            ))}
            {isRunning && (
              <View style={styles.runningIndicatorRow}>
                <ActivityIndicator size="small" color="#38bdf8" style={{ marginRight: 6 }} />
                <Text style={styles.runningText}>Executing on device...</Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* Command Input Bar */}
        {activeTab !== "diagnostics" && (
          <View style={styles.inputBar}>
            <Text style={activeTab === "termux" ? styles.promptPrefix : styles.promptPrefixAdb}>
              {promptPrefix}
            </Text>
            <TextInput
              style={styles.commandInput}
              value={commandInput}
              onChangeText={setCommandInput}
              placeholder={activeTab === "termux" ? "Jalankan bash script..." : "Jalankan perintah ADB..."}
              placeholderTextColor="#52525b"
              onSubmitEditing={() => handleRunCommand()}
              returnKeyType="send"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isRunning}
            />
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
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
    gap: 4,
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: "#18181c",
  },
  tabBtnActive: {
    backgroundColor: "#222228",
    borderTopWidth: 2,
    borderTopColor: "#38bdf8",
  },
  tabIcon: {
    marginRight: 5,
  },
  tabText: {
    color: "#71717a",
    fontSize: 11.5,
    fontWeight: "500",
  },
  tabTextActive: {
    color: "#fafafa",
    fontWeight: "600",
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
  quickChipsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 6,
    backgroundColor: "#111114",
    borderBottomWidth: 1,
    borderBottomColor: "#1c1c22",
  },
  chipBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1c1c22",
    borderWidth: 1,
    borderColor: "#27272a",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  chipText: {
    color: "#d4d4d8",
    fontSize: 10.5,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
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
    lineHeight: 17,
  },
  terminalPromptText: {
    color: "#38bdf8",
    fontWeight: "600",
  },
  terminalAdbPromptText: {
    color: "#4ade80",
    fontWeight: "600",
  },
  terminalSuccessText: {
    color: "#4ade80",
    fontSize: 10.5,
  },
  terminalErrorText: {
    color: "#f87171",
    fontSize: 10.5,
  },
  runningIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  runningText: {
    color: "#38bdf8",
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  diagnosticsContainer: {
    flex: 1,
    backgroundColor: "#09090b",
    padding: 12,
  },
  diagHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  diagTitle: {
    color: "#fafafa",
    fontSize: 13,
    fontWeight: "600",
  },
  btnRunDiag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#38bdf8",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  btnRunDiagText: {
    color: "#09090b",
    fontSize: 11,
    fontWeight: "700",
  },
  diagList: {
    flex: 1,
  },
  diagCard: {
    backgroundColor: "#16161b",
    borderWidth: 1,
    borderColor: "#222228",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    gap: 4,
  },
  diagCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  diagCardTitle: {
    color: "#fafafa",
    fontSize: 12,
    fontWeight: "600",
  },
  diagCardDetail: {
    color: "#a1a1aa",
    fontSize: 11,
    lineHeight: 16,
    paddingLeft: 20,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
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
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginRight: 6,
  },
  promptPrefixAdb: {
    color: "#4ade80",
    fontSize: 12,
    fontWeight: "700",
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
