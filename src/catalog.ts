// A small built in list of OpenStax books. OpenStax has no public search API, so the
// titles, subjects and page addresses live here and the match runs offline.

export interface CatalogBook {
  slug: string;
  title: string;
  subjects: string[];
  keywords: string[];
}

export const OPENSTAX_URL = "https://openstax.org/details/books/";

export const OPENSTAX: CatalogBook[] = [
  { slug: "calculus-volume-1", title: "Calculus Volume 1", subjects: ["math", "calculus"], keywords: ["differential", "limits", "derivatives"] },
  { slug: "calculus-volume-2", title: "Calculus Volume 2", subjects: ["math", "calculus"], keywords: ["integral", "series", "sequences"] },
  { slug: "calculus-volume-3", title: "Calculus Volume 3", subjects: ["math", "calculus"], keywords: ["multivariable", "vector"] },
  { slug: "college-algebra-2e", title: "College Algebra 2e", subjects: ["math", "algebra"], keywords: ["functions", "polynomials"] },
  { slug: "algebra-and-trigonometry-2e", title: "Algebra and Trigonometry 2e", subjects: ["math", "algebra", "trigonometry"], keywords: ["precalculus"] },
  { slug: "precalculus-2e", title: "Precalculus 2e", subjects: ["math", "precalculus"], keywords: ["trigonometry", "functions"] },
  { slug: "elementary-algebra-2e", title: "Elementary Algebra 2e", subjects: ["math", "algebra"], keywords: ["developmental"] },
  { slug: "intermediate-algebra-2e", title: "Intermediate Algebra 2e", subjects: ["math", "algebra"], keywords: ["developmental"] },
  { slug: "prealgebra-2e", title: "Prealgebra 2e", subjects: ["math", "algebra"], keywords: ["developmental", "arithmetic"] },
  { slug: "contemporary-mathematics", title: "Contemporary Mathematics", subjects: ["math"], keywords: ["liberal arts", "finite"] },
  { slug: "introductory-statistics-2e", title: "Introductory Statistics 2e", subjects: ["math", "statistics"], keywords: ["probability", "hypothesis"] },
  { slug: "introductory-business-statistics-2e", title: "Introductory Business Statistics 2e", subjects: ["business", "statistics", "math"], keywords: ["probability"] },
  { slug: "statistics", title: "Statistics", subjects: ["math", "statistics"], keywords: ["probability"] },
  { slug: "university-physics-volume-1", title: "University Physics Volume 1", subjects: ["science", "physics"], keywords: ["mechanics", "waves", "thermodynamics"] },
  { slug: "university-physics-volume-2", title: "University Physics Volume 2", subjects: ["science", "physics"], keywords: ["electricity", "magnetism", "optics"] },
  { slug: "university-physics-volume-3", title: "University Physics Volume 3", subjects: ["science", "physics"], keywords: ["modern physics", "quantum", "relativity"] },
  { slug: "college-physics-2e", title: "College Physics 2e", subjects: ["science", "physics"], keywords: ["algebra based"] },
  { slug: "physics", title: "Physics", subjects: ["science", "physics"], keywords: ["high school"] },
  { slug: "astronomy-2e", title: "Astronomy 2e", subjects: ["science", "astronomy", "physics"], keywords: ["space", "cosmology"] },
  { slug: "chemistry-2e", title: "Chemistry 2e", subjects: ["science", "chemistry"], keywords: ["general chemistry"] },
  { slug: "chemistry-atoms-first-2e", title: "Chemistry: Atoms First 2e", subjects: ["science", "chemistry"], keywords: ["general chemistry"] },
  { slug: "organic-chemistry", title: "Organic Chemistry", subjects: ["science", "chemistry"], keywords: ["organic"] },
  { slug: "biology-2e", title: "Biology 2e", subjects: ["science", "biology"], keywords: ["cells", "genetics", "evolution"] },
  { slug: "concepts-of-biology", title: "Concepts of Biology", subjects: ["science", "biology"], keywords: ["nonmajors"] },
  { slug: "microbiology", title: "Microbiology", subjects: ["science", "biology", "health"], keywords: ["bacteria", "virus"] },
  { slug: "anatomy-and-physiology-2e", title: "Anatomy and Physiology 2e", subjects: ["science", "health", "biology"], keywords: ["nursing", "body"] },
  { slug: "psychology-2e", title: "Psychology 2e", subjects: ["social sciences", "psychology"], keywords: ["intro", "behavior"] },
  { slug: "introduction-sociology-3e", title: "Introduction to Sociology 3e", subjects: ["social sciences", "sociology"], keywords: ["society"] },
  { slug: "american-government-3e", title: "American Government 3e", subjects: ["social sciences", "political science", "government"], keywords: ["politics"] },
  { slug: "principles-economics-3e", title: "Principles of Economics 3e", subjects: ["business", "economics"], keywords: ["micro", "macro"] },
  { slug: "principles-microeconomics-3e", title: "Principles of Microeconomics 3e", subjects: ["business", "economics"], keywords: ["micro"] },
  { slug: "principles-macroeconomics-3e", title: "Principles of Macroeconomics 3e", subjects: ["business", "economics"], keywords: ["macro"] },
  { slug: "principles-accounting-volume-1-financial-accounting", title: "Principles of Accounting Volume 1: Financial Accounting", subjects: ["business", "accounting"], keywords: ["financial"] },
  { slug: "principles-accounting-volume-2-managerial-accounting", title: "Principles of Accounting Volume 2: Managerial Accounting", subjects: ["business", "accounting"], keywords: ["managerial"] },
  { slug: "principles-management", title: "Principles of Management", subjects: ["business", "management"], keywords: ["leadership"] },
  { slug: "introduction-business", title: "Introduction to Business", subjects: ["business"], keywords: ["intro"] },
  { slug: "business-law-i-essentials", title: "Business Law I Essentials", subjects: ["business", "law"], keywords: ["legal"] },
  { slug: "us-history", title: "U.S. History", subjects: ["humanities", "history"], keywords: ["american history"] },
  { slug: "world-history-volume-1", title: "World History Volume 1", subjects: ["humanities", "history"], keywords: ["ancient"] },
  { slug: "introduction-philosophy", title: "Introduction to Philosophy", subjects: ["humanities", "philosophy"], keywords: ["ethics", "logic"] },
  { slug: "college-success", title: "College Success", subjects: ["humanities", "student life"], keywords: ["study skills"] },
  { slug: "introduction-computer-science", title: "Introduction to Computer Science", subjects: ["computer science", "technology"], keywords: ["programming", "intro"] },
  { slug: "introduction-python-programming", title: "Introduction to Python Programming", subjects: ["computer science", "technology"], keywords: ["python", "programming", "coding"] },
  { slug: "workplace-software-and-skills", title: "Workplace Software and Skills", subjects: ["computer science", "technology", "business"], keywords: ["office"] },
  { slug: "nursing-pharmacology", title: "Nursing Pharmacology", subjects: ["health", "nursing"], keywords: ["drugs", "medication"] },
  { slug: "fundamentals-nursing", title: "Fundamentals of Nursing", subjects: ["health", "nursing"], keywords: ["clinical"] },
  { slug: "writing-guide", title: "Writing Guide with Handbook", subjects: ["humanities", "writing", "english"], keywords: ["composition", "essay"] },
];

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

const STOP = new Set(["the", "a", "an", "and", "of", "to", "for", "in", "intro", "introduction", "introductory", "edition", "ed", "textbook", "book", "free", "to"]);

/** The words of a query that carry meaning, so "the calculus book" matches on calculus. */
export function terms(text: string): string[] {
  return norm(text)
    .split(" ")
    .filter((w) => w && !STOP.has(w) && !/^\d+(e|st|nd|rd|th)?$/.test(w));
}

/** Score a book against a query. 0 means no match. */
export function scoreBook(book: CatalogBook, query: string): number {
  const words = terms(query);
  if (!words.length) return 0;
  const title = norm(book.title);
  const subjects = book.subjects.map(norm);
  const keywords = book.keywords.map(norm);
  let score = 0;
  for (const w of words) {
    if (title.split(" ").some((t) => t === w || (w.length > 3 && t.startsWith(w)))) score += 3;
    else if (subjects.some((s) => s === w || s.split(" ").includes(w))) score += 2;
    else if (keywords.some((k) => k.split(" ").includes(w))) score += 1;
  }
  return score;
}

/** Books that match a query, best first. A book has to match every word to be listed when the query has more than one. */
export function searchCatalog(query: string, limit = 5): CatalogBook[] {
  const words = terms(query);
  return OPENSTAX.map((book) => ({ book, score: scoreBook(book, query) }))
    .filter((r) => r.score > 0)
    .filter((r) => words.length < 3 || r.score >= words.length)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.book);
}

/** Books for a subject such as "calculus" or "science", matching the subject list first. */
export function booksBySubject(subject: string): CatalogBook[] {
  const words = terms(subject);
  if (!words.length) return [];
  const hits = OPENSTAX.filter((b) => {
    const pool = [...b.subjects, ...b.keywords, b.title].map(norm).join(" ").split(" ");
    return words.every((w) => pool.some((p) => p === w || (w.length > 3 && p.startsWith(w))));
  });
  return hits;
}

export function openstaxUrl(book: CatalogBook): string {
  return OPENSTAX_URL + book.slug;
}
