import { createClient, type HttpClient } from "./core/http.js";

export interface Api {
  openLibrary: HttpClient;
  doab: HttpClient;
}

const AGENT = "open-textbook-finder-mcp (https://github.com/AnonymousOnyx22/open-textbook-finder-mcp)";

export function createApi(fetchImpl?: typeof fetch): Api {
  const headers = { "User-Agent": AGENT };
  return {
    openLibrary: createClient({ baseUrl: "https://openlibrary.org", headers, fetchImpl }),
    doab: createClient({ baseUrl: "https://directory.doabooks.org/rest", headers, fetchImpl }),
  };
}

// ---------- ISBN ----------

/** Digits (and a final X) of an ISBN, with spaces and hyphens removed. */
export function cleanIsbn(input: string): string {
  return input.replace(/[\s-]/g, "").toUpperCase();
}

export function isValidIsbn(raw: string): boolean {
  const isbn = cleanIsbn(raw);
  if (/^\d{13}$/.test(isbn)) {
    let sum = 0;
    for (let i = 0; i < 13; i++) sum += Number(isbn[i]) * (i % 2 === 0 ? 1 : 3);
    return sum % 10 === 0;
  }
  if (/^\d{9}[\dX]$/.test(isbn)) {
    let sum = 0;
    for (let i = 0; i < 10; i++) sum += (isbn[i] === "X" ? 10 : Number(isbn[i])) * (10 - i);
    return sum % 11 === 0;
  }
  return false;
}

/** Turn a valid ISBN 10 into an ISBN 13. An ISBN 13 comes back as it is. */
export function toIsbn13(raw: string): string {
  const isbn = cleanIsbn(raw);
  if (isbn.length === 13) return isbn;
  const body = "978" + isbn.slice(0, 9);
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(body[i]) * (i % 2 === 0 ? 1 : 3);
  return body + String((10 - (sum % 10)) % 10);
}

/** True when the text is only an ISBN, with or without hyphens. */
export function looksLikeIsbn(text: string): boolean {
  return /^[\dX-]{10,17}$/i.test(text.replace(/\s/g, "")) && /^(\d{13}|\d{9}[\dX])$/.test(cleanIsbn(text));
}

// ---------- shared shapes ----------

export type Access = "free" | "borrow" | "none";

export interface FoundBook {
  source: "OpenStax" | "DOAB" | "Open Library";
  title: string;
  authors: string[];
  year?: number;
  url: string;
  access: Access;
  note: string;
}

export interface EditionInfo {
  key: string;
  title: string;
  edition_name?: string;
  publishers: string[];
  publish_date?: string;
  year?: number;
  pages?: number;
  isbn13?: string;
  isbn10?: string;
  work_key?: string;
  url: string;
}

export function yearOf(text?: string | number | null): number | undefined {
  if (text === undefined || text === null) return undefined;
  const m = /\b(1[5-9]\d\d|20\d\d)\b/.exec(String(text));
  return m ? Number(m[1]) : undefined;
}

// ---------- Open Library ----------

interface OlSearchDoc {
  key?: string;
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  edition_count?: number;
  ia?: string[];
  ebook_access?: string;
  subject?: string[];
  isbn?: string[];
}

const OL_FIELDS = "key,title,author_name,first_publish_year,edition_count,ia,ebook_access,isbn";

export async function olSearch(api: Api, query: string, limit: number): Promise<OlSearchDoc[]> {
  const data = await api.openLibrary.get<{ docs?: OlSearchDoc[] }>("/search.json", { q: query, limit, fields: OL_FIELDS });
  return data.docs ?? [];
}

export function olDocToBook(doc: OlSearchDoc): FoundBook | undefined {
  if (!doc.title || !doc.key) return undefined;
  const ia = doc.ia?.[0];
  let access: Access = "none";
  let url = `https://openlibrary.org${doc.key}`;
  let note = "Listed on Open Library. No free online copy is known.";
  if (doc.ebook_access === "public" && ia) {
    access = "free";
    url = `https://archive.org/details/${ia}`;
    note = "Public domain or openly licensed copy you can read online at the Internet Archive.";
  } else if (doc.ebook_access === "borrowable") {
    access = "borrow";
    note = "Can be borrowed for free with an Internet Archive account. It is a loan, not a copy to keep.";
  }
  return { source: "Open Library", title: doc.title, authors: doc.author_name ?? [], year: doc.first_publish_year, url, access, note };
}

interface OlEdition {
  key?: string;
  title?: string;
  edition_name?: string;
  publishers?: string[];
  publish_date?: string;
  number_of_pages?: number;
  isbn_13?: string[];
  isbn_10?: string[];
  works?: { key: string }[];
}

export function olEditionToInfo(e: OlEdition): EditionInfo {
  const key = e.key ?? "";
  return {
    key,
    title: e.title ?? "Untitled",
    edition_name: e.edition_name,
    publishers: e.publishers ?? [],
    publish_date: e.publish_date,
    year: yearOf(e.publish_date),
    pages: e.number_of_pages,
    isbn13: e.isbn_13?.[0],
    isbn10: e.isbn_10?.[0],
    work_key: e.works?.[0]?.key,
    url: key ? `https://openlibrary.org${key}` : "https://openlibrary.org",
  };
}

export async function olEditionByIsbn(api: Api, isbn: string): Promise<EditionInfo> {
  const e = await api.openLibrary.get<OlEdition>(`/isbn/${cleanIsbn(isbn)}.json`);
  return olEditionToInfo(e);
}

export async function olWorkEditions(api: Api, workKey: string, limit = 100): Promise<EditionInfo[]> {
  const data = await api.openLibrary.get<{ entries?: OlEdition[] }>(`${workKey}/editions.json`, { limit });
  return (data.entries ?? []).map(olEditionToInfo);
}

// ---------- DOAB ----------

interface DoabItem {
  name?: string;
  handle?: string;
  metadata?: { key: string; value: string }[];
}

function meta(item: DoabItem, key: string): string[] {
  return (item.metadata ?? []).filter((m) => m.key === key).map((m) => m.value);
}

export function doabItemToBook(item: DoabItem): FoundBook | undefined {
  const title = meta(item, "dc.title")[0] ?? item.name;
  if (!title) return undefined;
  const links = meta(item, "dc.identifier.uri");
  const url = links.find((l) => l.startsWith("http")) ?? (item.handle ? `https://directory.doabooks.org/handle/${item.handle}` : "https://directory.doabooks.org");
  const licence = meta(item, "dc.rights.uri")[0] ?? meta(item, "dc.rights")[0] ?? meta(item, "dc.rights.license")[0];
  const authors = [...meta(item, "dc.contributor.author"), ...meta(item, "dc.contributor.editor")];
  return {
    source: "DOAB",
    title,
    authors,
    year: yearOf(meta(item, "dc.date.issued")[0]),
    url,
    access: "free",
    note: licence ? `Open access book in the Directory of Open Access Books. Licence: ${licence}` : "Open access book in the Directory of Open Access Books.",
  };
}

export async function doabSearch(api: Api, query: string, limit: number): Promise<FoundBook[]> {
  const items = await api.doab.get<DoabItem[]>("/search", { query, expand: "metadata", limit });
  return (Array.isArray(items) ? items : []).map(doabItemToBook).filter((b): b is FoundBook => !!b);
}

// ---------- edition names ----------

const ORDINALS: Record<string, number> = {
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10,
};

/** The edition number in a name such as "3rd edition", "5e" or "Seventh edition". */
export function editionNumber(text?: string): number | undefined {
  if (!text) return undefined;
  const t = text.toLowerCase();
  const digits = /\b(\d{1,2})(?:st|nd|rd|th)?\s*(?:ed\b|edition)/.exec(t) ?? /\b(\d{1,2})e\b/.exec(t);
  if (digits) return Number(digits[1]);
  const word = /\b(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)\b/.exec(t);
  return word ? ORDINALS[word[1]] : undefined;
}
