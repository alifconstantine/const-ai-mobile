import { StyleSheet, Text, View, TouchableOpacity } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.badge}>Standalone Edition</Text>
      <Text style={styles.title}>Const AI Mobile</Text>
      <Text style={styles.subtitle}>
        Personal Assistant + Neural Voice + Autonomous Developer Agent
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>On-Device Neural Voice Engine</Text>
        <Text style={styles.cardDesc}>
          Zero latency neural voice engine running locally via ONNX Runtime.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Termux & HITL Controls</Text>
        <Text style={styles.cardDesc}>
          Integrated shell terminal with Human-In-The-Loop approval modes.
        </Text>
      </View>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Start Conversation</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#09090b",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  badge: {
    color: "#a1a1aa",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fafafa",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#a1a1aa",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#18181b",
    borderColor: "#27272a",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    width: "100%",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fafafa",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: "#71717a",
    lineHeight: 18,
  },
  button: {
    backgroundColor: "#fafafa",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: "100%",
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: {
    color: "#09090b",
    fontWeight: "bold",
    fontSize: 15,
  },
});
