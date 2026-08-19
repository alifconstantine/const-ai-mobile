import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { ShieldAlert, ChevronRight } from "lucide-react-native";

interface Props {
  pendingCount: number;
  onPress?: () => void;
}

export const FloatingHitlBar: React.FC<Props> = ({ pendingCount, onPress }) => {
  if (pendingCount <= 0) return null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.leftRow}>
        <View style={styles.iconCircle}>
          <ShieldAlert size={14} color="#f59e0b" />
        </View>
        <Text style={styles.titleText}>
          {pendingCount} action{pendingCount > 1 ? "s" : ""} awaiting your approval
        </Text>
      </View>
      <View style={styles.rightRow}>
        <Text style={styles.actionPrompt}>Review</Text>
        <ChevronRight size={13} color="#f59e0b" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#20180a",
    borderWidth: 1,
    borderColor: "#f59e0b44",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#f59e0b22",
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    color: "#fbbf24",
    fontSize: 12,
    fontWeight: "600",
  },
  rightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  actionPrompt: {
    color: "#f59e0b",
    fontSize: 11,
    fontWeight: "700",
  },
});
