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
  { slug: "principles-finance", title: "Principles of Finance", subjects: ["business", "finance"], keywords: ["investing", "corporate finance", "valuation"] },
  { slug: "entrepreneurship", title: "Entrepreneurship", subjects: ["business", "entrepreneurship"], keywords: ["startup", "small business"] },
  { slug: "organizational-behavior", title: "Organizational Behavior", subjects: ["business", "management"], keywords: ["workplace", "teams", "leadership"] },
  { slug: "human-resource-management", title: "Human Resource Management", subjects: ["business", "management"], keywords: ["hr", "hiring", "personnel"] },
  { slug: "principles-marketing", title: "Principles of Marketing", subjects: ["business", "marketing"], keywords: ["advertising", "consumer"] },
  { slug: "business-ethics", title: "Business Ethics", subjects: ["business", "ethics"], keywords: ["corporate responsibility"] },
  { slug: "principles-data-science", title: "Principles of Data Science", subjects: ["computer science", "technology", "math"], keywords: ["data", "analytics", "machine learning"] },
  { slug: "introduction-intellectual-property", title: "Introduction to Intellectual Property", subjects: ["business", "law"], keywords: ["copyright", "patents", "trademarks"] },
  { slug: "introduction-political-science", title: "Introduction to Political Science", subjects: ["social sciences", "political science"], keywords: ["politics", "government"] },
  { slug: "introduction-anthropology", title: "Introduction to Anthropology", subjects: ["social sciences", "anthropology"], keywords: ["culture", "archaeology"] },
  { slug: "introduction-behavioral-neuroscience", title: "Introduction to Behavioral Neuroscience", subjects: ["science", "psychology", "biology"], keywords: ["brain", "neurons"] },
  { slug: "world-history-volume-2", title: "World History Volume 2", subjects: ["humanities", "history"], keywords: ["modern"] },
  { slug: "biology-ap-courses", title: "Biology for AP Courses", subjects: ["science", "biology"], keywords: ["high school", "advanced placement"] },
  { slug: "college-physics-ap-courses-2e", title: "College Physics for AP Courses 2e", subjects: ["science", "physics"], keywords: ["high school", "advanced placement"] },
  { slug: "medical-surgical-nursing", title: "Medical-Surgical Nursing", subjects: ["health", "nursing"], keywords: ["clinical"] },
  { slug: "clinical-nursing-skills", title: "Clinical Nursing Skills", subjects: ["health", "nursing"], keywords: ["clinical", "skills"] },
  { slug: "maternal-newborn-nursing", title: "Maternal-Newborn Nursing", subjects: ["health", "nursing"], keywords: ["obstetrics", "pregnancy"] },
  { slug: "psychiatric-mental-health-nursing", title: "Psychiatric-Mental Health Nursing", subjects: ["health", "nursing"], keywords: ["mental health"] },
  { slug: "population-health", title: "Population Health for Nurses", subjects: ["health", "nursing"], keywords: ["public health"] },
];

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

const STOP = new Set(["the", "a", "an", "and", "of", "to", "for", "in", "intro", "introduction", "introductory", "edition", "ed", "textbook", "book", "free", "to"]);

// Author and publisher names people put in a query. The catalog does not store them, so they
// must not count as words a book has to match.
const NAMES = new Set(["stewart", "larson", "thomas", "openstax", "pearson", "mcgraw", "wiley", "cengage"]);

/** The words of a query that carry meaning, so "the calculus book" matches on calculus. Author and publisher names are left out. */
export function terms(text: string): string[] {
  return norm(text)
    .split(" ")
    .filter((w) => w && !STOP.has(w) && !NAMES.has(w) &&!/^\d+(e|st|nd|rd|th)?$/.test(w));
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

const bigrams = (text: string): Set<string> => {
  const t = norm(text).replace(/ /g, "");
  const out = new Set<string>();
  for (let i = 0; i < t.length - 1; i++) out.add(t.slice(i, i + 2));
  return out;
};

/** The closest catalog titles to a query, even when no word matches. Word matches rank first, then spelling likeness. */
export function nearestCatalog(query: string, limit = 3): CatalogBook[] {
  const q = bigrams(query);
  const likeness = (book: CatalogBook): number => {
    const b = bigrams(book.title);
    let shared = 0;
    for (const g of q) if (b.has(g)) shared++;
    return q.size + b.size ? (2 * shared) / (q.size + b.size) : 0;
  };
  return OPENSTAX.map((book) => ({ book, score: scoreBook(book, query) + likeness(book) }))
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
