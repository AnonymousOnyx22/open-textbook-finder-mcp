import { describe, it, expect } from "vitest";
import { cleanIsbn, doabItemToBook, editionNumber, isValidIsbn, looksLikeIsbn, olDocToBook, toIsbn13, yearOf } from "../src/sources.js";
import { OPENSTAX, booksBySubject, searchCatalog, terms } from "../src/catalog.js";

describe("ISBN helpers", () => {
  it("removes hyphens and spaces", () => {
    expect(cleanIsbn("978-0-13-468599-1")).toBe("9780134685991");
    expect(cleanIsbn("0 306 40615 2")).toBe("0306406152");
  });

  it("accepts a good ISBN 13 and a good ISBN 10, including an X check digit", () => {
    expect(isValidIsbn("9780134685991")).toBe(true);
    expect(isValidIsbn("0306406152")).toBe(true);
    expect(isValidIsbn("080442957X")).toBe(true);
  });

  it("rejects a typo, a short number and letters", () => {
    expect(isValidIsbn("9780134685992")).toBe(false);
    expect(isValidIsbn("0306406153")).toBe(false);
    expect(isValidIsbn("12345")).toBe(false);
    expect(isValidIsbn("calculus")).toBe(false);
  });

  it("turns an ISBN 10 into an ISBN 13", () => {
    expect(toIsbn13("0306406152")).toBe("9780306406157");
    expect(toIsbn13("9780134685991")).toBe("9780134685991");
  });

  it("tells an ISBN from a title", () => {
    expect(looksLikeIsbn("978-0-13-468599-1")).toBe(true);
    expect(looksLikeIsbn("0306406152")).toBe(true);
    expect(looksLikeIsbn("calculus")).toBe(false);
    expect(looksLikeIsbn("2020 2021 2022")).toBe(false);
  });

  it("upper cases a trailing x and trims tabs and newlines", () => {
    expect(cleanIsbn("080442957x")).toBe("080442957X");
    expect(cleanIsbn(" 0-306-40615-2\n")).toBe("0306406152");
    expect(cleanIsbn("")).toBe("");
  });

  it("accepts a lower case x and hyphenated input", () => {
    expect(isValidIsbn("080442957x")).toBe(true);
    expect(isValidIsbn("0-8044-2957-X")).toBe(true);
  });

  it("rejects an empty string, an X in the wrong place and a wrong length", () => {
    expect(isValidIsbn("")).toBe(false);
    expect(isValidIsbn("X306406152")).toBe(false);
    expect(isValidIsbn("978013468599X")).toBe(false);
    expect(isValidIsbn("97801346859910")).toBe(false);
    expect(isValidIsbn("030640615")).toBe(false);
  });

  it("converts an ISBN 10 with an X check digit and with hyphens", () => {
    expect(toIsbn13("0-8044-2957-X")).toBe("9780804429573");
    expect(isValidIsbn(toIsbn13("080442957X"))).toBe(true);
    expect(toIsbn13("978-0-13-468599-1")).toBe("9780134685991");
  });

  it("recognises an ISBN with an X and rejects other near misses", () => {
    expect(looksLikeIsbn("0-8044-2957-X")).toBe(true);
    expect(looksLikeIsbn("080442957x")).toBe(true);
    expect(looksLikeIsbn("")).toBe(false);
    expect(looksLikeIsbn("030640615")).toBe(false);
    expect(looksLikeIsbn("calculus 0306406152")).toBe(false);
    expect(looksLikeIsbn("97801346859911")).toBe(false);
  });
});

describe("year and edition readers", () => {
  it("finds a year in a publish date", () => {
    expect(yearOf("January 1, 2020")).toBe(2020);
    expect(yearOf("1987")).toBe(1987);
    expect(yearOf("no date")).toBeUndefined();
    expect(yearOf(undefined)).toBeUndefined();
  });

  it("reads an edition number from a name", () => {
    expect(editionNumber("9th edition")).toBe(9);
    expect(editionNumber("2nd ed.")).toBe(2);
    expect(editionNumber("5e")).toBe(5);
    expect(editionNumber("Third edition")).toBe(3);
    expect(editionNumber("12th edition")).toBe(12);
    expect(editionNumber("3rd Edition, revised")).toBe(3);
    expect(editionNumber("Tenth edition")).toBe(10);
    expect(editionNumber("Calculus 7e")).toBe(7);
    expect(editionNumber("")).toBeUndefined();
    expect(editionNumber("revised")).toBeUndefined();
    expect(editionNumber(undefined)).toBeUndefined();
  });
});

describe("Open Library and DOAB records", () => {
  it("marks public domain, borrowable and unavailable books", () => {
    expect(olDocToBook({ key: "/works/A", title: "A", ebook_access: "public", ia: ["a1"] })).toMatchObject({ access: "free", url: "https://archive.org/details/a1" });
    expect(olDocToBook({ key: "/works/B", title: "B", ebook_access: "borrowable", ia: ["b1"] })).toMatchObject({ access: "borrow", url: "https://openlibrary.org/works/B" });
    expect(olDocToBook({ key: "/works/C", title: "C", ebook_access: "no_ebook" })).toMatchObject({ access: "none" });
  });

  it("does not call a public record free when it has no Internet Archive copy", () => {
    expect(olDocToBook({ key: "/works/D", title: "D", ebook_access: "public" })?.access).toBe("none");
  });

  it("skips a record with no title", () => {
    expect(olDocToBook({ key: "/works/E" })).toBeUndefined();
    expect(doabItemToBook({ metadata: [] })).toBeUndefined();
  });

  it("builds a DOAB link from the handle when the record has no address", () => {
    const book = doabItemToBook({ name: "Open Book", handle: "20.500.12657/9", metadata: [] });
    expect(book?.url).toBe("https://directory.doabooks.org/handle/20.500.12657/9");
    expect(book?.access).toBe("free");
  });
});

describe("the OpenStax list", () => {
  it("has a unique slug and at least one subject for every book", () => {
    expect(new Set(OPENSTAX.map((b) => b.slug)).size).toBe(OPENSTAX.length);
    for (const book of OPENSTAX) expect(book.subjects.length, book.title).toBeGreaterThan(0);
  });

  it("drops filler words from a query", () => {
    expect(terms("The free Calculus textbook, 3rd edition")).toEqual(["calculus"]);
  });

  it("finds a book by title words", () => {
    expect(searchCatalog("python programming")[0].slug).toBe("introduction-python-programming");
    expect(searchCatalog("the python programming book")[0].slug).toBe("introduction-python-programming");
  });

  it("finds books by subject and keyword", () => {
    expect(searchCatalog("organic")[0].title).toBe("Organic Chemistry");
    expect(booksBySubject("physics").length).toBeGreaterThanOrEqual(5);
    expect(booksBySubject("accounting")).toHaveLength(2);
  });

  it("returns nothing for a query that matches nothing or has no real words", () => {
    expect(searchCatalog("zzzz qqqq")).toEqual([]);
    expect(searchCatalog("the")).toEqual([]);
    expect(booksBySubject("")).toEqual([]);
  });
});
