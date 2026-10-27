import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { tools } from "../src/tools.js";
import { fakeApi } from "./fakes.js";

const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");

/** The README from one heading down to the next heading of the same level. */
function section(heading: string): string {
  const start = readme.indexOf(heading);
  if (start === -1) throw new Error(`README.md has no ${heading} section`);
  const end = readme.indexOf("\n## ", start + heading.length);
  return readme.slice(start, end === -1 ? readme.length : end);
}

/** The rows of a markdown table, without the separator line. */
function tableRows(markdown: string): string[][] {
  return markdown
    .split("\n")
    .filter((line) => line.trim().startsWith("|"))
    .map((line) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim()))
    .filter((cells) => !cells.every((cell) => /^-+$/.test(cell)));
}

/** The names in backticks inside a piece of text. */
function backticked(text: string): string[] {
  return [...text.matchAll(/`([^`]+)`/g)].map((match) => match[1]);
}

/** A number in words, so a count in the README can be read against a count in the code. */
const COUNT_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];

function countWord(count: number): string {
  return COUNT_WORDS[count] ?? String(count);
}

/** The rows of the tool table, with the tool name, its parameters and what it does. */
function toolRows(): { name: string; parameters: string; body: string }[] {
  return tableRows(section("## Tools"))
    .filter((cells) => cells[0] !== "Tool")
    .map((cells) => ({ name: cells[0].replace(/`/g, ""), parameters: cells[1] ?? "", body: cells[2] ?? "" }));
}

/** The example prompt a tool description ends with. */
function examplePrompt(description: string): string | undefined {
  return /Example prompt: "([^"]+)"/.exec(description)?.[1];
}

/** The tool that carries an example prompt. */
function toolFor(prompt: string) {
  return tools.find((tool) => examplePrompt(tool.description) === prompt);
}

interface Featured {
  title: string;
  prompt: string;
  body: string;
}

/** The example prompts the README puts in the foreground, with the text that explains them. */
function featuredPrompts(): Featured[] {
  const text = section("## Try these three prompts");
  const end = text.indexOf("More things you can ask");
  const items: Featured[] = [];
  let current: Featured | undefined;
  for (const line of (end === -1 ? text : text.slice(0, end)).split("\n")) {
    const trimmed = line.trim();
    const title = /^(\d+)\.\s+(.*)$/.exec(trimmed);
    if (title) {
      current = { title: title[2], prompt: "", body: "" };
      items.push(current);
      continue;
    }
    const quote = /^>\s*"(.*)"$/.exec(trimmed);
    if (quote && current) {
      current.prompt = quote[1];
      continue;
    }
    if (current) current.body += `${trimmed}\n`;
  }
  return items;
}

/** The README item that shows the example prompt of a tool. */
function featuredFor(name: string): Featured {
  const item = featuredPrompts().find((entry) => toolFor(entry.prompt)?.name === name);
  if (!item) throw new Error(`the README has no example prompt for ${name}`);
  return item;
}

/** The text and fields a tool returns for some arguments, on the fake network. */
async function runTool(name: string, args: Record<string, unknown>) {
  const tool = tools.find((t) => t.name === name);
  if (!tool) throw new Error(`there is no tool called ${name}`);
  return tool.run(args, fakeApi());
}

describe("the tool table in the README", () => {
  it("lists every tool from src/tools.ts, once and in the same order", () => {
    expect(toolRows().map((row) => row.name)).toEqual(tools.map((tool) => tool.name));
  });

  it("names the parameters of every tool in the order the tool has them", () => {
    for (const tool of tools) {
      const row = toolRows().find((entry) => entry.name === tool.name);
      expect(row, `the README row for ${tool.name}`).toBeTruthy();
      expect(backticked(row!.parameters), `the parameters of ${tool.name} in the README`).toEqual(Object.keys(tool.inputSchema));
    }
  });

  it("says how many tools there are", () => {
    expect(section("## Tools")).toMatch(new RegExp(`\\b${countWord(tools.length)} tools\\b`, "i"));
  });
});

describe("the example prompts in the README", () => {
  it("gives every tool an example prompt to end with", () => {
    for (const tool of tools) {
      const prompt = examplePrompt(tool.description);
      expect(prompt, `the example prompt of ${tool.name}`).toBeTruthy();
      expect(tool.description.endsWith(`"${prompt}"`), `the example prompt at the end of ${tool.name}`).toBe(true);
    }
  });

  it("uses three of the example prompts the tools carry", () => {
    const items = featuredPrompts();
    expect(items.length, "the number of example prompts in the README").toBe(3);
    for (const item of items) {
      expect(toolFor(item.prompt), `a tool that carries the prompt "${item.prompt}"`).toBeTruthy();
    }
  });

  it("gives each prompt to the tool that carries it", () => {
    const items = featuredPrompts();
    const owners = items.map((item) => toolFor(item.prompt));
    expect(new Set(owners.map((tool) => tool!.name)).size, "the number of tools the prompts belong to").toBe(3);
    for (const item of items) {
      const owner = toolFor(item.prompt)!;
      expect(item.body, `the text under "${item.title}"`).toContain(`\`${owner.name}\``);
    }
  });

  it("says how many prompts there are in the heading", () => {
    expect(section("## Try these three prompts")).toMatch(new RegExp(`\\b${countWord(3)} prompts\\b`, "i"));
  });
});

describe("what the README promises the tools do", () => {
  it("puts OpenStax Calculus Volume 1 first for the Calculus prompt", async () => {
    const out = await runTool("find_free_textbook", { query: "calculus" });
    expect((out.structured.results as any[])[0].title).toBe("Calculus Volume 1");
    expect(featuredFor("find_free_textbook").body).toContain("Calculus Volume 1");
  });

  it("lists related editions newest first for the ISBN prompt", async () => {
    const out = await runTool("lookup_isbn", { isbn: "978-0-13-468599-1" });
    const years = (out.structured.related_editions as any[]).map((e) => e.year ?? 0);
    expect(years).toEqual([...years].sort((a, b) => b - a));
    expect(featuredFor("lookup_isbn").body).toContain("newest first");
  });

  it("lists the older editions closest first for the older edition prompt", async () => {
    const out = await runTool("find_older_edition", { query: "Stewart Calculus" });
    const years = (out.structured.suggestions as any[]).map((e) => e.year);
    expect(years).toEqual([...years].sort((a, b) => b - a));
    expect(featuredFor("find_older_edition").body).toContain("closest first");
    expect(featuredFor("find_older_edition").body).toContain("`edition_year`");
  });

  it("tests the check digit before a search, as the FAQ says", async () => {
    await expect(runTool("lookup_isbn", { isbn: "9780134685992" })).rejects.toThrow(/not a valid ISBN/);
    expect(section("## FAQ")).toContain("check digit is tested first");
  });

  it("does not know prices, as the FAQ says", async () => {
    const out = await runTool("find_older_edition", { query: "Stewart Calculus" });
    expect(out.text).toContain("Prices are not shown");
    expect(section("## FAQ")).toContain("does not know prices");
  });

  it("names the source that is down, as the FAQ says", async () => {
    const down = fakeApi({ doabDown: 500 });
    const tool = tools.find((t) => t.name === "find_free_textbook")!;
    const out = await tool.run({ query: "calculus", limit: 5 }, down);
    expect(out.text).toContain("did not answer: DOAB");
    expect(section("## FAQ")).toContain("names the source that did not");
  });
});

describe("the source table in the README", () => {
  it("names OpenStax, DOAB and Open Library", () => {
    const names = tableRows(section("## Where the books come from"))
      .filter((cells) => cells[0] !== "Source")
      .map((cells) => cells[0]);
    expect(names).toEqual(["OpenStax", "DOAB", "Open Library"]);
  });

  it("describes the three access values the tools use", () => {
    const text = section("## Where the books come from");
    for (const value of ["free", "borrow", "none"]) expect(text).toContain(`\`${value}\``);
  });
});

describe("the privacy section", () => {
  it("names the two services the server talks to and says there is no key", () => {
    const text = section("## Privacy");
    expect(text).toContain("openlibrary.org");
    expect(text).toContain("directory.doabooks.org");
    expect(text).toMatch(/no key/i);
  });
});
