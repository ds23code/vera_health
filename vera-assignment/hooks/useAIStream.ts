// hooks/useAIStream.ts
import { useCallback, useRef, useState } from "react";
import { createSSEClient, SSEClient, SSEEvent } from "../sse/sseClient";
import { createTaggedStreamParser, Section } from "../utils/parseTaggedContent";

type SearchStep = { text: string; isActive?: boolean; isCompleted?: boolean; extraInfo?: string };
type SearchState = { steps: SearchStep[]; progress?: number };
type NodeChunkPayload = { type: "NodeChunk"; content: any };
type FlatPayload = { type: string; content: any };

export function useAIStream() {
  const [question, setQuestion] = useState("");
  const [sections, setSections] = useState<Section[]>([
    { id: "general", type: "general", title: "General", content: "" },
  ]);
  const [search, setSearch] = useState<SearchState>({ steps: [] });
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string[]>([]);

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

  const dlog = useCallback((msg: string) => {
    const stamp = new Date().toISOString().split("T")[1].replace("Z", "");
    setDebug((prev) => [...prev.slice(-150), `${stamp}  ${msg}`]);
    // eslint-disable-next-line no-console
    console.log("DEBUG", msg);
  }, []);

  const reset = useCallback(() => {
    sseRef.current?.close();
    sseRef.current = null;
    parserRef.current.reset();
    setSearch({ steps: [], progress: undefined });
    setError(null);
    setIsStreaming(false);
    dlog("reset()");
  }, [dlog]);

  const start = useCallback((q: string) => {
    // Fresh start
    sseRef.current?.close();
    parserRef.current.reset();
    setSearch({ steps: [], progress: undefined });
    setError(null);

    const prompt = q.trim();
    if (!prompt) return;

    setQuestion(prompt);
    setIsStreaming(true);
    dlog(`start() "${prompt}"`);

    const url = `https://vera-assignment-api.vercel.app/api/stream?prompt=${encodeURIComponent(prompt)}`;
    sseRef.current = createSSEClient(
      url,
      {
        onOpen: () => dlog("SSE open"),
        onMessage: (evt: SSEEvent) => {
          if (!evt.data) return;
          try {
            const raw: NodeChunkPayload | FlatPayload = JSON.parse(evt.data);

            // Normalize payload
            let nodeName: string | undefined;
            let content: any;
            if ((raw as NodeChunkPayload)?.type === "NodeChunk") {
              nodeName = (raw as NodeChunkPayload).content?.nodeName;
              content = (raw as NodeChunkPayload).content?.content;
            } else {
              nodeName = (raw as FlatPayload)?.type;
              content = (raw as FlatPayload)?.content;
            }

            switch (nodeName) {
              case "STREAM":
                if (typeof content === "string") {
                  parserRef.current.append(content);
                }
                break;

              case "SEARCH_STEPS":
                if (Array.isArray(content)) {
                  setSearch((prev) => ({
                    ...prev,
                    steps: content.map((s: any, i: number, arr: any[]) => ({
                      text: String(s.text ?? ""),
                      isActive: !!s.isActive,
                      isCompleted: !!s.isCompleted || (s.isActive === false && arr.findIndex(x => x.isActive) > i),
                      extraInfo: s.extraInfo ? String(s.extraInfo) : s.info ? String(s.info) : undefined,
                    })),
                  }));
                }
                break;

              case "SEARCH_PROGRESS":
                {
                  const p =
                    typeof content === "number"
                      ? content
                      : typeof content?.percent === "number"
                      ? content.percent
                      : undefined;
                  setSearch((prev) => ({ ...prev, progress: p }));
                }
                break;

              case "SEARCH_PROGRESS_INIT":
              case "FIGURES":
                // Optional: render elsewhere if desired
                break;

              default:
                // heartbeat or unknown node
                break;
            }

            dlog(`message: ${nodeName ?? "?"} (${typeof content})`);
          } catch (e: any) {
            dlog(`bad JSON chunk (ignored): ${String(e?.message ?? e)}`);
          }
        },
        onError: (err) => {
          dlog(`SSE error: ${String(err)}`);
          setError("Connection error. Please try again.");
          setIsStreaming(false);
        },
        onClose: () => {
          dlog("SSE close");
          setIsStreaming(false);
        },
        onDebug: dlog,
      },
      {}
    );
  }, [dlog]);

  const stop = useCallback(() => {
    dlog("stop()");
    sseRef.current?.close();
    setIsStreaming(false);
  }, [dlog]);

  return { question, setQuestion, sections, search, isStreaming, error, start, stop, reset, debug };
}