import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import {
  Hand,
  ShieldAlert,
  ClipboardList,
  Bot,
  Check,
} from "lucide-react-native";
import { OperatingMode } from "@const-ai/types";
import { useNavigation } from "../../context/NavigationContext";

interface ModeOption {
  id: OperatingMode;
  name: string;
  desc: string;
  icon: any;
  color: string;
}

const MODES: ModeOption[] = [
  {
    id: "normal_mode",
    name: "Normal Mode (Default)",
    desc: "Obrolan & analisis kode murni tanpa akses terminal.",
    icon: Bot,
    color: "#22c55e",
  },
  {
    id: "ask_before_change",
    name: "Ask Before Changes",
    desc: "Akses terminal & tools aktif dengan konfirmasi HITL.",
    icon: Hand,
    color: "#f59e0b",
  },
  {
    id: "plan_mode",
    name: "Plan Mode",
    desc: "Membuat rencana kerja dulu, akses terminal dengan izin.",
    icon: ClipboardList,
    color: "#38bdf8",
  },
  {
    id: "full_access_yolo",
    name: "Full Access (YOLO)",
    desc: "Eksekusi terminal & sistem otomatis tanpa dialog.",
    icon: ShieldAlert,
    color: "#ef4444",
  },
];

export const OperatingModeModal: React.FC = () => {
  const {
    isOperatingModeModalOpen,
    setOperatingModeModalOpen,
    activeOperatingMode,
    setActiveOperatingMode,
  } = useNavigation();

  const handleSelect = (modeId: OperatingMode) => {
    setActiveOperatingMode(modeId);
    setOperatingModeModalOpen(false);
  };

  return (
    <Modal
      visible={isOperatingModeModalOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setOperatingModeModalOpen(false)}
    >
      <TouchableWithoutFeedback onPress={() => setOperatingModeModalOpen(false)}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.popoverCard}>
              {MODES.map((mode) => {
                const Icon = mode.icon;
                const isSelected = activeOperatingMode === mode.id;

                return (
                  <TouchableOpacity
                    key={mode.id}
                    style={[
                      styles.modeRow,
                      isSelected && styles.modeRowActive,
                    ]}
                    onPress={() => handleSelect(mode.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.modeIconContainer}>
                      <Icon
                        size={16}
                        color={isSelected ? mode.color : "#a1a1aa"}
                      />
                    </View>

                    <View style={styles.modeTextContainer}>
                      <Text
                        style={[
                          styles.modeTitle,
                          isSelected && styles.modeTitleActive,
                        ]}
                      >
                        {mode.name}
                      </Text>
                      <Text style={styles.modeDesc}>{mode.desc}</Text>
                    </View>

                    {isSelected && (
                      <View style={styles.checkContainer}>
                        <Check size={14} color="#e4e4e7" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
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
    alignItems: "flex-start",
    paddingBottom: 135,
    paddingLeft: 12,
  },
  popoverCard: {
    width: 255,
    backgroundColor: "#1b1b1e",
    borderColor: "#2a2a32",
    borderWidth: 1,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 22,
    paddingVertical: 5,
    overflow: "hidden",
  },
  modeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  modeRowActive: {
    backgroundColor: "#26262d",
  },
  modeIconContainer: {
    width: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  modeTextContainer: {
    flex: 1,
  },
  modeTitle: {
    color: "#d4d4d8",
    fontSize: 13,
    fontWeight: "500",
  },
  modeTitleActive: {
    color: "#fafafa",
    fontWeight: "600",
  },
  modeDesc: {
    color: "#71717a",
    fontSize: 11,
    marginTop: 1,
  },
  checkContainer: {
    marginLeft: 4,
  },
});
