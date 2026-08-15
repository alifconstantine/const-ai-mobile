import React, { useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  ScrollView,
  TextInput,
  Platform,
} from "react-native";
import {
  X,
  Plus,
  MessageSquare,
  SquareCode,
  Terminal,
  Globe,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  FolderTree,
  FileCheck,
  FileCode,
} from "lucide-react-native";
import { useNavigation, ReviewTabType, SideTabItem } from "../../context/NavigationContext";
import { CodeDiffView } from "./CodeDiffView";
import { ExploreView } from "./ExploreView";
import { PlanView } from "./PlanView";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PANEL_WIDTH = Math.min(SCREEN_WIDTH * 0.92, 480);

export const ReviewSidePanel: React.FC = () => {
  const {
    isReviewPanelOpen,
    closeReviewPanel,
    activeReviewTab,
    setActiveReviewTab,
    openTabs,
    activeTabId,
    setActiveTabId,
    closeSideTab,
    openSideTab,
  } = useNavigation();

  const slideAnim = useRef(new Animated.Value(PANEL_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isReviewPanelOpen) {
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
          toValue: PANEL_WIDTH,
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
  }, [isReviewPanelOpen]);

  if (!isReviewPanelOpen) {
    return null;
  }

  const handleAddNewTab = () => {
    openSideTab({
      id: "tab-explore",
      type: "Explore",
      title: "Explore",
      isClosable: false,
    });
  };

  const getTabIcon = (tab: SideTabItem) => {
    if (tab.type === "File") {
      return (
        <View style={styles.jsMiniBadge}>
          <Text style={styles.jsMiniBadgeText}>JS</Text>
        </View>
      );
    }
    if (tab.type === "Browser") {
      return <Globe size={13} color="#38bdf8" style={styles.tabIcon} />;
    }
    if (tab.type === "Review") {
      return <SquareCode size={13} color="#eab308" style={styles.tabIcon} />;
    }
    if (tab.type === "Explore") {
      return <FolderTree size={13} color="#38bdf8" style={styles.tabIcon} />;
    }
    if (tab.type === "Plan") {
      return <FileCheck size={13} color="#4ade80" style={styles.tabIcon} />;
    }
    if (tab.type === "Terminal") {
      return <Terminal size={13} color="#fafafa" style={styles.tabIcon} />;
    }
    return <MessageSquare size={13} color="#a1a1aa" style={styles.tabIcon} />;
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={isReviewPanelOpen ? "auto" : "none"}>
      {/* Dimmed backdrop */}
      <TouchableWithoutFeedback onPress={closeReviewPanel}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>

      {/* Sliding Right Panel */}
      <Animated.View
        style={[
          styles.panelContainer,
          {
            width: PANEL_WIDTH,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {/* Panel Header Tabs */}
        <View style={styles.header}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScroll}
          >
            {openTabs.map((tab) => {
              const isActive = activeTabId === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tabButton, isActive && styles.tabButtonActive]}
                  onPress={() => {
                    setActiveTabId(tab.id);
                  }}
                  activeOpacity={0.7}
                >
                  {getTabIcon(tab)}
                  <Text
                    style={[styles.tabText, isActive && styles.tabTextActive]}
                    numberOfLines={1}
                  >
                    {tab.title}
                  </Text>

                  {tab.isClosable && (
                    <TouchableOpacity
                      style={styles.closeTabBtn}
                      onPress={() => closeSideTab(tab.id)}
                    >
                      <X size={11} color="#71717a" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            })}

            {/* Add Tab Button */}
            <TouchableOpacity
              style={styles.addTabBtn}
              onPress={handleAddNewTab}
              accessibilityLabel="Open explore tab"
            >
              <Plus size={14} color="#a1a1aa" />
            </TouchableOpacity>
          </ScrollView>

          {/* Close Panel Button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={closeReviewPanel}
            accessibilityLabel="Close panel"
          >
            <X size={17} color="#a1a1aa" />
          </TouchableOpacity>
        </View>

        {/* Tab Contents */}
        <View style={styles.contentArea}>
          {activeReviewTab === "Review" && <CodeDiffView />}

          {activeReviewTab === "File" && <CodeDiffView />}

          {activeReviewTab === "Explore" && <ExploreView />}

          {activeReviewTab === "Plan" && <PlanView />}

          {activeReviewTab === "Browser" && (
            <View style={styles.browserContainer}>
              <View style={styles.browserNav}>
                <RefreshCw size={13} color="#a1a1aa" />
                <View style={styles.browserUrlBox}>
                  <Text style={styles.browserUrl}>http://localhost:8000/</Text>
                </View>
                <ExternalLink size={14} color="#a1a1aa" />
              </View>
              <View style={styles.browserFrame}>
                <Text style={styles.browserPreviewText}>
                  Preview Web App Running on Localhost:8000
                </Text>
              </View>
            </View>
          )}

          {activeReviewTab === "Side conversation" && (
            <View style={styles.sideChatContainer}>
              <View style={styles.sideChatHeader}>
                <MessageSquare size={16} color="#38bdf8" />
                <Text style={styles.sideChatTitle}>Side Thread</Text>
              </View>
              <ScrollView style={styles.sideChatScroll}>
                <View style={styles.sideBubble}>
                  <Text style={styles.sideBubbleUser}>You</Text>
                  <Text style={styles.sideBubbleText}>
                    Tolong cek apakah port 8000 tidak konflik dengan Termux daemon?
                  </Text>
                </View>
                <View style={styles.sideBubbleAssistant}>
                  <Text style={styles.sideBubbleAi}>Const AI</Text>
                  <Text style={styles.sideBubbleText}>
                    Port 8000 bebas dan siap digunakan untuk serve file statis HTML/JS.
                  </Text>
                </View>
              </ScrollView>
            </View>
          )}

          {activeReviewTab === "Terminal" && (
            <View style={styles.terminalContainer}>
              <View style={styles.terminalHeader}>
                <Text style={styles.terminalTitle}>bash — local:8000</Text>
              </View>
              <ScrollView style={styles.terminalBody}>
                <Text style={styles.termLine}>$ node server.js</Text>
                <Text style={styles.termSuccess}>
                  Server running at http://localhost:8000/
                </Text>
                <Text style={styles.termLine}>
                  [200 OK] GET /index.html (1.2ms)
                </Text>
                <Text style={styles.termLine}>
                  [200 OK] GET /style.css (0.8ms)
                </Text>
              </ScrollView>
            </View>
          )}
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
  panelContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: "#111114",
    borderLeftWidth: 1,
    borderLeftColor: "#222228",
    zIndex: 100,
    display: "flex",
    flexDirection: "column",
  },
  header: {
    height: 42,
    backgroundColor: "#141418",
    borderBottomWidth: 1,
    borderBottomColor: "#222228",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 6,
  },
  tabScroll: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    gap: 4,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: "#18181c",
    gap: 4,
    maxWidth: 160,
  },
  tabButtonActive: {
    backgroundColor: "#222228",
    borderTopWidth: 2,
    borderTopColor: "#38bdf8",
  },
  jsMiniBadge: {
    backgroundColor: "#eab308",
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
    marginRight: 2,
  },
  jsMiniBadgeText: {
    color: "#09090b",
    fontSize: 9,
    fontWeight: "bold",
  },
  tabIcon: {
    marginRight: 2,
  },
  tabText: {
    color: "#71717a",
    fontSize: 12,
    fontWeight: "500",
  },
  tabTextActive: {
    color: "#fafafa",
    fontWeight: "600",
  },
  closeTabBtn: {
    padding: 2,
    marginLeft: 2,
  },
  addTabBtn: {
    padding: 6,
    borderRadius: 4,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 6,
  },
  contentArea: {
    flex: 1,
    backgroundColor: "#0d0d10",
  },
  sideChatContainer: {
    flex: 1,
    padding: 12,
  },
  sideChatHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e24",
    paddingBottom: 8,
  },
  sideChatTitle: {
    color: "#fafafa",
    fontSize: 13,
    fontWeight: "600",
  },
  sideChatScroll: {
    flex: 1,
  },
  sideBubble: {
    backgroundColor: "#18181b",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  sideBubbleAssistant: {
    backgroundColor: "#1c1c22",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 2,
    borderLeftColor: "#38bdf8",
  },
  sideBubbleUser: {
    color: "#a1a1aa",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  sideBubbleAi: {
    color: "#38bdf8",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  sideBubbleText: {
    color: "#f4f4f5",
    fontSize: 12.5,
    lineHeight: 18,
  },
  terminalContainer: {
    flex: 1,
    backgroundColor: "#09090b",
  },
  terminalHeader: {
    backgroundColor: "#121215",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#222228",
  },
  terminalTitle: {
    color: "#a1a1aa",
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  terminalBody: {
    flex: 1,
    padding: 12,
  },
  termLine: {
    color: "#e4e4e7",
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginBottom: 4,
  },
  termSuccess: {
    color: "#4ade80",
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginBottom: 4,
  },
  browserContainer: {
    flex: 1,
    backgroundColor: "#18181b",
  },
  browserNav: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#121215",
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#222228",
  },
  browserUrlBox: {
    flex: 1,
    backgroundColor: "#1e1e24",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  browserUrl: {
    color: "#a1a1aa",
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  browserFrame: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  browserPreviewText: {
    color: "#71717a",
    fontSize: 13,
    textAlign: "center",
  },
});
