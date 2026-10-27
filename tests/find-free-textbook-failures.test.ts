import { describe, it, expect } from "vitest";
import { tools } from "../src/tools.js";
import { createApi } from "../src/sources.js";
import { fakeApi, fakeFetch, standardHandler, type Options } from "./fakes.js";

const tool = tools.find((t) => t.name === "find_free_textbook")!;

async function find(query: string, options: Options = {}) {
  const out = await tool.run({ query, limit: 5 }, fakeApi(options));
  return { text: out.text, s: out.structured as any };
}

describe("find_free_textbook when a source fails", () => {
  it("names Open Library when only Open Library is down and keeps DOAB and OpenStax", async () => {
    const { s, text } = await find("calculus", { openLibraryDown: 503 });
    expect(s.sources_unavailable).toEqual(["Open Library"]);
    expect(s.results.map((r: any) => r.source)).toEqual(["OpenStax", "OpenStax", "OpenStax", "DOAB"]);
    expect(text).toContain("These sources did not answer: Open Library.");
    expect(text).toContain("Found 4 free copies");
  });

  it("treats a dropped connection like a failed service", async () => {
    const handler = standardHandler();
    const flaky = fakeFetch(handler);
    const fetchImpl = (async (input: RequestInfo | URL) => {
      if (new URL(String(input)).hostname === "directory.doabooks.org") throw new Error("socket hang up");
      return flaky(input);
    }) as typeof fetch;
    const out = await tool.run({ query: "calculus", limit: 5 }, createApi(fetchImpl));
    const s = out.structured as any;
    expect(s.sources_unavailable).toEqual(["DOAB"]);
    expect(s.results.some((r: any) => r.source === "Open Library")).toBe(true);
  });

  it("adds the unavailable note after the No free copy text", async () => {
    const { s, text } = await find("obscure title", { doabDown: 500 });
    expect(text).toContain("No free copy was found");
    expect(text).toContain("These sources did not answer: DOAB.");
    expect(text.indexOf("No free copy was found")).toBeLessThan(text.indexOf("did not answer"));
    expect(s.sources_unavailable).toEqual(["DOAB"]);
    expect(s.results).toHaveLength(1);
    expect(s.results[0].access).toBe("none");
  });

  it("says nothing was found and still names the source that was down", async () => {
    const { s, text } = await find("nothingatall", { openLibraryDown: 500 });
    expect(s.results).toEqual([]);
    expect(s.sources_unavailable).toEqual(["Open Library"]);
    expect(text).toContain("Nothing found");
    expect(text).toContain("did not answer: Open Library");
  });

  it("lists both sources in the text when both are down but OpenStax matches", async () => {
    const { s, text } = await find("calculus", { doabDown: 500, openLibraryDown: 503 });
    expect(s.sources_unavailable).toEqual(["Open Library", "DOAB"]);
    expect(text).toContain("did not answer: Open Library, DOAB");
  });

  it("keeps sources_unavailable empty and leaves the note out when everything answers", async () => {
    const { s, text } = await find("obscure title");
    expect(s.sources_unavailable).toEqual([]);
    expect(text).not.toContain("did not answer");
  });

  it("reports the failure reason when every source is down and OpenStax has no match", async () => {
    await expect(find("obscure title", { doabDown: 500, openLibraryDown: 503 })).rejects.toThrow(/Try again in a minute/);
  });
});
