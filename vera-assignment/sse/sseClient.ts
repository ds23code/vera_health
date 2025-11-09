// sse/sseClient.ts
export type SSEEvent = { event?: string; data?: string; id?: string };
export type SSEClient = { close: () => void };
type Handlers = {
  onOpen?: () => void;
  onMessage?: (evt: SSEEvent) => void;
  onError?: (err: any) => void;
  onClose?: () => void;
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
    xhr.setRequestHeader("Accept", "text/event-stream");
    xhr.setRequestHeader("Cache-Control", "no-cache");
    if (headers) for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);

    xhr.onreadystatechange = () => {
      if (xhr.readyState === xhr.HEADERS_RECEIVED) handlers.onOpen?.();
      if (xhr.readyState === xhr.DONE && !closed) {
        parseAndEmit();
        handlers.onClose?.();
      }
    };

    xhr.onprogress = () => {
      if (closed) return;
      const newText = xhr.responseText.slice(lastIndex);
      lastIndex = xhr.responseText.length;
      buffer += newText;
      parseAndEmit();
    };
    xhr.onerror = () => !closed && handlers.onError?.(new Error("SSE connection error"));
    xhr.send();
  } catch (e) {
    handlers.onError?.(e);
  }

  function parseAndEmit() {
    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const raw = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const evt: SSEEvent = {};
      const lines = raw.split(/\r?\n/);
      const dataLines: string[] = [];
      for (const line of lines) {
        if (!line || line.startsWith(":")) continue;
        if (line.startsWith("event:")) evt.event = line.slice(6).trim();
        else if (line.startsWith("data:")) dataLines.push(line.slice(5).replace(/^\s/, ""));
        else if (line.startsWith("id:")) evt.id = line.slice(3).trim();
      }
      if (dataLines.length) evt.data = dataLines.join("\n");
      handlers.onMessage?.(evt);
      boundary = buffer.indexOf("\n\n");
    }
  }

  return {
    close: () => {
      if (closed) return;
      closed = true;
      try { xhr.abort(); } catch {}
      handlers.onClose?.();
    },
  };
}