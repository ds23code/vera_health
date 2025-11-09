// components/MarkdownView.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import Markdown, { MarkdownIt } from "react-native-markdown-display";

const md = MarkdownIt({ linkify: true, typographer: true });

export default function MarkdownView({ children }: { children: string }) {
  return (
    <View style={styles.container}>
      <Markdown markdownit={md} style={markdownStyles}>{children || ""}</Markdown>
    </View>
  );
}

const styles = StyleSheet.create({ container: { width: "100%" } });

const markdownStyles = {
  body: { color: "#0f172a", fontSize: 16, lineHeight: 23 },
  heading1: { fontSize: 24, marginTop: 12, marginBottom: 8, fontWeight: "800" as const },
  heading2: { fontSize: 21, marginTop: 10, marginBottom: 6, fontWeight: "700" as const },
  heading3: { fontSize: 18, marginTop: 8, marginBottom: 6, fontWeight: "700" as const },
  paragraph: { marginTop: 6, marginBottom: 10 },
  bullet_list: { marginVertical: 6 },
  ordered_list: { marginVertical: 6 },
  list_item: { marginVertical: 4 },
  code_inline: { backgroundColor: "#f1f5f9", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  fence: { backgroundColor: "#0b1220", color: "#e2e8f0", padding: 10, borderRadius: 8, fontFamily: "Courier" },
  link: { color: "#2563eb" },
};