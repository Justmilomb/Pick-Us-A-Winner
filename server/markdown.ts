import { readFileSync, readdirSync, writeFileSync, existsSync } from "fs";
import { join, resolve } from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkHtml from "remark-html";
import remarkGfm from "remark-gfm";
import readingTime from "reading-time";

// process.cwd() works in both ESM and CJS — never use import.meta.url
// in files bundled by esbuild to CommonJS format
const CONTENT_DIR = resolve(process.cwd(), "content/articles");
const INDEX_FILE = resolve(process.cwd(), "content/articles.json");

/**
 * Frontmatter schema for articles
 */
export interface ArticleFrontmatter {
  title: string;
  slug: string;
  description: string;
  keywords: string;
  publishDate: string;
  lastModified: string;
  category: "Reviews" | "How-To" | "Guides" | "Comparisons";
  schemaType: "Article" | "Review" | "HowTo";
  readingTime?: string;
  relatedArticles?: string[]; // Array of slugs
}

/**
 * Parsed article with metadata and content
 */
export interface Article extends ArticleFrontmatter {
  content: string; // Markdown content
  html: string; // Rendered HTML
  readingTime: string; // Auto-calculated
}

/**
 * Article listing (without content)
 */
export interface ArticleListing extends ArticleFrontmatter {
  readingTime: string;
}

/**
 * Parse a markdown file and convert to HTML
 */
export async function parseMarkdownFile(filePath: string): Promise<Article> {
  const fileContent = readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);

  // Calculate reading time
  const stats = readingTime(content);
  const readingTimeStr = data.readingTime || stats.text;

  // Convert markdown to HTML
  const processedContent = await remark()
    .use(remarkGfm)
    .use(remarkHtml, { sanitize: false })
    .process(content);

  const html = processedContent.toString();

  return {
    ...(data as ArticleFrontmatter),
    content,
    html,
    readingTime: readingTimeStr,
  };
}

/**
 * Get article by slug
 */
export async function getArticleBySlug(
  slug: string
): Promise<Article | null> {
  try {
    const filePath = join(CONTENT_DIR, `${slug}.md`);
    if (!existsSync(filePath)) {
      return null;
    }
    return await parseMarkdownFile(filePath);
  } catch (error) {
    console.error(`Error loading article ${slug}:`, error);
    return null;
  }
}

/**
 * Get all articles with metadata (no content)
 */
export async function getAllArticles(): Promise<ArticleListing[]> {
  try {
    // Try to load from index file first
    if (existsSync(INDEX_FILE)) {
      const index = JSON.parse(readFileSync(INDEX_FILE, "utf-8"));
      return index.articles;
    }

    // Fallback: scan directory
    return await scanArticlesDirectory();
  } catch (error) {
    console.error("Error loading articles:", error);
    return [];
  }
}

/**
 * Scan articles directory and return metadata
 */
async function scanArticlesDirectory(): Promise<ArticleListing[]> {
  if (!existsSync(CONTENT_DIR)) {
    return [];
  }

  const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));
  const articles: ArticleListing[] = [];

  for (const file of files) {
    try {
      const filePath = join(CONTENT_DIR, file);
      const fileContent = readFileSync(filePath, "utf-8");
      const { data, content } = matter(fileContent);
      const stats = readingTime(content);

      articles.push({
        ...(data as ArticleFrontmatter),
        readingTime: data.readingTime || stats.text,
      });
    } catch (error) {
      console.error(`Error parsing ${file}:`, error);
    }
  }

  // Sort by publish date (newest first)
  articles.sort(
    (a, b) =>
      new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
  );

  return articles;
}

/**
 * Generate article index (build-time)
 */
export async function generateArticleIndex(): Promise<void> {
  console.log("Generating article index...");

  if (!existsSync(CONTENT_DIR)) {
    console.log("No articles directory found, skipping index generation");
    return;
  }

  const articles = await scanArticlesDirectory();

  const index = {
    generatedAt: new Date().toISOString(),
    count: articles.length,
    articles,
  };

  writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
  console.log(`Generated index with ${articles.length} articles`);
}

/**
 * Get articles by category
 */
export async function getArticlesByCategory(
  category: string
): Promise<ArticleListing[]> {
  const all = await getAllArticles();
  return all.filter(
    (a) => a.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Get related articles by keywords
 */
export async function getRelatedArticles(
  slug: string,
  limit: number = 3
): Promise<ArticleListing[]> {
  const article = await getArticleBySlug(slug);
  if (!article) return [];

  const all = await getAllArticles();

  // Filter out current article
  const others = all.filter((a) => a.slug !== slug);

  // If article has explicit relatedArticles, use those
  if (article.relatedArticles && article.relatedArticles.length > 0) {
    return others
      .filter((a) => article.relatedArticles!.includes(a.slug))
      .slice(0, limit);
  }

  // Otherwise, match by category and keywords
  const articleKeywords = article.keywords.toLowerCase().split(",");

  const scored = others.map((a) => {
    let score = 0;

    // Same category = +10 points
    if (a.category === article.category) score += 10;

    // Keyword overlap = +5 points per matching keyword
    const otherKeywords = a.keywords.toLowerCase().split(",");
    for (const kw of articleKeywords) {
      if (otherKeywords.some((ok) => ok.trim().includes(kw.trim()))) {
        score += 5;
      }
    }

    return { article: a, score };
  });

  // Sort by score and return top N
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.article);
}
