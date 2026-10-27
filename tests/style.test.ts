import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");

/** The em dash and the en dash, built from their code points so this file holds neither. */
const DASHES = new RegExp(`[${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}]`);

const DOCS = ["README.md", "llms.txt", "CHANGELOG.md", "package.json", "server.json", "glama.json"];

/** Every file under a folder of the project, for the source and the tests. */
function files(dir: string): string[] {
  return readdirSync(new URL(dir, root)).flatMap((name) => {
    const path = join(dir, name);
    return statSync(new URL(path, root)).isDirectory() ? files(path) : [path];
  });
}

describe("the wording of the docs", () => {
  it("has no em dash or en dash in any doc, source or test", () => {
    for (const path of [...DOCS, ...files("src"), ...files("tests")]) {
      expect(read(path), path).not.toMatch(DASHES);
    }
  });

  it("does not use words that sell instead of tell", () => {
    for (const path of DOCS) {
      expect(read(path).toLowerCase(), path).not.toMatch(/seamless|robust|leverage|elevate/);
    }
  });

  it("names only apps that run a local MCP server as places to install it", () => {
    for (const path of DOCS) {
      expect(read(path), path).not.toMatch(/chatgpt|openai|codex/i);
    }
  });

  it("does not credit a tool or a model with the work", () => {
    for (const path of DOCS) {
      expect(read(path), path).not.toMatch(/co-authored-by|generated with|opencode|github actions/i);
    }
  });
});
