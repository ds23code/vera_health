// components/SearchSteps.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type Step = {
  text: string;
  isActive?: boolean;
  isCompleted?: boolean;
  extraInfo?: string;
};

type Props = {
  steps: Step[];
  progress?: number;
  visible?: boolean;
};

export default function SearchSteps({ steps, progress, visible = true }: Props) {
  if (!visible || steps.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Search progress</Text>
        {typeof progress === "number" ? (
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        ) : null}
      </View>

      <View style={styles.steps}>
        {steps.map((s, idx) => {
          const iconName = s.isCompleted ? "checkmark-circle" : s.isActive ? "ellipse-outline" : "ellipse";
          const iconColor = s.isCompleted ? "#16a34a" : s.isActive ? "#2563eb" : "#94a3b8";
          return (
            <View key={`${idx}-${s.text}`} style={styles.stepRow}>
              <Ionicons name={iconName as any} size={18} color={iconColor} style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepText, s.isActive && styles.active]}>{s.text}</Text>
                {!!s.extraInfo && <Text style={styles.extra}>{s.extraInfo}</Text>}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    fontWeight: "600",
    color: "#0f172a",
  },
  progressText: {
    fontSize: 12,
    color: "#334155",
  },
  steps: {
    gap: 6,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  stepText: {
    color: "#0f172a",
  },
  active: {
    color: "#2563eb",
    fontWeight: "600",
  },
  extra: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
});