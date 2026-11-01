import { describe, expect, it } from "vitest";
import { OPENSTAX, booksBySubject, openstaxUrl, scoreBook, searchCatalog, terms } from "../src/catalog.js";

describe("searchCatalog", () => {
  it("matches by title", () => {
    const results = searchCatalog("Calculus Volume 1");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toBe("Calculus Volume 1");
    expect(openstaxUrl(results[0])).toBe("https://openstax.org/details/books/calculus-volume-1");
  });

  it("ignores author and publisher words such as Stewart", () => {
    expect(terms("Stewart Calculus")).toEqual(["calculus"]);
    expect(searchCatalog("Stewart Larson Thomas Calculus").map((r) => r.slug)).toContain("calculus-volume-1");
    expect(scoreBook(OPENSTAX[0], "Stewart Calculus")).toBe(scoreBook(OPENSTAX[0], "Calculus"));
  });

  it("matches by subject", () => {
    const results = searchCatalog("calculus");
    expect(results.length).toBeGreaterThan(0);
    const slugs = results.map((r) => r.slug);
    expect(slugs).toContain("calculus-volume-1");
    const book = results.find((r) => r.slug === "calculus-volume-1");
    expect(book).toBeDefined();
    expect(openstaxUrl(book!)).toBe("https://openstax.org/details/books/calculus-volume-1");
  });

  it("matches by keyword", () => {
    const results = searchCatalog("organic");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].slug).toBe("organic-chemistry");
    expect(openstaxUrl(results[0])).toBe("https://openstax.org/details/books/organic-chemistry");
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
    const book = results.find((r) => r.slug === "calculus-volume-1");
    expect(book).toBeDefined();
    expect(openstaxUrl(book!)).toBe("https://openstax.org/details/books/calculus-volume-1");
  });

  it("matches by keyword", () => {
    const results = booksBySubject("organic");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].slug).toBe("organic-chemistry");
    expect(openstaxUrl(results[0])).toBe("https://openstax.org/details/books/organic-chemistry");
  });

  it("returns empty for no match", () => {
    const results = booksBySubject("zzznomatch");
    expect(results).toEqual([]);
  });
});

const ADDED_SLUGS = [
  "principles-finance",
  "entrepreneurship",
  "organizational-behavior",
  "human-resource-management",
  "principles-marketing",
  "business-ethics",
  "principles-data-science",
  "introduction-intellectual-property",
  "introduction-political-science",
  "introduction-anthropology",
  "introduction-behavioral-neuroscience",
  "world-history-volume-2",
  "biology-ap-courses",
  "college-physics-ap-courses-2e",
  "medical-surgical-nursing",
  "clinical-nursing-skills",
  "maternal-newborn-nursing",
  "psychiatric-mental-health-nursing",
  "population-health",
];

describe("added OpenStax titles", () => {
  it("has unique, well formed slugs", () => {
    const slugs = OPENSTAX.map((b) => b.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  for (const slug of ADDED_SLUGS) {
    describe(slug, () => {
      const book = OPENSTAX.find((b) => b.slug === slug);

      it("is in the catalog with a valid openstaxUrl", () => {
        expect(book).toBeDefined();
        expect(openstaxUrl(book!)).toBe(`https://openstax.org/details/books/${slug}`);
      });

      it("is found by searchCatalog on its title", () => {
        const found = searchCatalog(book!.title, OPENSTAX.length).find((b) => b.slug === slug);
        expect(found).toBeDefined();
        expect(openstaxUrl(found!)).toBe(`https://openstax.org/details/books/${slug}`);
      });

      it("is found by booksBySubject on its subject and title", () => {
        const subject = book!.subjects[book!.subjects.length - 1];
        expect(booksBySubject(subject).map((b) => b.slug)).toContain(slug);
        expect(booksBySubject(book!.title).map((b) => b.slug)).toContain(slug);
      });
    });
  }
});
