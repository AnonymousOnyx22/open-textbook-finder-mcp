import { describe, it, expect } from "vitest";
import { tools } from "../src/tools.js";
import { fakeApi } from "./fakes.js";

/** Runs a tool against the fake network and returns text and fields. */
async function run(name: string, args: Record<string, unknown>, options = {}) {
  const tool = tools.find((t) => t.name === name);
  if (!tool) throw new Error(`there is no tool called ${name}`);
  // Parse the arguments the way the server does, so the defaults are filled in.
  const parsed = Object.fromEntries(
    Object.entries(tool.inputSchema).map(([key, schema]) => [key, schema.parse(args[key])]).filter(([, v]) => v !== undefined),
  );
  const out = await tool.run(parsed, fakeApi(options));
  return { text: out.text, s: out.structured as any };
}

describe("find_free_textbook", () => {
  it("puts OpenStax first, then DOAB, then free Open Library copies, then loans", async () => {
    const { s, text } = await run("find_free_textbook", { query: "calculus" });
    const sources = s.results.map((r: any) => r.source);
    expect(sources).toEqual(["OpenStax", "OpenStax", "OpenStax", "DOAB", "Open Library", "Open Library"]);
    expect(s.results[0].title).toBe("Calculus Volume 1");
    expect(s.results[0].url).toBe("https://openstax.org/details/books/calculus-volume-1");
    expect(text).toContain("Found 6 free copies");
    expect(s.sources_unavailable).toEqual([]);
  });

  it("marks a public domain copy free and a loan as borrow, and leaves out books with no free copy", async () => {
    const { s } = await run("find_free_textbook", { query: "calculus" });
    const ol = s.results.filter((r: any) => r.source === "Open Library");
    expect(ol.map((r: any) => [r.title, r.access])).toEqual([
      ["Calculus", "free"],
      ["Calculus Early Transcendentals", "borrow"],
    ]);
    expect(ol[0].url).toBe("https://archive.org/details/calculus00stra");
    expect(s.results.map((r: any) => r.title)).not.toContain("Calculus Made Easy");
  });

  it("reads the licence and the year from a DOAB record", async () => {
    const { s } = await run("find_free_textbook", { query: "calculus" });
    const doab = s.results.find((r: any) => r.source === "DOAB");
    expect(doab.title).toBe("Open Calculus Notes");
    expect(doab.authors).toEqual(["Ann Writer"]);
    expect(doab.year).toBe(2019);
    expect(doab.access).toBe("free");
    expect(doab.note).toContain("creativecommons.org/licenses/by/4.0");
  });

  it("respects the limit for each source", async () => {
    const { s } = await run("find_free_textbook", { query: "calculus", limit: 1 });
    expect(s.results.map((r: any) => r.source)).toEqual(["OpenStax", "DOAB", "Open Library", "Open Library"]);
  });

  it("searches by ISBN and gives the cleaned ISBN back", async () => {
    const { s } = await run("find_free_textbook", { query: "978-0-13-468599-1" });
    expect(s.isbn).toBe("9780134685991");
    expect(s.results.some((r: any) => r.source === "OpenStax")).toBe(false);
    expect(s.results.some((r: any) => r.title === "Calculus Early Transcendentals" && r.access === "borrow")).toBe(true);
  });

  it("rejects an ISBN with a bad check digit", async () => {
    await expect(run("find_free_textbook", { query: "9780134685992" })).rejects.toThrow(/not a valid ISBN/);
  });

  it("says so when only records with no free copy exist", async () => {
    const { s, text } = await run("find_free_textbook", { query: "obscure title" });
    expect(text).toContain("No free copy was found");
    expect(s.results).toHaveLength(1);
    expect(s.results[0].access).toBe("none");
  });

  it("says so when nothing matches at all", async () => {
    const { s, text } = await run("find_free_textbook", { query: "nothingatall" });
    expect(s.results).toEqual([]);
    expect(text).toContain("Nothing found");
  });

  it("still answers when one source is down and names it", async () => {
    const { s, text } = await run("find_free_textbook", { query: "calculus" }, { doabDown: 500 });
    expect(s.sources_unavailable).toEqual(["DOAB"]);
    expect(s.results.some((r: any) => r.source === "DOAB")).toBe(false);
    expect(s.results.some((r: any) => r.source === "Open Library")).toBe(true);
    expect(text).toContain("did not answer: DOAB");
  });

  it("keeps the OpenStax matches when both services are down", async () => {
    const { s } = await run("find_free_textbook", { query: "calculus" }, { doabDown: 500, openLibraryDown: 503 });
    expect(s.sources_unavailable).toEqual(["Open Library", "DOAB"]);
    expect(s.results.map((r: any) => r.source)).toEqual(["OpenStax", "OpenStax", "OpenStax"]);
  });

  it("fails with a clear message when every source is down and OpenStax has no match", async () => {
    await expect(run("find_free_textbook", { query: "obscure title" }, { doabDown: 500, openLibraryDown: 503 })).rejects.toThrow(/Could not reach Open Library or DOAB/);
  });
});

describe("lookup_isbn", () => {
  it("returns the edition details", async () => {
    const { s, text } = await run("lookup_isbn", { isbn: "978-0-13-468599-1" });
    expect(s.isbn).toBe("9780134685991");
    expect(s.isbn13).toBe("9780134685991");
    expect(s.title).toBe("Calculus Early Transcendentals");
    expect(s.authors).toEqual(["James Stewart"]);
    expect(s.publishers).toEqual(["Cengage"]);
    expect(s.publish_date).toBe("January 1, 2020");
    expect(s.pages).toBe(1368);
    expect(s.edition_name).toBe("9th edition");
    expect(s.url).toBe("https://openlibrary.org/books/OL1M");
    expect(text).toContain("1368 pages");
  });

  it("lists the other editions newest first and leaves out the one asked for", async () => {
    const { s } = await run("lookup_isbn", { isbn: "9780134685991" });
    expect(s.related_editions.map((e: any) => e.year)).toEqual([2016, 2012, 2012, 2008, undefined]);
    expect(s.related_editions.map((e: any) => e.url)).not.toContain("https://openlibrary.org/books/OL1M");
    expect(s.related_editions[0]).toMatchObject({ edition_name: "8th edition", isbn13: "9781305272378" });
  });

  it("says no free copy is known for a borrow only book", async () => {
    const { s, text } = await run("lookup_isbn", { isbn: "9780134685991" });
    expect(s.free_copy).toBe(false);
    expect(s).not.toHaveProperty("free_copy_url");
    expect(text).toContain("No free copy");
  });

  it("gives the link when a public domain copy is known", async () => {
    const docs = [{ key: "/works/OL100W", title: "Calculus Early Transcendentals", author_name: ["James Stewart"], ia: ["stewartcalc"], ebook_access: "public" }];
    const { s } = await run("lookup_isbn", { isbn: "9780134685991" }, { docs });
    expect(s.free_copy).toBe(true);
    expect(s.free_copy_url).toBe("https://archive.org/details/stewartcalc");
  });

  it("reports an ISBN that Open Library does not know", async () => {
    await expect(run("lookup_isbn", { isbn: "9780306406157" })).rejects.toThrow(/Not found/);
  });

  it("rejects an ISBN with a bad check digit before it asks anyone", async () => {
    await expect(run("lookup_isbn", { isbn: "9780134685992" }, { openLibraryDown: 500 })).rejects.toThrow(/not a valid ISBN/);
  });

  it("reports a service that is down", async () => {
    await expect(run("lookup_isbn", { isbn: "9780134685991" }, { openLibraryDown: 503 })).rejects.toThrow(/service had a problem/);
  });
});

describe("list_open_textbooks_by_subject", () => {
  it("lists the OpenStax books for a subject, then DOAB", async () => {
    const { s, text } = await run("list_open_textbooks_by_subject", { subject: "statistics" });
    expect(s.subject).toBe("statistics");
    expect(s.results.map((r: any) => r.title)).toEqual([
      "Introductory Statistics 2e",
      "Introductory Business Statistics 2e",
      "Statistics",
      "Open Calculus Notes",
    ]);
    expect(text).toContain('4 free textbooks for "statistics"');
  });

  it("ignores filler words such as intro", async () => {
    const { s } = await run("list_open_textbooks_by_subject", { subject: "intro statistics" });
    expect(s.results[0].title).toBe("Introductory Statistics 2e");
  });

  it("matches a broad subject to every book under it", async () => {
    const { s } = await run("list_open_textbooks_by_subject", { subject: "nursing", limit: 25 });
    const titles = s.results.map((r: any) => r.title);
    expect(titles).toContain("Nursing Pharmacology");
    expect(titles).toContain("Fundamentals of Nursing");
  });

  it("respects the limit", async () => {
    const { s } = await run("list_open_textbooks_by_subject", { subject: "math", limit: 3 });
    expect(s.results).toHaveLength(3);
  });

  it("still lists OpenStax books when DOAB is down and names DOAB", async () => {
    const { s, text } = await run("list_open_textbooks_by_subject", { subject: "economics" }, { doabDown: 500 });
    expect(s.sources_unavailable).toEqual(["DOAB"]);
    expect(s.results.length).toBeGreaterThan(0);
    expect(s.results.every((r: any) => r.source === "OpenStax")).toBe(true);
    expect(text).toContain("did not answer: DOAB");
  });

  it("says so when nothing matches", async () => {
    const { s, text } = await run("list_open_textbooks_by_subject", { subject: "obscure" });
    expect(s.results).toEqual([]);
    expect(text).toContain("No free textbooks found");
  });
});

describe("find_older_edition", () => {
  it("lists the earlier editions, closest first, when the newest is the current one", async () => {
    const { s, text } = await run("find_older_edition", { query: "Stewart Calculus" });
    expect(s.work_title).toBe("Calculus Early Transcendentals");
    expect(s.current_year).toBe(2020);
    expect(s.newest_year).toBe(2020);
    expect(s.suggestions.map((e: any) => [e.year, e.years_older, e.edition_number])).toEqual([
      [2016, 4, 8],
      [2012, 8, 7],
      [2008, 12, 6],
    ]);
    expect(text).toContain("table of contents");
  });

  it("keeps one entry for a repeated edition and prefers the one with an ISBN", async () => {
    const { s } = await run("find_older_edition", { query: "Stewart Calculus" });
    const seventh = s.suggestions.filter((e: any) => e.year === 2012);
    expect(seventh).toHaveLength(1);
    expect(seventh[0].isbn13).toBe("9780538497909");
    expect(seventh[0].publisher).toBe("Cengage");
  });

  it("measures from edition_year when the course names one", async () => {
    const { s } = await run("find_older_edition", { query: "Stewart Calculus", edition_year: 2012 });
    expect(s.current_year).toBe(2012);
    expect(s.suggestions.map((e: any) => e.year)).toEqual([2008]);
  });

  it("takes an ISBN and counts that edition as the current one", async () => {
    const { s } = await run("find_older_edition", { query: "978-0-13-468599-1" });
    expect(s.current_year).toBe(2020);
    expect(s.suggestions[0].year).toBe(2016);
  });

  it("respects the limit", async () => {
    const { s } = await run("find_older_edition", { query: "Stewart Calculus", limit: 1 });
    expect(s.suggestions).toHaveLength(1);
  });

  it("says so when no earlier edition is listed", async () => {
    const { s, text } = await run("find_older_edition", { query: "Stewart Calculus", edition_year: 1990 });
    expect(s.suggestions).toEqual([]);
    expect(text).toContain("No edition");
  });

  it("explains when Open Library has no book for the title", async () => {
    await expect(run("find_older_edition", { query: "nothingatall" })).rejects.toThrow(/no editions linked/);
  });
});
