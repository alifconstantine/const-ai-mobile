import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  ChevronRight,
  ChevronDown,
  Globe,
  Settings,
  Package,
} from "lucide-react-native";
import { useNavigation } from "../../context/NavigationContext";

interface ExplorerNode {
  id: string;
  name: string;
  isFolder: boolean;
  type?: "code" | "text" | "json" | "web";
  children?: ExplorerNode[];
}

const FILE_TREE: ExplorerNode[] = [
  {
    id: "app-folder",
    name: "app",
    isFolder: true,
    children: [
      { id: "f-layout", name: "_layout.tsx", isFolder: false, type: "code" },
      { id: "f-index", name: "index.tsx", isFolder: false, type: "code" },
    ],
  },
  {
    id: "components-folder",
    name: "components",
    isFolder: true,
    children: [
      { id: "f-header", name: "HeaderBar.tsx", isFolder: false, type: "code" },
      { id: "f-taskdrawer", name: "TaskDrawer.tsx", isFolder: false, type: "code" },
      { id: "f-diff", name: "CodeDiffView.tsx", isFolder: false, type: "code" },
    ],
  },
  {
    id: "f-server",
    name: "server.js",
    isFolder: false,
    type: "code",
  },
  {
    id: "f-index-html",
    name: "index.html",
    isFolder: false,
    type: "web",
  },
  {
    id: "f-package",
    name: "package.json",
    isFolder: false,
    type: "json",
  },
  {
    id: "f-readme",
    name: "README.md",
    isFolder: false,
    type: "text",
  },
];

export const ExploreView: React.FC = () => {
  const { openSideTab } = useNavigation();

  const handleOpenFile = (node: ExplorerNode) => {
    openSideTab({
      id: `tab-file-${node.id}`,
      type: "File",
      title: node.name,
      filename: node.name,
      isClosable: true,
    });
  };

  const renderNode = (node: ExplorerNode, depth = 0) => {
    if (node.isFolder) {
      return (
        <View key={node.id}>
          <View style={[styles.folderRow, { paddingLeft: 12 + depth * 14 }]}>
            <ChevronDown size={12} color="#71717a" style={{ marginRight: 4 }} />
            <Folder size={14} color="#38bdf8" style={{ marginRight: 6 }} />
            <Text style={styles.folderText}>{node.name}</Text>
          </View>
          {node.children?.map((child) => renderNode(child, depth + 1))}
        </View>
      );
    }

    const Icon =
      node.type === "web"
        ? Globe
        : node.type === "json"
        ? Package
        : node.type === "text"
        ? FileText
        : FileCode;

    const iconColor =
      node.type === "web"
        ? "#38bdf8"
        : node.type === "json"
        ? "#eab308"
        : node.type === "text"
        ? "#a1a1aa"
        : "#4ade80";

    return (
      <TouchableOpacity
        key={node.id}
        style={[styles.fileRow, { paddingLeft: 12 + depth * 14 + 16 }]}
        onPress={() => handleOpenFile(node)}
        activeOpacity={0.7}
      >
        <Icon size={13} color={iconColor} style={{ marginRight: 6 }} />
        <Text style={styles.fileText}>{node.name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PROJECT EXPLORER</Text>
      </View>
      <ScrollView style={styles.treeScroll} bounces={false}>
        {FILE_TREE.map((node) => renderNode(node, 0))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0d10",
  },
  header: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e24",
    backgroundColor: "#121215",
  },
  headerTitle: {
    color: "#71717a",
    fontSize: 10.5,
    fontWeight: "600",
    letterSpacing: 0.6,
  },
  treeScroll: {
    flex: 1,
    paddingVertical: 6,
  },
  folderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingRight: 12,
  },
  folderText: {
    color: "#fafafa",
    fontSize: 12.5,
    fontWeight: "500",
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingRight: 12,
    borderRadius: 4,
  },
  fileText: {
    color: "#d4d4d8",
    fontSize: 12,
  },
});
