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
    id: "apps-folder",
    name: "apps",
    isFolder: true,
    children: [
      {
        id: "mobile-folder",
        name: "mobile",
        isFolder: true,
        children: [
          { id: "f-m-layout", name: "app/_layout.tsx", isFolder: false, type: "code" },
          { id: "f-m-index", name: "app/index.tsx", isFolder: false, type: "code" },
          { id: "f-m-nav", name: "context/NavigationContext.tsx", isFolder: false, type: "code" },
          { id: "f-m-package", name: "package.json", isFolder: false, type: "json" },
        ],
      },
      {
        id: "web-folder",
        name: "web",
        isFolder: true,
        children: [
          { id: "f-w-page", name: "app/page.tsx", isFolder: false, type: "code" },
          { id: "f-w-dash", name: "app/dashboard/page.tsx", isFolder: false, type: "code" },
          { id: "f-w-settings", name: "app/dashboard/settings/page.tsx", isFolder: false, type: "code" },
        ],
      },
    ],
  },
  {
    id: "packages-folder",
    name: "packages",
    isFolder: true,
    children: [
      {
        id: "backend-folder",
        name: "backend",
        isFolder: true,
        children: [
          { id: "f-b-agent", name: "convex/agent.ts", isFolder: false, type: "code" },
          { id: "f-b-users", name: "convex/users.ts", isFolder: false, type: "code" },
          { id: "f-b-schema", name: "convex/schema.ts", isFolder: false, type: "code" },
        ],
      },
      {
        id: "types-folder",
        name: "types",
        isFolder: true,
        children: [
          { id: "f-t-index", name: "src/index.ts", isFolder: false, type: "code" },
        ],
      },
    ],
  },
  {
    id: "f-arch",
    name: "ARCHITECTURE.md",
    isFolder: false,
    type: "text",
  },
  {
    id: "f-package",
    name: "package.json",
    isFolder: false,
    type: "json",
  },
  {
    id: "f-turbo",
    name: "turbo.json",
    isFolder: false,
    type: "json",
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
