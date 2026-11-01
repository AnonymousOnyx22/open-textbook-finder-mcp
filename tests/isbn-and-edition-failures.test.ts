import { describe, it, expect } from "vitest";
import { tools } from "../src/tools.js";
import { createApi } from "../src/sources.js";
import { fakeApi, fakeFetch, standardHandler, EDITION, type Handler } from "./fakes.js";

const lookup = tools.find((t) => t.name === "lookup_isbn")!;
const older = tools.find((t) => t.name === "find_older_edition")!;

describe("lookup_isbn errors", () => {
  it("rejects a bad check digit before any request", async () => {
    let calls = 0;
    const api = createApi((async () => {
      calls++;
      return new Response("{}");
    }) as typeof fetch);
    await expect(lookup.run({ isbn: "9780134685992" }, api)).rejects.toThrow(/not a valid ISBN/);
    expect(calls).toBe(0);
  });

  it("reports a 404 when Open Library does not know the ISBN", async () => {
    await expect(lookup.run({ isbn: "9780306406157" }, fakeApi())).rejects.toThrow();
  });

  it("still answers when DOAB is down, since it does not use DOAB", async () => {
    const out = await lookup.run({ isbn: "9780134685991" }, fakeApi({ doabDown: 500 }));
    expect((out.structured as any).title).toBe(EDITION.title);
  });

  it("keeps the edition when the search and the editions list fail", async () => {
    const base = standardHandler();
    const handler: Handler = (url) => {
      if (url.pathname === "/search.json" || url.pathname.endsWith("/editions.json")) return { status: 404 };
      return base(url);
    };
    const out = await lookup.run({ isbn: "9780134685991" }, createApi(fakeFetch(handler)));
    const s = out.structured as any;
    expect(s.free_copy).toBe(false);
    expect(s.related_editions).toEqual([]);
    expect(out.text).toContain("Open Library lists no other editions");
  });
});

describe("find_older_edition errors", () => {
  it("rejects an ISBN with a bad check digit", async () => {
    await expect(older.run({ query: "9780134685992" }, fakeApi())).rejects.toThrow(/not a valid ISBN/);
  });

  it("reports a 404 for an ISBN Open Library does not know", async () => {
    await expect(older.run({ query: "9780306406157" }, fakeApi())).rejects.toThrow();
  });

  it("names the title and points to OpenStax when no work is linked", async () => {
    await expect(older.run({ query: "nothingatall" }, fakeApi())).rejects.toThrow(/no editions linked to "nothingatall"/);
  });

  it("says there is nothing to compare when no edition has a date", async () => {
    const base = standardHandler();
    const handler: Handler = (url) => {
      if (url.pathname === "/works/OL100W/editions.json") return { entries: [{ key: "/books/OL6M", title: "Calculus", publishers: ["Unknown"] }] };
      return base(url);
    };
    await expect(older.run({ query: "stewart" }, createApi(fakeFetch(handler)))).rejects.toThrow(/no dated editions/);
  });

  it("fails clearly when Open Library is down", async () => {
    await expect(older.run({ query: "stewart" }, fakeApi({ openLibraryDown: 400 }))).rejects.toThrow();
  });
});
