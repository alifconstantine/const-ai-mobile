import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { useNavigation } from "../../context/NavigationContext";

export const ContextWindowModal: React.FC = () => {
  const { isContextMeterOpen, setContextMeterOpen } = useNavigation();

  return (
    <Modal
      visible={isContextMeterOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setContextMeterOpen(false)}
    >
      <TouchableWithoutFeedback onPress={() => setContextMeterOpen(false)}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.meterCard}>
              {/* Header Row */}
              <View style={styles.row}>
                <Text style={styles.title}>Context windows</Text>
                <Text style={styles.value}>218.6K/1M (21.9%)</Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: "21.9%" }]} />
              </View>

              {/* Cache Hit Row */}
              <View style={styles.row}>
                <Text style={styles.subTitle}>Average cache hit rate</Text>
                <Text style={styles.subValue}>91.3%</Text>
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
    alignItems: "flex-end",
    paddingBottom: 135,
    paddingRight: 14,
  },
  meterCard: {
    width: 270,
    backgroundColor: "#18181b",
    borderColor: "#27272a",
    borderWidth: 1,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 20,
    padding: 12,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "#fafafa",
    fontSize: 12,
    fontWeight: "600",
  },
  value: {
    color: "#a1a1aa",
    fontSize: 11,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "#27272a",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#fafafa",
    borderRadius: 3,
  },
  subTitle: {
    color: "#71717a",
    fontSize: 11,
  },
  subValue: {
    color: "#fafafa",
    fontSize: 11,
    fontWeight: "600",
  },
});
