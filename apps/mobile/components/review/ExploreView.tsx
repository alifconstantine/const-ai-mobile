import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
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
  RefreshCw,
  Package,
  Terminal,
  MessageSquare,
} from "lucide-react-native";
import { useNavigation } from "../../context/NavigationContext";
import { TermuxBridge } from "../../services/termux/TermuxBridge";

interface ExplorerNode {
  id: string;
  name: string;
  fullPath: string;
  isFolder: boolean;
  type?: "code" | "text" | "json" | "web";
  children?: ExplorerNode[];
}

const DEFAULT_PROJECT_TREE: ExplorerNode[] = [
  {
    id: "apps-folder",
    name: "apps",
    fullPath: "apps",
    isFolder: true,
    children: [
      {
        id: "mobile-folder",
        name: "mobile",
        fullPath: "apps/mobile",
        isFolder: true,
        children: [
          { id: "f-m-layout", name: "app/_layout.tsx", fullPath: "apps/mobile/app/_layout.tsx", isFolder: false, type: "code" },
          { id: "f-m-index", name: "app/index.tsx", fullPath: "apps/mobile/app/index.tsx", isFolder: false, type: "code" },
          { id: "f-m-nav", name: "context/NavigationContext.tsx", fullPath: "apps/mobile/context/NavigationContext.tsx", isFolder: false, type: "code" },
          { id: "f-m-package", name: "package.json", fullPath: "apps/mobile/package.json", isFolder: false, type: "json" },
        ],
      },
      {
        id: "web-folder",
        name: "web",
        fullPath: "apps/web",
        isFolder: true,
        children: [
          { id: "f-w-page", name: "app/page.tsx", fullPath: "apps/web/app/page.tsx", isFolder: false, type: "code" },
          { id: "f-w-dash", name: "app/dashboard/page.tsx", fullPath: "apps/web/app/dashboard/page.tsx", isFolder: false, type: "code" },
        ],
      },
    ],
  },
  {
    id: "packages-folder",
    name: "packages",
    fullPath: "packages",
    isFolder: true,
    children: [
      {
        id: "backend-folder",
        name: "backend",
        fullPath: "packages/backend",
        isFolder: true,
        children: [
          { id: "f-b-agent", name: "convex/agent.ts", fullPath: "packages/backend/convex/agent.ts", isFolder: false, type: "code" },
          { id: "f-b-users", name: "convex/users.ts", fullPath: "packages/backend/convex/users.ts", isFolder: false, type: "code" },
          { id: "f-b-schema", name: "convex/schema.ts", fullPath: "packages/backend/convex/schema.ts", isFolder: false, type: "code" },
        ],
      },
      {
        id: "types-folder",
        name: "types",
        fullPath: "packages/types",
        isFolder: true,
        children: [
          { id: "f-t-index", name: "src/index.ts", fullPath: "packages/types/src/index.ts", isFolder: false, type: "code" },
        ],
      },
    ],
  },
  {
    id: "f-arch",
    name: "ARCHITECTURE.md",
    fullPath: "ARCHITECTURE.md",
    isFolder: false,
    type: "text",
  },
  {
    id: "f-package",
    name: "package.json",
    fullPath: "package.json",
    isFolder: false,
    type: "json",
  },
];

function determineFileType(filename: string): "code" | "text" | "json" | "web" {
  if (filename.endsWith(".json")) return "json";
  if (filename.endsWith(".html") || filename.endsWith(".css")) return "web";
  if (filename.endsWith(".md") || filename.endsWith(".txt") || filename.endsWith(".log")) return "text";
  return "code";
}

export const ExploreView: React.FC = () => {
  const {
    openSideTab,
    activeWorkspaceType,
    activeWorkingDirectory,
    setWorkspaceModalOpen,
  } = useNavigation();

  const [isLoading, setIsLoading] = useState(false);
  const [fileTree, setFileTree] = useState<ExplorerNode[]>(DEFAULT_PROJECT_TREE);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    "apps-folder": true,
    "packages-folder": true,
  });

  const loadDirectoryFiles = useCallback(async () => {
    if (activeWorkspaceType === "standalone") return;
    setIsLoading(true);

    try {
      const result = await TermuxBridge.executeScript({
        script: "ls -pa",
        workingDir: activeWorkingDirectory || "/data/data/com.termux/files/home",
      });

      if (result && result.stdout) {
        const lines = result.stdout
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l && l !== "./" && l !== "../");

        if (lines.length > 0) {
          const parsedNodes: ExplorerNode[] = lines.map((line, idx) => {
            const isDir = line.endsWith("/");
            const cleanName = isDir ? line.slice(0, -1) : line;
            return {
              id: `node-${idx}-${cleanName}`,
              name: cleanName,
              fullPath: `${activeWorkingDirectory}/${cleanName}`,
              isFolder: isDir,
              type: isDir ? undefined : determineFileType(cleanName),
            };
          });

          parsedNodes.sort((a, b) => {
            if (a.isFolder === b.isFolder) {
              return a.name.localeCompare(b.name);
            }
            return a.isFolder ? -1 : 1;
          });

          setFileTree(parsedNodes);
        }
      }
    } catch (err) {
      console.warn("Failed to read Termux directory, falling back to default tree:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspaceType, activeWorkingDirectory]);

  useEffect(() => {
    loadDirectoryFiles();
  }, [loadDirectoryFiles]);

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenFile = async (node: ExplorerNode) => {
    setIsLoading(true);
    let fileContent = `// File: ${node.name}\n// Path: ${node.fullPath}\n// Loading content...\n`;
    try {
      const result = await TermuxBridge.executeScript({
        script: `head -n 500 "${node.fullPath}" 2>/dev/null || cat "${node.fullPath}"`,
        workingDir: activeWorkingDirectory || "/data/data/com.termux/files/home",
      });
      if (result && result.stdout) {
        fileContent = result.stdout;
      }
    } catch (err) {
      console.warn("Failed to read file content from Termux:", err);
      fileContent = `// Unable to read file content from Termux:\n// ${String(err)}`;
    } finally {
      setIsLoading(false);
    }

    openSideTab({
      id: `tab-file-${node.id}`,
      type: "File",
      title: node.name,
      filename: node.fullPath || node.name,
      content: fileContent,
      isClosable: true,
    });
  };

  if (activeWorkspaceType === "standalone") {
    return (
      <View style={styles.emptyContainer}>
        <MessageSquare size={32} color="#52525b" style={{ marginBottom: 12 }} />
        <Text style={styles.emptyTitle}>Mode Standalone Aktif</Text>
        <Text style={styles.emptySubtitle}>
          Sesi obrolan saat ini tidak terikat ke folder lokal perangkat. Anda dapat membuka folder proyek Termux kapan saja.
        </Text>
        <TouchableOpacity
          style={styles.btnOpenFolder}
          onPress={() => setWorkspaceModalOpen(true)}
          activeOpacity={0.8}
        >
          <FolderOpen size={14} color="#09090b" />
          <Text style={styles.btnOpenFolderText}>Buka Folder Proyek</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderNode = (node: ExplorerNode, depth = 0) => {
    const isExpanded = expandedFolders[node.id] ?? false;

    if (node.isFolder) {
      return (
        <View key={node.id}>
          <TouchableOpacity
            style={[styles.folderRow, { paddingLeft: 12 + depth * 14 }]}
            onPress={() => toggleFolder(node.id)}
            activeOpacity={0.7}
          >
            {isExpanded ? (
              <ChevronDown size={12} color="#71717a" style={{ marginRight: 4 }} />
            ) : (
              <ChevronRight size={12} color="#71717a" style={{ marginRight: 4 }} />
            )}
            <Folder size={14} color="#38bdf8" style={{ marginRight: 6 }} />
            <Text style={styles.folderText}>{node.name}</Text>
          </TouchableOpacity>
          {isExpanded &&
            node.children?.map((child) => renderNode(child, depth + 1))}
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
        ? "#eab308"
        : node.type === "json"
        ? "#ec4899"
        : node.type === "text"
        ? "#a1a1aa"
        : "#38bdf8";

    return (
      <TouchableOpacity
        key={node.id}
        style={[styles.fileRow, { paddingLeft: 28 + depth * 14 }]}
        onPress={() => handleOpenFile(node)}
        activeOpacity={0.7}
      >
        <Icon size={13} color={iconColor} style={{ marginRight: 6 }} />
        <Text style={styles.fileText} numberOfLines={1}>
          {node.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const displayDir = (activeWorkingDirectory || "~/projects").replace(
    "/data/data/com.termux/files/home",
    "~"
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <View style={styles.dirInfo}>
          <Terminal size={12} color="#38bdf8" style={{ marginRight: 4 }} />
          <Text style={styles.dirText} numberOfLines={1}>
            {displayDir}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={loadDirectoryFiles}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#38bdf8" />
          ) : (
            <RefreshCw size={12} color="#a1a1aa" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollArea} bounces={false}>
        {fileTree.map((node) => renderNode(node, 0))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111114",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e24",
    backgroundColor: "#16161b",
  },
  dirInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  dirText: {
    color: "#38bdf8",
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontWeight: "500",
  },
  refreshBtn: {
    padding: 4,
    borderRadius: 4,
  },
  scrollArea: {
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
    color: "#e4e4e7",
    fontSize: 12,
    fontWeight: "500",
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4.5,
    paddingRight: 12,
  },
  fileText: {
    color: "#a1a1aa",
    fontSize: 11.5,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: "#111114",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: "#fafafa",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  emptySubtitle: {
    color: "#71717a",
    fontSize: 11.5,
    textAlign: "center",
    lineHeight: 17,
    marginBottom: 16,
  },
  btnOpenFolder: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#38bdf8",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnOpenFolderText: {
    color: "#09090b",
    fontSize: 12,
    fontWeight: "700",
  },
});
