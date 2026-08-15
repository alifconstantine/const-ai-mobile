import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
} from "react-native";
import {
  Globe,
  FileText,
  PenTool,
  BookOpen,
  FileCode,
  Info,
  Layers,
} from "lucide-react-native";
import { useNavigation } from "../../context/NavigationContext";

interface PluginItem {
  id: string;
  name: string;
  badge: string;
  iconBg: string;
  icon: any;
}

interface FileItem {
  id: string;
  name: string;
  iconBg: string;
  icon: any;
}

const PLUGINS: PluginItem[] = [
  {
    id: "browser-use",
    name: "browser-use",
    badge: "zcode-plugins-official • 2 skills • 0 MCP",
    iconBg: "#3f3f46",
    icon: Globe,
  },
  {
    id: "document-skills",
    name: "document-skills",
    badge: "zcode-plugins-official • 3 skills • 0 MCP",
    iconBg: "#eab308",
    icon: FileText,
  },
  {
    id: "skill-creator",
    name: "skill-creator",
    badge: "zcode-plugins-official • 1 skills • 0 MCP",
    iconBg: "#f97316",
    icon: PenTool,
  },
  {
    id: "zcode-guide",
    name: "zcode-guide",
    badge: "zcode-plugins-official • 6 skills • 0 MCP",
    iconBg: "#27272a",
    icon: BookOpen,
  },
];

const FILES: FileItem[] = [
  {
    id: "jurnal-pdf",
    name: "Jurnal_Umum_Bengkel_Maju_Jaya_Januari_2024.pdf",
    iconBg: "#ef4444",
    icon: FileText,
  },
  {
    id: "server-js",
    name: "server.js",
    iconBg: "#eab308",
    icon: FileCode,
  },
  {
    id: "index-html",
    name: "index.html",
    iconBg: "#38bdf8",
    icon: Globe,
  },
];

export const MentionContextModal: React.FC = () => {
  const { isMentionOpen, setMentionOpen, insertTextToPrompt } = useNavigation();

  const handleSelectMention = (mentionName: string) => {
    insertTextToPrompt(`@${mentionName} `);
    setMentionOpen(false);
  };

  return (
    <Modal
      visible={isMentionOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setMentionOpen(false)}
    >
      <TouchableWithoutFeedback onPress={() => setMentionOpen(false)}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.cardContainer}>
              <ScrollView bounces={false} style={styles.scrollArea}>
                {/* PLUGINS Section */}
                <Text style={styles.sectionHeader}>PLUGINS</Text>
                {PLUGINS.map((plugin) => {
                  const Icon = plugin.icon;
                  return (
                    <TouchableOpacity
                      key={plugin.id}
                      style={styles.itemRow}
                      onPress={() => handleSelectMention(plugin.name)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.iconBadge,
                          { backgroundColor: plugin.iconBg },
                        ]}
                      >
                        <Icon size={12} color="#fafafa" />
                      </View>
                      <View style={styles.itemInfo}>
                        <Text style={styles.pluginName}>{plugin.name}</Text>
                        <Text style={styles.pluginBadge}>{plugin.badge}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {/* FILES Section */}
                <Text style={[styles.sectionHeader, { marginTop: 10 }]}>FILES</Text>
                {FILES.map((file) => {
                  const Icon = file.icon;
                  return (
                    <TouchableOpacity
                      key={file.id}
                      style={styles.itemRow}
                      onPress={() => handleSelectMention(file.name)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.iconBadge,
                          { backgroundColor: file.iconBg },
                        ]}
                      >
                        <Icon size={12} color="#fafafa" />
                      </View>
                      <View style={styles.itemInfo}>
                        <Text style={styles.fileName} numberOfLines={1}>
                          {file.name}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Footer Tip */}
              <View style={styles.footer}>
                <Info size={12} color="#71717a" style={{ marginRight: 6 }} />
                <Text style={styles.footerText}>
                  Type to search plugins, files, or conversations
                </Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 135,
    paddingHorizontal: 12,
  },
  cardContainer: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#161619",
    borderColor: "#27272e",
    borderWidth: 1,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 24,
    overflow: "hidden",
    maxHeight: 330,
  },
  scrollArea: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  sectionHeader: {
    color: "#71717a",
    fontSize: 10.5,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: 6,
    marginBottom: 4,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  iconBadge: {
    width: 20,
    height: 20,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  itemInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pluginName: {
    color: "#fafafa",
    fontSize: 12.5,
    fontWeight: "600",
  },
  pluginBadge: {
    color: "#71717a",
    fontSize: 11,
  },
  fileName: {
    color: "#e4e4e7",
    fontSize: 12,
    fontWeight: "400",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#222228",
    backgroundColor: "#121215",
  },
  footerText: {
    color: "#71717a",
    fontSize: 11,
  },
});
