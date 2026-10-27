import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const readJson = (path: string) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"));

const PHRASE = "open textbook finder mcp";

// The search terms people type when they look for a free textbook. Each one has to
// sit in the keyword list, so the package shows up for them.
const SEARCH_TERMS = ["openstax", "open library", "doab", "isbn lookup", "free textbooks", "open educational resources"];

describe("package identity", () => {
  it("uses the name, version, bin and registry name of this server", () => {
    const pkg = readJson("package.json");
    expect(pkg.name).toBe("open-textbook-finder-mcp");
    expect(pkg.version).toBe("0.1.0");
    expect(Object.keys(pkg.bin)).toEqual(["open-textbook-finder-mcp"]);
    expect(pkg.bin["open-textbook-finder-mcp"]).toBe("build/src/index.js");
    expect(pkg.mcpName).toBe("io.github.AnonymousOnyx22/open-textbook-finder-mcp");
    expect(pkg.author).toBe("AnonymousOnyx22");
  });

  it("gives server.json and glama.json the same identity", () => {
    const server = readJson("server.json");
    expect(server.name).toBe("io.github.AnonymousOnyx22/open-textbook-finder-mcp");
    expect(server.packages[0].identifier).toBe("open-textbook-finder-mcp");
    expect(readJson("glama.json").name).toBe("open-textbook-finder-mcp");
    expect(readJson("glama.json").version).toBe("0.1.0");
  });

  it("needs no key: the package has no environment variables in server.json", () => {
    const server = readJson("server.json");
    expect(server.packages[0].environmentVariables).toBeUndefined();
  });
});

describe("npm search metadata", () => {
  it("leads the description and keywords with the phrase open textbook finder mcp", () => {
    const pkg = readJson("package.json");
    expect(pkg.description.toLowerCase()).toContain(PHRASE);
    expect(pkg.keywords[0].toLowerCase()).toBe(PHRASE);
  });

  it("has at least ten keywords and no repeats", () => {
    const keywords = readJson("package.json").keywords as string[];
    expect(keywords.length).toBeGreaterThanOrEqual(10);
    expect(new Set(keywords).size).toBe(keywords.length);
  });

  it("keeps the search terms in the keywords", () => {
    const keywords = readJson("package.json").keywords.map((k: string) => k.toLowerCase());
    for (const term of SEARCH_TERMS) {
      expect(keywords, `a keyword for ${term}`).toContain(term);
    }
  });

  it("keeps the server.json description under the registry limit and on phrase", () => {
    const server = readJson("server.json");
    expect(server.description.length).toBeLessThanOrEqual(100);
    expect(server.description.toLowerCase()).toContain(PHRASE);
  });

  it("keeps glama.json and llms.txt on phrase", () => {
    expect(readJson("glama.json").description.toLowerCase()).toContain(PHRASE);
    const llms = readFileSync(new URL("../llms.txt", import.meta.url), "utf8").toLowerCase();
    expect(llms).toContain(PHRASE);
  });
});
