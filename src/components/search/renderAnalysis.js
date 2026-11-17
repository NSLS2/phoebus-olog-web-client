import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";

const md = new MarkdownIt();

// The analysis is LLM output written from log entry text, so anyone who can
// write a log entry can influence it. Only text formatting is allowed: no
// images (the browser would fetch them), no links and no attributes.
const SANITIZE_OPTIONS = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "del",
    "s",
    "ul",
    "ol",
    "li",
    "code",
    "pre",
    "blockquote",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "hr",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td"
  ],
  ALLOWED_ATTR: []
};

const CITATION = /#(\d+)/g;
const PART_OF_WORD = /[\p{L}\p{N}_&]$/u;
const WORD_BEFORE = /([\p{L}\p{N}_-]+)\s+$/u;

/**
 * The id of the entry that "#number" cites, or null if it is not a citation.
 * Citations are 1-based positions in the hits sent for analysis.
 */
const citedEntryId = (textBefore, number, hits, entryText) => {
  const id = hits[Number(number) - 1]?.metadata?.id;
  if (id === undefined || id === null) {
    return null;
  }
  if (PART_OF_WORD.test(textBefore)) {
    return null;
  }
  // "BPM #2" taken from an entry names a device, it does not cite entry 2
  const word = textBefore.match(WORD_BEFORE)?.[1];
  if (word && entryText.includes(`${word.toLowerCase()} #${number}`)) {
    return null;
  }
  return String(id);
};

const linkCitations = (textNode, hits, entryText) => {
  const doc = textNode.ownerDocument;
  const text = textNode.nodeValue;
  const parts = [];
  let end = 0;
  for (const match of text.matchAll(CITATION)) {
    const id = citedEntryId(
      text.slice(0, match.index),
      match[1],
      hits,
      entryText
    );
    if (id) {
      const link = doc.createElement("a");
      link.setAttribute("href", `#entry-${id}`);
      link.setAttribute("data-entry-id", id);
      link.textContent = match[0];
      parts.push(text.slice(end, match.index), link);
      end = match.index + match[0].length;
    }
  }
  if (parts.length > 0) {
    textNode.replaceWith(...parts, text.slice(end));
  }
};

/**
 * Renders the analysis markdown to safe HTML and turns its "#N" citations into
 * links that carry the cited entry's id in data-entry-id.
 */
export const renderAnalysis = (analysis, hits = []) => {
  const html = DOMPurify.sanitize(md.render(analysis ?? ""), SANITIZE_OPTIONS);
  const doc = new DOMParser().parseFromString(html, "text/html");
  const entryText = hits
    .map((hit) => `${hit?.metadata?.title ?? ""}\n${hit?.content ?? ""}`)
    .join("\n")
    .toLowerCase();

  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }
  textNodes
    .filter((node) => !node.parentElement?.closest("code, pre"))
    .forEach((node) => linkCitations(node, hits, entryText));

  return doc.body.innerHTML;
};
