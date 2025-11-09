// components/Collapsible.tsx
import React, { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, LayoutAnimation, Platform, UIManager } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = { title: string; children: React.ReactNode; defaultOpen?: boolean; rightAccessory?: React.ReactNode };

export default function Collapsible({ title, children, defaultOpen = true, rightAccessory }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const icon = useMemo(() => (open ? "chevron-up" : "chevron-down"), [open]);

  const toggle = () => {
    Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };

  return (
    <View style={styles.card}>
      <Pressable style={styles.header} onPress={toggle} android_ripple={{ color: "#e9edf5" }}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.headerRight}>
          {rightAccessory}
          <Ionicons name={icon as any} size={18} color="#334155" style={{ marginLeft: 6 }} />
        </View>
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.06)",
    marginBottom: 14,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#f8fafc",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 17, fontWeight: "700", color: "#0f172a" },
  headerRight: { flexDirection: "row", alignItems: "center" },
  body: { paddingHorizontal: 16, paddingVertical: 12 },
});