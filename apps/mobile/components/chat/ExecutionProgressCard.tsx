import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import {
  ChevronDown,
  ChevronRight,
  Terminal,
  FileCode,
  FileText,
  Search,
  BrainCircuit,
  Sliders,
  CheckCircle2,
  Settings2,
} from "lucide-react-native";

export const ExecutionProgressCard: React.FC = () => {
  const [isMainExpanded, setIsMainExpanded] = useState(true);
  const [isExploredExpanded, setIsExploredExpanded] = useState(false);
  const [isRanExpanded, setIsRanExpanded] = useState(true);
  const [isThoughtExpanded, setIsThoughtExpanded] = useState(true);
  const [isThought2Expanded, setIsThought2Expanded] = useState(false);

  return (
    <View style={styles.container}>
      {/* Top Header: Worked for 1m 48s */}
      <TouchableOpacity
        style={styles.mainHeader}
        onPress={() => setIsMainExpanded((prev) => !prev)}
        activeOpacity={0.7}
      >
        <Text style={styles.mainHeaderTitle}>Worked for 1m 48s</Text>
        {isMainExpanded ? (
          <ChevronDown size={14} color="#8e8e93" />
        ) : (
          <ChevronRight size={14} color="#8e8e93" />
        )}
      </TouchableOpacity>

      {isMainExpanded && (
        <View style={styles.streamBody}>
          {/* Sub-step 1: Explored 1 list, 1 file */}
          <View style={styles.stepBlock}>
            <TouchableOpacity
              style={styles.subHeaderRow}
              onPress={() => setIsExploredExpanded((prev) => !prev)}
              activeOpacity={0.7}
            >
              <Search size={13} color="#a1a1aa" style={{ marginRight: 6 }} />
              <Text style={styles.subHeaderText}>Explore • 1 list, 1 file</Text>
              {isExploredExpanded ? (
                <ChevronDown size={12} color="#71717a" style={{ marginLeft: 4 }} />
              ) : (
                <ChevronRight size={12} color="#71717a" style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>

            {isExploredExpanded && (
              <View style={styles.exploredList}>
                <Text style={styles.exploredItem}>📁 D:/Code/Battle/Sample/Gargantua/</Text>
                <Text style={styles.exploredItem}>📄 plan.md (3.6 KB)</Text>
              </View>
            )}
          </View>

          {/* Sub-step 2: Ran Terminal Command */}
          <View style={styles.stepBlock}>
            <TouchableOpacity
              style={styles.subHeaderRow}
              onPress={() => setIsRanExpanded((prev) => !prev)}
              activeOpacity={0.7}
            >
              <Text style={styles.ranLabel}>Ran</Text>
              {isRanExpanded ? (
                <ChevronDown size={12} color="#71717a" style={{ marginLeft: 4 }} />
              ) : (
                <ChevronRight size={12} color="#71717a" style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>

            {isRanExpanded && (
              <View style={styles.terminalBox}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View>
                    <Text style={styles.termPrompt}>
                      $ ls -la "D:/Code/Battle/Sample/Gargantua"
                    </Text>
                    <Text style={styles.termOutput}>total 8</Text>
                    <Text style={styles.termOutput}>
                      drwxr-xr-x 1 AlifConstantine 197121    0 Aug 14 14:46 .
                    </Text>
                    <Text style={styles.termOutput}>
                      drwxr-xr-x 1 AlifConstantine 197121    0 Aug 14 14:46 ..
                    </Text>
                    <Text style={styles.termOutput}>
                      drwxr-xr-x 1 AlifConstantine 197121    0 Aug 14 14:46 gargantua
                    </Text>
                    <Text style={styles.termOutput}>
                      -rw-r--r-- 1 AlifConstantine 197121 3682 Aug 14 14:46 plan.md
                    </Text>
                  </View>
                </ScrollView>
              </View>
            )}
          </View>

          {/* Sub-step 3: Read plan.md */}
          <View style={styles.actionRow}>
            <Text style={styles.actionType}>Read</Text>
            <FileText size={13} color="#38bdf8" style={{ marginHorizontal: 5 }} />
            <Text style={styles.fileHighlight}>plan.md</Text>
            <Text style={styles.filePath} numberOfLines={1}>
              D:/Code/Battle/Sample/Gargantua/
            </Text>
          </View>

          {/* Sub-step 4: Thought for 1s (Chain of Thought) */}
          <View style={styles.stepBlock}>
            <TouchableOpacity
              style={styles.subHeaderRow}
              onPress={() => setIsThoughtExpanded((prev) => !prev)}
              activeOpacity={0.7}
            >
              <Text style={styles.subHeaderText}>Thought for 1s</Text>
              {isThoughtExpanded ? (
                <ChevronDown size={12} color="#71717a" style={{ marginLeft: 4 }} />
              ) : (
                <ChevronRight size={12} color="#71717a" style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>

            {isThoughtExpanded && (
              <View style={styles.thoughtBox}>
                <Text style={styles.thoughtTitle}>Executing the Plan</Text>
                <Text style={styles.thoughtBody}>
                  I'm now methodically proceeding with the approved plan. I'm going to start by adding the necessary types and state for the <Text style={styles.inlineCode}>ReviewTabType</Text> with the allowed values "Review", "File", "Browser", and "Explore".
                </Text>

                <Text style={[styles.thoughtTitle, { marginTop: 10 }]}>
                  Defining New Tab Structure
                </Text>
                <Text style={styles.thoughtBody}>
                  I've moved on from the initial tab update and am now defining the new data structure. I'm building a dynamic <Text style={styles.inlineCode}>openTabs</Text> list using an ID, tab type, and closable properties.
                </Text>
              </View>
            )}
          </View>

          {/* Sub-step 5: Analyzed file */}
          <View style={styles.actionRow}>
            <Text style={styles.actionType}>Analyzed</Text>
            <Settings2 size={13} color="#38bdf8" style={{ marginHorizontal: 5 }} />
            <Text style={styles.fileHighlight}>NavigationContext.tsx</Text>
            <Text style={styles.lineRange}>#L1-280</Text>
          </View>

          {/* Sub-step 6: Edited NavigationContext.tsx */}
          <View style={styles.actionRow}>
            <Text style={styles.actionType}>Edited</Text>
            <FileCode size={13} color="#38bdf8" style={{ marginHorizontal: 5 }} />
            <Text style={styles.fileHighlight}>NavigationContext.tsx</Text>
            <Text style={styles.diffPlus}>+196</Text>
            <Text style={styles.diffMinus}>-2</Text>
          </View>

          {/* Sub-step 7: Thought for 1s (2) */}
          <View style={styles.stepBlock}>
            <TouchableOpacity
              style={styles.subHeaderRow}
              onPress={() => setIsThought2Expanded((prev) => !prev)}
              activeOpacity={0.7}
            >
              <Text style={styles.subHeaderText}>Thought for 1s</Text>
              {isThought2Expanded ? (
                <ChevronDown size={12} color="#71717a" style={{ marginLeft: 4 }} />
              ) : (
                <ChevronRight size={12} color="#71717a" style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>

            {isThought2Expanded && (
              <View style={styles.thoughtBox}>
                <Text style={styles.thoughtBody}>
                  All component interfaces aligned with the new multi-tab review panel architecture.
                </Text>
              </View>
            )}
          </View>

          {/* Sub-step 8: Edited PlusActionMenu.tsx */}
          <View style={styles.actionRow}>
            <Text style={styles.actionType}>Edited</Text>
            <FileCode size={13} color="#38bdf8" style={{ marginHorizontal: 5 }} />
            <Text style={styles.fileHighlight}>PlusActionMenu.tsx</Text>
            <Text style={styles.diffPlus}>+127</Text>
            <Text style={styles.diffMinus}>-0</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginTop: 6,
    marginBottom: 10,
  },
  mainHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  mainHeaderTitle: {
    color: "#a1a1aa",
    fontSize: 12.5,
    fontWeight: "500",
  },
  streamBody: {
    paddingLeft: 4,
    marginTop: 6,
    gap: 8,
  },
  stepBlock: {
    marginBottom: 2,
  },
  subHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  subHeaderText: {
    color: "#8e8e93",
    fontSize: 12,
    fontWeight: "500",
  },
  ranLabel: {
    color: "#8e8e93",
    fontSize: 12,
    fontWeight: "500",
  },
  exploredList: {
    backgroundColor: "#131316",
    borderColor: "#202026",
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
    gap: 4,
  },
  exploredItem: {
    color: "#d4d4d8",
    fontSize: 11.5,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  terminalBox: {
    backgroundColor: "#111114",
    borderColor: "#202026",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  termPrompt: {
    color: "#fafafa",
    fontSize: 11.5,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontWeight: "600",
    marginBottom: 4,
  },
  termOutput: {
    color: "#a1a1aa",
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
    flexWrap: "wrap",
  },
  actionType: {
    color: "#8e8e93",
    fontSize: 12,
    fontWeight: "500",
  },
  fileHighlight: {
    color: "#fafafa",
    fontSize: 12,
    fontWeight: "600",
    marginRight: 6,
  },
  filePath: {
    color: "#71717a",
    fontSize: 11,
    flex: 1,
  },
  lineRange: {
    color: "#71717a",
    fontSize: 11,
  },
  diffPlus: {
    color: "#4ade80",
    fontSize: 11,
    fontWeight: "600",
    marginRight: 4,
  },
  diffMinus: {
    color: "#f87171",
    fontSize: 11,
    fontWeight: "600",
  },
  thoughtBox: {
    backgroundColor: "#131316",
    borderLeftWidth: 2,
    borderLeftColor: "#27272a",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 4,
  },
  thoughtTitle: {
    color: "#fafafa",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 3,
  },
  thoughtBody: {
    color: "#a1a1aa",
    fontSize: 11.5,
    lineHeight: 17,
  },
  inlineCode: {
    color: "#eab308",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 11,
  },
});
