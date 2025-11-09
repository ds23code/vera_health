// sse/sseClient.ts
export type SSEEvent = { event?: string; data?: string; id?: string };
export type SSEClient = { close: () => void };

type Handlers = {
  onOpen?: () => void;
  onMessage?: (evt: SSEEvent) => void;
  onError?: (err: any) => void;
  onClose?: () => void;
  onDebug?: (line: string) => void;
};

export function createSSEClient(
  url: string,
  handlers: Handlers,
  headers?: Record<string, string>
): SSEClient {
  const xhr = new XMLHttpRequest();
  let lastIndex = 0;
  let buffer = "";
  let closed = false;

  try {
    xhr.open("GET", url, true);
    xhr.responseType = "text";
    xhr.setRequestHeader("Accept", "text/event-stream");
    xhr.setRequestHeader("Cache-Control", "no-cache");
    if (headers) for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);

    xhr.onreadystatechange = () => {
      if (xhr.readyState === xhr.HEADERS_RECEIVED) {
        handlers.onDebug?.(`[SSE] headers received (status ${xhr.status})`);
        handlers.onOpen?.();
      }
      if (xhr.readyState === xhr.DONE && !closed) {
        handlers.onDebug?.("[SSE] DONE, flushing buffer");
        parseAndEmit();
        handlers.onClose?.();
      }
    };

    xhr.onprogress = () => {
      if (closed) return;
      const newText = xhr.responseText.slice(lastIndex);
      lastIndex = xhr.responseText.length;
      buffer += newText;
      handlers.onDebug?.(`[SSE] +${newText.length} bytes (total buffer ${buffer.length})`);
      parseAndEmit();
    };

    xhr.onerror = () => {
      if (!closed) {
        handlers.onDebug?.("[SSE] onerror");
        handlers.onError?.(new Error("SSE connection error"));
      }
    };

    xhr.send();
    handlers.onDebug?.("[SSE] open sent");
  } catch (e) {
    handlers.onError?.(e);
  }

  function findBoundary(buf: string): { idx: number; len: number } {
    // Handle \r\n\r\n (CRLF), \n\n (LF), or \r\r (CR)
    const rn = buf.indexOf("\r\n\r\n");
    const nn = buf.indexOf("\n\n");
    const rr = buf.indexOf("\r\r");
    let idx = -1;
    let len = 2;
    if (rn !== -1) { idx = rn; len = 4; }
    if (nn !== -1 && (idx === -1 || nn < idx)) { idx = nn; len = 2; }
    if (rr !== -1 && (idx === -1 || rr < idx)) { idx = rr; len = 2; }
    return { idx, len };
  }

  function parseAndEmit() {
    while (true) {
      const { idx, len } = findBoundary(buffer);
      if (idx === -1) break;
      const rawEvent = buffer.slice(0, idx);
      buffer = buffer.slice(idx + len);

      const evt: SSEEvent = {};
      const lines = rawEvent.split(/\r?\n/);
      const dataLines: string[] = [];

      for (const line of lines) {
        if (!line || line.startsWith(":")) continue; // comment/heartbeat
        if (line.startsWith("event:")) evt.event = line.slice(6).trim();
        else if (line.startsWith("data:")) dataLines.push(line.slice(5).replace(/^\s/, ""));
        else if (line.startsWith("id:")) evt.id = line.slice(3).trim();
      }
      if (dataLines.length) evt.data = dataLines.join("\n");

      handlers.onDebug?.(
        `[SSE] event → ${evt.event ?? "message"} | ${evt.data?.slice(0, 100) ?? ""}`
      );
      handlers.onMessage?.(evt);
    }
  }

  return {
    close: () => {
      if (closed) return;
      closed = true;
      try { xhr.abort(); } catch {}
      handlers.onDebug?.("[SSE] aborted");
      handlers.onClose?.();
    },
  };
}