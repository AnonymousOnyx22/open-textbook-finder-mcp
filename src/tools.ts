import { z } from "zod";
import { type ToolDef, bullets } from "./core/tools.js";
import { booksBySubject, openstaxUrl, searchCatalog, type CatalogBook } from "./catalog.js";
import {
  type Api,
  type EditionInfo,
  type FoundBook,
  cleanIsbn,
  doabSearch,
  editionNumber,
  isValidIsbn,
  looksLikeIsbn,
  olDocToBook,
  olEditionByIsbn,
  olSearch,
  olWorkEditions,
  toIsbn13,
} from "./sources.js";

// The shape of one book in a result list. Three of the tools return a list of these.
const bookFields = z.object({
  source: z.string().describe('Where the book was found: "OpenStax", "DOAB" or "Open Library".'),
  title: z.string().describe("Title of the book."),
  authors: z.array(z.string()).describe("Authors or editors, when the source lists them."),
  year: z.number().optional().describe("Year of publication, when the source gives one."),
  url: z.string().describe("Page where you can read or download the book."),
  access: z.enum(["free", "borrow", "none"]).describe('"free" means a free copy you can keep or read online, "borrow" means a free loan, "none" means no free copy is known.'),
  note: z.string().describe("One sentence on what kind of copy this is."),
});

const unavailable = z.array(z.string()).describe("Names of the sources that did not answer, so a short list can be told from a failed search.");

const limitField = (max: number, fallback: number) =>
  z.number().int().min(1).max(max).default(fallback).describe(`How many results to return, 1 to ${max}. Defaults to ${fallback}.`);

function bookRow(b: FoundBook): Record<string, unknown> {
  const row: Record<string, unknown> = { source: b.source, title: b.title, authors: b.authors, url: b.url, access: b.access, note: b.note };
  if (b.year !== undefined) row.year = b.year;
  return row;
}

function fromCatalog(book: CatalogBook): FoundBook {
  return {
    source: "OpenStax",
    title: book.title,
    authors: [],
    url: openstaxUrl(book),
    access: "free",
    note: "Free peer reviewed textbook from OpenStax at Rice University. Read online or download a PDF, licensed for reuse.",
  };
}

function bookLine(b: FoundBook): string {
  const by = b.authors.length ? ` by ${b.authors.slice(0, 3).join(", ")}` : "";
  const year = b.year ? ` (${b.year})` : "";
  return `[${b.source}] ${b.title}${by}${year}. ${b.note} ${b.url}`;
}

function errorText(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Require a valid ISBN and give back its cleaned form. */
function checkedIsbn(raw: string): string {
  const isbn = cleanIsbn(raw);
  if (!isValidIsbn(isbn)) throw new Error(`"${raw}" is not a valid ISBN. An ISBN has 10 or 13 digits and the last digit is a check digit, so a typo fails here.`);
  return isbn;
}

export const tools: ToolDef<Api>[] = [
  {
    name: "find_free_textbook",
    title: "Find a free textbook",
    description:
      "Search for free and legal copies of a textbook on OpenStax, the Directory of Open Access Books (DOAB) and Open Library. " +
      "Inputs: query (a book title, an ISBN or a course topic such as \"organic chemistry\") and an optional limit of 1 to 10 results from each source. " +
      "Open Library results are marked free when there is a public domain copy to read online, and borrow when the book is a free loan. " +
      "No account or key is needed. If one source is down the others still answer and the reply names the source that did not. " +
      'Example prompt: "Is there a free legal copy of the Calculus textbook by Stewart, or something close to it?"',
    inputSchema: {
      query: z.string().min(1).describe("A textbook title, an ISBN (10 or 13 digits, hyphens allowed) or a course topic."),
      limit: limitField(10, 5),
    },
    outputSchema: {
      query: z.string().describe("The search text that was used."),
      isbn: z.string().optional().describe("The ISBN that was searched, when the query was an ISBN."),
      results: z.array(bookFields).describe("Free and borrowable books, OpenStax first, then DOAB, then Open Library."),
      sources_unavailable: unavailable,
    },
    run: async (a, api) => {
      const query = String(a.query).trim();
      const limit: number = a.limit ?? 5;
      const isbn = looksLikeIsbn(query) ? checkedIsbn(query) : undefined;
      const openstax = isbn ? [] : searchCatalog(query, limit).map(fromCatalog);
      const [ol, doab] = await Promise.allSettled([
        olSearch(api, isbn ? `isbn:${isbn}` : query, Math.max(limit * 2, 10)),
        doabSearch(api, isbn ?? query, limit),
      ]);
      const down: string[] = [];
      let olBooks: FoundBook[] = [];
      let doabBooks: FoundBook[] = [];
      if (ol.status === "fulfilled") olBooks = ol.value.map(olDocToBook).filter((b): b is FoundBook => !!b);
      else down.push("Open Library");
      if (doab.status === "fulfilled") doabBooks = doab.value;
      else down.push("DOAB");
      if (down.length === 2 && !openstax.length) {
        throw new Error(`Could not reach Open Library or DOAB (${errorText((ol as PromiseRejectedResult).reason)}). Try again in a minute.`);
      }
      const olFree = olBooks.filter((b) => b.access === "free");
      const olBorrow = olBooks.filter((b) => b.access === "borrow");
      let results = [...openstax.slice(0, limit), ...doabBooks.slice(0, limit), ...olFree.slice(0, limit), ...olBorrow.slice(0, limit)];
      if (!results.length) results = olBooks.slice(0, 3);
      const free = results.filter((b) => b.access !== "none").length;
      let text: string;
      if (!results.length) {
        text = `Nothing found for "${query}". Try the course topic instead of the exact title, for example "statistics" or "accounting".`;
      } else if (!free) {
        text = `No free copy was found for "${query}". Open Library knows the title, so these are the closest records:\n${bullets(results.map(bookLine))}\nTry list_open_textbooks_by_subject for the course topic, or find_older_edition for a cheaper print copy.`;
      } else {
        text = `Found ${free} free ${free === 1 ? "copy" : "copies"} for "${query}":\n${bullets(results.map(bookLine))}`;
      }
      if (down.length) text += `\nThese sources did not answer: ${down.join(", ")}.`;
      const structured: Record<string, unknown> = { query, results: results.map(bookRow), sources_unavailable: down };
      if (isbn) structured.isbn = isbn;
      return { text, structured };
    },
  },
  {
    name: "lookup_isbn",
    title: "Look up an ISBN",
    description:
      "Look up an ISBN on Open Library and return the edition details plus the other editions of the same book. " +
      "Inputs: isbn (10 or 13 digits, hyphens allowed). The check digit is tested first, so a typo is reported before any search. " +
      "The reply has the title, authors, publisher, publish date, page count and edition name, and says whether a free copy is known. Related editions are listed newest first. " +
      'Example prompt: "Look up ISBN 978-0-13-468599-1 and tell me what other editions exist."',
    inputSchema: {
      isbn: z.string().min(1).describe("The ISBN to look up, 10 or 13 digits, hyphens and spaces allowed."),
    },
    outputSchema: {
      isbn: z.string().describe("The ISBN as given, with hyphens and spaces removed."),
      isbn13: z.string().describe("The ISBN 13 form of the ISBN."),
      title: z.string().describe("Title of the edition."),
      authors: z.array(z.string()).describe("Authors, when Open Library lists them."),
      publishers: z.array(z.string()).describe("Publishers of the edition."),
      publish_date: z.string().optional().describe("Publish date as Open Library gives it."),
      pages: z.number().optional().describe("Number of pages, when known."),
      edition_name: z.string().optional().describe('Edition name such as "3rd edition", when known.'),
      url: z.string().describe("The Open Library page for this edition."),
      free_copy: z.boolean().describe("True when a free copy to read online is known."),
      free_copy_url: z.string().optional().describe("Where to read the free copy, when there is one."),
      related_editions: z
        .array(
          z.object({
            title: z.string().describe("Title of the related edition."),
            year: z.number().optional().describe("Year of publication, when known."),
            edition_name: z.string().optional().describe("Edition name, when known."),
            isbn13: z.string().optional().describe("ISBN 13 of the related edition, when known."),
            url: z.string().describe("The Open Library page for the related edition."),
          }),
        )
        .describe("Other editions of the same book, newest first."),
    },
    run: async (a, api) => {
      const isbn = checkedIsbn(String(a.isbn));
      const isbn13 = toIsbn13(isbn);
      const edition = await olEditionByIsbn(api, isbn);
      const [docs, editions] = await Promise.all([
        olSearch(api, `isbn:${isbn13}`, 1).catch(() => []),
        edition.work_key ? olWorkEditions(api, edition.work_key, 50).catch(() => [] as EditionInfo[]) : Promise.resolve([] as EditionInfo[]),
      ]);
      const doc = docs[0];
      const book = doc ? olDocToBook(doc) : undefined;
      const free = book?.access === "free";
      const related = editions
        .filter((e) => e.key !== edition.key)
        .sort((x, y) => (y.year ?? 0) - (x.year ?? 0))
        .slice(0, 10);
      const authors = doc?.author_name ?? [];
      const lines = [
        `${edition.title}${authors.length ? ` by ${authors.join(", ")}` : ""}`,
        `Publisher: ${edition.publishers.join(", ") || "not listed"}. Published: ${edition.publish_date ?? "date not listed"}.${edition.pages ? ` ${edition.pages} pages.` : ""}${edition.edition_name ? ` Edition: ${edition.edition_name}.` : ""}`,
        free ? `A free copy is available to read online: ${book!.url}` : "No free copy of this edition is known.",
      ];
      let text = lines.join("\n");
      if (related.length) {
        text += `\n\nOther editions:\n${bullets(related.map((e) => `${e.year ?? "year unknown"}${e.edition_name ? `, ${e.edition_name}` : ""}${e.isbn13 ? `, ISBN ${e.isbn13}` : ""}`))}`;
      } else {
        text += "\n\nOpen Library lists no other editions of this book.";
      }
      const structured: Record<string, unknown> = {
        isbn,
        isbn13,
        title: edition.title,
        authors,
        publishers: edition.publishers,
        url: edition.url,
        free_copy: free,
        related_editions: related.map((e) => {
          const row: Record<string, unknown> = { title: e.title, url: e.url };
          if (e.year !== undefined) row.year = e.year;
          if (e.edition_name) row.edition_name = e.edition_name;
          if (e.isbn13) row.isbn13 = e.isbn13;
          return row;
        }),
      };
      if (edition.publish_date) structured.publish_date = edition.publish_date;
      if (edition.pages !== undefined) structured.pages = edition.pages;
      if (edition.edition_name) structured.edition_name = edition.edition_name;
      if (free) structured.free_copy_url = book!.url;
      return { text, structured };
    },
  },
  {
    name: "list_open_textbooks_by_subject",
    title: "Browse open textbooks by subject",
    description:
      "Browse free textbooks for a course topic. It lists matching OpenStax books and open access books from the Directory of Open Access Books (DOAB). " +
      "Inputs: subject (a course topic such as \"calculus\", \"nursing\" or \"economics\") and an optional limit of 1 to 25 results. " +
      "OpenStax books come first. If DOAB is down the OpenStax list still comes back and the reply says so. " +
      'Example prompt: "List free textbooks for intro statistics."',
    inputSchema: {
      subject: z.string().min(1).describe('A course topic or subject, like "calculus", "statistics", "nursing" or "economics".'),
      limit: limitField(25, 10),
    },
    outputSchema: {
      subject: z.string().describe("The subject that was searched."),
      results: z.array(bookFields).describe("Free textbooks for the subject, OpenStax first and then DOAB."),
      sources_unavailable: unavailable,
    },
    run: async (a, api) => {
      const subject = String(a.subject).trim();
      const limit: number = a.limit ?? 10;
      const openstax = booksBySubject(subject).map(fromCatalog);
      const down: string[] = [];
      let doab: FoundBook[] = [];
      try {
        doab = await doabSearch(api, subject, limit);
      } catch {
        down.push("DOAB");
      }
      const results = [...openstax, ...doab].slice(0, limit);
      let text = results.length
        ? `${results.length} free ${results.length === 1 ? "textbook" : "textbooks"} for "${subject}":\n${bullets(results.map(bookLine))}`
        : `No free textbooks found for "${subject}". Try a broader topic, for example "math" instead of "linear transformations".`;
      if (down.length) text += `\nThese sources did not answer: ${down.join(", ")}.`;
      return { text, structured: { subject, results: results.map(bookRow), sources_unavailable: down } };
    },
  },
  {
    name: "find_older_edition",
    title: "Find a cheaper older edition",
    description:
      "Suggest earlier editions of a textbook, which usually cost less used than the newest one. " +
      "Inputs: query (a title or an ISBN) and two optional values: edition_year, the year of the edition your course asks for, and limit, 1 to 10 suggestions. " +
      "Without edition_year the newest edition Open Library lists counts as the current one, and an ISBN counts as the current edition when you pass one. " +
      "Suggestions run from the closest older edition down. Editions only one or two releases back often keep the same chapters, but problem sets get reordered, so check the table of contents against your syllabus. " +
      "The tool does not know prices. " +
      'Example prompt: "My course wants the 9th edition of Stewart Calculus. Is there an older edition that would work?"',
    inputSchema: {
      query: z.string().min(1).describe("The textbook title or its ISBN."),
      edition_year: z.number().int().min(1450).max(2100).optional().describe("Year of the edition your course requires. Leave it out to treat the newest edition found as the current one."),
      limit: limitField(10, 5),
    },
    outputSchema: {
      work_title: z.string().describe("Title of the book the editions belong to."),
      current_year: z.number().optional().describe("Year of the edition the suggestions are older than."),
      newest_year: z.number().optional().describe("Year of the newest edition Open Library lists."),
      suggestions: z
        .array(
          z.object({
            title: z.string().describe("Title of the older edition."),
            year: z.number().describe("Year of publication."),
            years_older: z.number().describe("How many years older it is than the current edition."),
            edition_name: z.string().optional().describe("Edition name, when known."),
            edition_number: z.number().optional().describe("Edition number read from the name, when there is one."),
            publisher: z.string().optional().describe("Publisher, when known."),
            isbn13: z.string().optional().describe("ISBN 13, when known."),
            url: z.string().describe("The Open Library page for this edition."),
          }),
        )
        .describe("Older editions, closest to the current one first."),
    },
    run: async (a, api) => {
      const query = String(a.query).trim();
      const limit: number = a.limit ?? 5;
      let workKey: string | undefined;
      let workTitle: string;
      let baseYear: number | undefined;
      if (looksLikeIsbn(query)) {
        const edition = await olEditionByIsbn(api, checkedIsbn(query));
        workKey = edition.work_key;
        workTitle = edition.title;
        baseYear = edition.year;
      } else {
        const docs = await olSearch(api, query, 1);
        workKey = docs[0]?.key?.startsWith("/works/") ? docs[0].key : undefined;
        workTitle = docs[0]?.title ?? query;
      }
      if (!workKey) throw new Error(`Open Library has no editions linked to "${query}". Check the spelling, or search with the ISBN from the back of the book.`);
      const all = (await olWorkEditions(api, workKey, 100)).filter((e) => e.year !== undefined);
      if (!all.length) throw new Error(`Open Library lists no dated editions for "${workTitle}", so there is nothing to compare.`);
      const newest = Math.max(...all.map((e) => e.year!));
      const current: number = a.edition_year ?? baseYear ?? newest;
      const seen = new Set<string>();
      const older = all
        .filter((e) => e.year! < current)
        .sort((x, y) => y.year! - x.year! || Number(!!y.isbn13) - Number(!!x.isbn13))
        .filter((e) => {
          const id = `${e.year}|${(e.edition_name ?? "").toLowerCase()}|${(e.publishers[0] ?? "").toLowerCase()}`;
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        })
        .slice(0, limit);
      const suggestions = older.map((e) => {
        const row: Record<string, unknown> = { title: e.title, year: e.year, years_older: current - e.year!, url: e.url };
        const num = editionNumber(e.edition_name) ?? editionNumber(e.title);
        if (e.edition_name) row.edition_name = e.edition_name;
        if (num !== undefined) row.edition_number = num;
        if (e.publishers[0]) row.publisher = e.publishers[0];
        if (e.isbn13) row.isbn13 = e.isbn13;
        return row;
      });
      let text: string;
      if (!older.length) {
        text = `No edition of "${workTitle}" older than ${current} is listed on Open Library. Try find_free_textbook for a free alternative.`;
      } else {
        const lines = older.map((e) => `${e.year}${e.edition_name ? `, ${e.edition_name}` : ""}${e.publishers[0] ? `, ${e.publishers[0]}` : ""}${e.isbn13 ? `, ISBN ${e.isbn13}` : ""} (${current - e.year!} years older)`);
        text =
          `Older editions of "${workTitle}" than the ${current} one:\n${bullets(lines)}\n` +
          "Editions one or two releases back often keep the same chapters, but check the table of contents against your syllabus and ask your instructor before you buy. Prices are not shown here.";
      }
      const structured: Record<string, unknown> = { work_title: workTitle, current_year: current, newest_year: newest, suggestions };
      return { text, structured };
    },
  },
];
