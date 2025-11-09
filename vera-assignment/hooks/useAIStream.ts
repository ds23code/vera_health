// hooks/useAIStream.ts
import { useCallback, useRef, useState } from "react";
import { createSSEClient, SSEClient, SSEEvent } from "../sse/sseClient";
import { createTaggedStreamParser, Section } from "../utils/parseTaggedContent";

type SearchStep = { text: string; isActive?: boolean; isCompleted?: boolean; extraInfo?: string };
type SearchState = { steps: SearchStep[]; progress?: number };
type NodeChunkPayload = { type: "NodeChunk"; content: any };

export function useAIStream() {
  const [question, setQuestion] = useState("");
  const [sections, setSections] = useState<Section[]>([{ id: "general", type: "general", title: "General", content: "" }]);
  const [search, setSearch] = useState<SearchState>({ steps: [] });
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sseRef = useRef<SSEClient | null>(null);
  const pendingFlushRef = useRef(false);
  const parserRef = useRef(
    createTaggedStreamParser((updated) => {
      if (!pendingFlushRef.current) {
        pendingFlushRef.current = true;
        requestAnimationFrame(() => {
          setSections(updated);
          pendingFlushRef.current = false;
        });
      }
    })
  );

  const reset = useCallback(() => {
    sseRef.current?.close();
    sseRef.current = null;
    parserRef.current.reset();
    setSearch({ steps: [], progress: undefined });
    setError(null);
    setIsStreaming(false);
  }, []);

  const start = useCallback((q: string) => {
    reset();
    const prompt = q.trim();
    if (!prompt) return;
    setQuestion(prompt);
    setIsStreaming(true);

    const url = `https://vera-assignment-api.vercel.app/api/stream?prompt=guideline-for-outpatient-cap-in-adults?`;
    sseRef.current = createSSEClient(
      url,
      {
        onOpen: () => {},
        onMessage: (evt: SSEEvent) => {
          if (!evt.data) return;
          try {
            const payload: NodeChunkPayload = JSON.parse(evt.data);
            if (payload?.type === "NodeChunk") {
              const nodeName = payload.content?.nodeName;
              const content = payload.content?.content;
              if (nodeName === "STREAM" && typeof content === "string") {
                parserRef.current.append(content);
              } else if (nodeName === "SEARCH_STEPS" && Array.isArray(content)) {
                setSearch((prev) => ({ ...prev, steps: normalizeSteps(content) }));
              } else if (nodeName === "SEARCH_PROGRESS") {
                const p = typeof content === "number" ? content : typeof content?.percent === "number" ? content.percent : undefined;
                setSearch((prev) => ({ ...prev, progress: p }));
              }
            }
          } catch {}
        },
        onError: () => {
          setError("Connection error. Please try again.");
          setIsStreaming(false);
        },
        onClose: () => setIsStreaming(false),
      },
      {}
    );
  }, [reset]);

  const stop = useCallback(() => {
    sseRef.current?.close();
    setIsStreaming(false);
  }, []);

  return { question, setQuestion, sections, search, isStreaming, error, start, stop, reset };
}

function normalizeSteps(raw: any[]): SearchStep[] {
  let activeIndex = raw.findIndex((s) => s.isActive);
  if (activeIndex < 0 && raw.length) activeIndex = raw.length - 1;
  return raw.map((s, i) => ({
    text: String(s.text ?? ""),
    isActive: i === activeIndex,
    isCompleted: i < activeIndex,
    extraInfo: s.extraInfo ? String(s.extraInfo) : undefined,
  }));
}