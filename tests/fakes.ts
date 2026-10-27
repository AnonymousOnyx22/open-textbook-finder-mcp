import { createApi, type Api } from "../src/sources.js";

/** What a fake service answers: a JSON body, or a bare status code for a failure. */
export type Reply = unknown | { status: number };

export type Handler = (url: URL) => Reply | undefined;

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/** A fetch that answers from a handler, so no test touches the network. */
export function fakeFetch(handler: Handler): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const reply = handler(new URL(String(input)));
    if (reply === undefined) return json({ error: "not found" }, 404);
    if (reply && typeof reply === "object" && "status" in reply && Object.keys(reply).length === 1) {
      return json({ error: "failed" }, (reply as { status: number }).status);
    }
    return json(reply);
  }) as typeof fetch;
}

export const STRANG = { key: "/works/OL1W", title: "Calculus", author_name: ["Gilbert Strang"], first_publish_year: 1991, ia: ["calculus00stra"], ebook_access: "public" };
export const STEWART = { key: "/works/OL100W", title: "Calculus Early Transcendentals", author_name: ["James Stewart"], first_publish_year: 1987, ia: ["stewartcalc"], ebook_access: "borrowable" };
export const MADE_EASY = { key: "/works/OL3W", title: "Calculus Made Easy", author_name: ["Silvanus Thompson"], first_publish_year: 1910, ebook_access: "no_ebook" };

export const DOAB_ITEM = {
  name: "Open Calculus Notes",
  handle: "20.500.12657/1",
  metadata: [
    { key: "dc.title", value: "Open Calculus Notes" },
    { key: "dc.contributor.author", value: "Ann Writer" },
    { key: "dc.identifier.uri", value: "https://library.oapen.org/handle/20.500.12657/1" },
    { key: "dc.date.issued", value: "2019-05-01" },
    { key: "dc.rights.uri", value: "https://creativecommons.org/licenses/by/4.0/" },
  ],
};

export const EDITION = {
  key: "/books/OL1M",
  title: "Calculus Early Transcendentals",
  edition_name: "9th edition",
  publishers: ["Cengage"],
  publish_date: "January 1, 2020",
  number_of_pages: 1368,
  isbn_13: ["9780134685991"],
  works: [{ key: "/works/OL100W" }],
};

export const EDITIONS = [
  { key: "/books/OL1M", title: "Calculus Early Transcendentals", edition_name: "9th edition", publishers: ["Cengage"], publish_date: "2020", isbn_13: ["9780134685991"] },
  { key: "/books/OL2M", title: "Calculus Early Transcendentals", edition_name: "8th edition", publishers: ["Cengage"], publish_date: "2016", isbn_13: ["9781305272378"] },
  { key: "/books/OL3M", title: "Calculus Early Transcendentals", edition_name: "7th edition", publishers: ["Cengage"], publish_date: "2012" },
  { key: "/books/OL4M", title: "Calculus Early Transcendentals", edition_name: "7th edition", publishers: ["Cengage"], publish_date: "June 2012", isbn_13: ["9780538497909"] },
  { key: "/books/OL5M", title: "Calculus Early Transcendentals", edition_name: "6th edition", publishers: ["Cengage"], publish_date: "2008", isbn_13: ["9780495011668"] },
  { key: "/books/OL6M", title: "Calculus Early Transcendentals", publishers: ["Unknown"] },
];

export interface Options {
  /** Make Open Library fail with this status. */
  openLibraryDown?: number;
  /** Make DOAB fail with this status. */
  doabDown?: number;
  /** Replace the Open Library search docs. */
  docs?: unknown[];
  /** Replace the DOAB items. */
  doab?: unknown[];
}

/** A fake Open Library and DOAB, with a few books in them. */
export function standardHandler(options: Options = {}): Handler {
  return (url) => {
    if (url.hostname === "directory.doabooks.org") {
      if (options.doabDown) return { status: options.doabDown };
      if (url.pathname.endsWith("/search")) {
        const q = url.searchParams.get("query") ?? "";
        if (q.includes("obscure") || q.includes("nothingatall")) return [];
        return options.doab ?? [DOAB_ITEM];
      }
      return undefined;
    }
    if (options.openLibraryDown) return { status: options.openLibraryDown };
    if (url.pathname === "/search.json") {
      const q = (url.searchParams.get("q") ?? "").toLowerCase();
      if (options.docs) return { docs: options.docs };
      if (q.includes("obscure")) return { docs: [MADE_EASY] };
      if (q.includes("nothingatall")) return { docs: [] };
      if (q.includes("isbn:") || q.includes("stewart") || q.includes("calculus early")) return { docs: [STEWART] };
      if (q.includes("calculus")) return { docs: [STRANG, STEWART, MADE_EASY] };
      return { docs: [] };
    }
    if (url.pathname === "/isbn/9780134685991.json") return EDITION;
    if (url.pathname === "/works/OL100W/editions.json") return { entries: EDITIONS };
    return undefined;
  };
}

export function fakeApi(options: Options = {}): Api {
  return createApi(fakeFetch(standardHandler(options)));
}
