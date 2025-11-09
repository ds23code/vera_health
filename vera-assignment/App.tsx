// App.tsx
import React, { useMemo } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import Collapsible from "./components/Collapsible";
import MarkdownView from "./components/MarkdownView";
import SearchSteps from "./components/SearchSteps";
import { useAIStream } from "./hooks/useAIStream";

export default function App() {
  const { question, setQuestion, sections, search, isStreaming, error, start, stop, reset } = useAIStream();
  const canAsk = useMemo(() => question.trim().length > 0 && !isStreaming, [question, isStreaming]);

  const onSubmit = () => {
    const q = question.trim();
    if (!q) return;
    start(q);
  };

  return (
    <LinearGradient colors={["#f8fbff", "#eef2f7"]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.headerWrap}>
            <Text style={styles.title}>Clinical Q&A</Text>
            <Text style={styles.subtitle}>Streaming answers with structured sections</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Your question</Text>
            <TextInput
              placeholder="Type a precise clinical question…"
              placeholderTextColor="#94a3b8"
              value={question}
              onChangeText={setQuestion}
              editable={!isStreaming}
              style={styles.input}
              multiline
            />
            <View style={styles.actions}>
              {!isStreaming ? (
                <Pressable
                  style={[styles.button, canAsk ? styles.buttonPrimary : styles.buttonDisabled]}
                  onPress={onSubmit}
                  disabled={!canAsk}
                >
                  <Text style={styles.buttonText}>Ask</Text>
                </Pressable>
              ) : (
                <Pressable style={[styles.button, styles.buttonDanger]} onPress={stop}>
                  <Text style={styles.buttonText}>Stop</Text>
                </Pressable>
              )}
              <Pressable style={[styles.button, styles.buttonGhost]} onPress={reset} disabled={isStreaming}>
                <Text style={[styles.buttonGhostText]}>Clear</Text>
              </Pressable>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
            <SearchSteps steps={search.steps} progress={search.progress} visible={search.steps.length > 0} />

            {question.trim() ? (
              <Collapsible
                title="Answer"
                defaultOpen
                rightAccessory={isStreaming ? <ActivityIndicator size="small" color="#2563eb" /> : null}
              >
                {sections.map((section) => (
                  <Collapsible key={section.id} title={section.title} defaultOpen>
                    <MarkdownView>{section.content}</MarkdownView>
                  </Collapsible>
                ))}
              </Collapsible>
            ) : (
              <View style={styles.hint}>
                <Text style={styles.hintText}>
                  Ask a clinical question to start streaming an AI response.
                </Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  headerWrap: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  title: { fontSize: 28, fontWeight: "800", color: "#0f172a" },
  subtitle: { fontSize: 14, color: "#475569", marginTop: 4 },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.06)",
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  label: { fontSize: 12, fontWeight: "700", color: "#64748b", marginBottom: 8, letterSpacing: 0.3 },
  input: {
    minHeight: 64,
    maxHeight: 140,
    color: "#0f172a",
    fontSize: 16,
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  actions: { flexDirection: "row", gap: 10, marginTop: 12 },
  button: { paddingVertical: 11, paddingHorizontal: 18, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  buttonPrimary: { backgroundColor: "#2563eb" },
  buttonDisabled: { backgroundColor: "#93c5fd" },
  buttonDanger: { backgroundColor: "#ef4444" },
  buttonGhost: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#cbd5e1" },
  buttonText: { color: "#ffffff", fontWeight: "700" },
  buttonGhostText: { color: "#334155", fontWeight: "700" },
  error: { color: "#dc2626", marginTop: 8 },
  hint: { alignItems: "center", paddingVertical: 24 },
  hintText: { color: "#64748b", textAlign: "center" },
});