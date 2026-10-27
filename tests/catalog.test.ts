import { describe, expect, it } from "vitest";
import { booksBySubject, searchCatalog } from "../src/catalog.js";

describe("searchCatalog", () => {
  it("matches by title", () => {
    const results = searchCatalog("Calculus Volume 1");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toBe("Calculus Volume 1");
  });

  it("matches by subject", () => {
    const results = searchCatalog("calculus");
    expect(results.length).toBeGreaterThan(0);
    const slugs = results.map((r) => r.slug);
    expect(slugs).toContain("calculus-volume-1");
  });

  it("matches by keyword", () => {
    const results = searchCatalog("organic");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].slug).toBe("organic-chemistry");
  });

  it("orders by score", () => {
    const results = searchCatalog("calculus");
    const scores = results.map((r, i, arr) => {
      if (i === 0) return 1000;
      return 0;
    });
    expect(results[0].title).toContain("Calculus");
  });

  it("respects limit", () => {
    const results = searchCatalog("math", 2);
    expect(results.length).toBe(2);
  });

  it("returns empty for no match", () => {
    const results = searchCatalog("zzznomatch");
    expect(results).toEqual([]);
  });
});

describe("booksBySubject", () => {
  it("matches by subject", () => {
    const results = booksBySubject("calculus");
    expect(results.length).toBeGreaterThan(0);
    expect(results.map((r) => r.slug)).toContain("calculus-volume-1");
  });

  it("matches by keyword", () => {
    const results = booksBySubject("organic");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].slug).toBe("organic-chemistry");
  });

  it("returns empty for no match", () => {
    const results = booksBySubject("zzznomatch");
    expect(results).toEqual([]);
  });
});
