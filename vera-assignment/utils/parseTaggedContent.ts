// utils/parseTaggedContent.ts
export type Section = {
  id: string;
  type: "general" | "tag";
  title: string;
  tagName?: string;
  content: string;
};

export type TaggedStreamParser = {
  append: (chunk: string) => void;
  getSections: () => Section[];
  reset: () => void;
};

const FriendlyTitles: Record<string, string> = {
  guideline: "Guideline",
  drug: "Drug",
  think: "Thinking",
};

const titleize = (t: string) =>
  FriendlyTitles[t] ?? t.charAt(0).toUpperCase() + t.slice(1);

export function createTaggedStreamParser(onUpdate: (s: Section[]) => void): TaggedStreamParser {
  let sections: Section[] = [{ id: "general", type: "general", title: "General", content: "" }];
  let buffer = "";
  let currentTag: string | null = null;
  let currentId: string | null = null;

  const update = () => onUpdate([...sections]);
  const ensureGeneral = () => {
    if (!sections.find(s => s.id === "general")) {
      sections.unshift({ id: "general", type: "general", title: "General", content: "" });
    }
  };

  const startTag = (name: string) => {
    currentTag = name;
    currentId = `tag-${sections.filter(s => s.type === "tag").length + 1}-${name}`;
    sections.push({ id: currentId, type: "tag", tagName: name, title: titleize(name), content: "" });
  };

  const endTag = () => { currentTag = null; currentId = null; };

  const appendGeneral = (t: string) => {
    ensureGeneral();
    const g = sections.find(s => s.id === "general")!;
    g.content += t;
  };

  const appendTag = (t: string) => {
    if (!currentId) return;
    const s = sections.find(s => s.id === currentId);
    if (s) s.content += t;
  };

  const process = () => {
    let i = 0;
    while (i < buffer.length) {
      if (!currentTag) {
        const lt = buffer.indexOf("<", i);
        if (lt === -1) { appendGeneral(buffer.slice(i)); buffer = ""; update(); return; }
        if (lt > i) appendGeneral(buffer.slice(i, lt));
        const gt = buffer.indexOf(">", lt + 1);
        if (gt === -1) { buffer = buffer.slice(lt); update(); return; }
        const inside = buffer.slice(lt + 1, gt).trim();
        const open = inside.match(/^([a-zA-Z0-9_]+)$/);
        const close = inside.match(/^\/([a-zA-Z0-9_]+)$/);
        if (open && !close) { startTag(open[1].toLowerCase()); i = gt + 1; }
        else { appendGeneral(buffer.slice(lt, gt + 1)); i = gt + 1; }
      } else {
        const closing = `</${currentTag}>`;
        const cidx = buffer.indexOf(closing, i);
        if (cidx === -1) { appendTag(buffer.slice(i)); buffer = ""; update(); return; }
        if (cidx > i) appendTag(buffer.slice(i, cidx));
        i = cidx + closing.length;
        endTag();
      }
    }
    buffer = ""; update();
  };

  return {
    append: (chunk: string) => { if (!chunk) return; buffer += chunk; process(); },
    getSections: () => sections,
    reset: () => {
      sections = [{ id: "general", type: "general", title: "General", content: "" }];
      buffer = ""; currentTag = null; currentId = null; update();
    },
  };
}