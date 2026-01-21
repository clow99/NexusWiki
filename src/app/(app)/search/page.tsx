import Link from "next/link";
import { redirect } from "next/navigation";
import { type Page, Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { getActiveMembership } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createEmbedding, generateAnswer } from "@/lib/ai";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

type SearchResult = {
  page: Page;
  score: number;
};

async function runVectorSearch(query: string, organizationId: string) {
  const embedding = await createEmbedding(query);
  if (embedding.length === 0) {
    return { results: [] as SearchResult[], answer: "" };
  }

  const normalizedQuery = query.trim();
  const queryTokens = normalizedQuery
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.replace(/[^a-z0-9]/g, ""))
    .filter(Boolean);
  const stopwords = new Set([
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "but",
    "by",
    "for",
    "from",
    "has",
    "have",
    "how",
    "i",
    "in",
    "is",
    "it",
    "of",
    "on",
    "or",
    "that",
    "the",
    "this",
    "to",
    "was",
    "what",
    "when",
    "where",
    "who",
    "why",
    "with",
  ]);
  const keywordQuery = queryTokens.filter((token) => !stopwords.has(token)).join(" ");

  const vectorLiteral = `[${embedding.join(",")}]`;
  const minScore = 0.6;
  const maxDistance = 1 - minScore;
  const matches = await db.$queryRaw<{ pageId: string; score: number }[]>(
    Prisma.sql`
      SELECT "pageId", 1 - ("embedding" <=> ${vectorLiteral}::vector) AS score
      FROM "PageEmbedding"
      WHERE "organizationId" = ${organizationId}
        AND ("embedding" <=> ${vectorLiteral}::vector) <= ${maxDistance}
      ORDER BY "embedding" <=> ${vectorLiteral}::vector
      LIMIT 20
    `,
  );

  if (matches.length === 0) {
    const fallbackPages = await db.page.findMany({
      where: {
        organizationId,
        OR: [
          { title: { contains: normalizedQuery, mode: "insensitive" } },
          { content: { contains: normalizedQuery, mode: "insensitive" } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });

    const keywordPages =
      fallbackPages.length === 0 && keywordQuery.length > 1
        ? await db.page.findMany({
            where: {
              organizationId,
              OR: [
                { title: { contains: keywordQuery, mode: "insensitive" } },
                { content: { contains: keywordQuery, mode: "insensitive" } },
              ],
            },
            orderBy: { updatedAt: "desc" },
            take: 20,
          })
        : [];

    const effectiveFallbackPages = fallbackPages.length > 0 ? fallbackPages : keywordPages;

    if (effectiveFallbackPages.length === 0) {
      return { results: [] as SearchResult[], answer: "" };
    }

    const fallbackResults = effectiveFallbackPages.map((page) => ({ page, score: minScore }));
    const fallbackSources = fallbackResults.slice(0, 5).map((result) => ({
      title: result.page.title,
      content: result.page.content,
    }));
    const fallbackAnswer =
      fallbackSources.length > 0
        ? await generateAnswer({ query, sources: fallbackSources })
        : "";

    return {
      results: fallbackResults,
      answer: fallbackAnswer,
    };
  }

  const pages = await db.page.findMany({
    where: {
      organizationId,
      id: { in: matches.map((match) => match.pageId) },
    },
  });

  const pageMap = new Map(pages.map((page) => [page.id, page]));
  const results = matches
    .map((match) => {
      const page = pageMap.get(match.pageId);
      if (!page) {
        return null;
      }
      return { page, score: match.score };
    })
    .filter((value): value is SearchResult => value !== null);

  const answerSources = results.slice(0, 5).map((result) => ({
    title: result.page.title,
    content: result.page.content,
  }));

  const answer =
    answerSources.length > 0 ? await generateAnswer({ query, sources: answerSources }) : "";

  const lacksInfo =
    !answer ||
    answer.toLowerCase().includes("do not have enough information") ||
    answer.toLowerCase().includes("dont have enough information");

  if (lacksInfo && keywordQuery.length > 1) {
    const keywordPages = await db.page.findMany({
      where: {
        organizationId,
        OR: [
          { title: { contains: keywordQuery, mode: "insensitive" } },
          { content: { contains: keywordQuery, mode: "insensitive" } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });

    if (keywordPages.length > 0) {
      const existingIds = new Set(results.map((result) => result.page.id));
      const keywordResults = keywordPages
        .filter((page) => !existingIds.has(page.id))
        .map((page) => ({ page, score: minScore }));
      const combinedResults = [...results, ...keywordResults];
      const combinedSources = combinedResults.slice(0, 5).map((result) => ({
        title: result.page.title,
        content: result.page.content,
      }));
      const combinedAnswer =
        combinedSources.length > 0 ? await generateAnswer({ query, sources: combinedSources }) : "";

      return { results: combinedResults, answer: combinedAnswer };
    }
  }

  return { results, answer };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const membership = await getActiveMembership();
  if (!membership) {
    redirect("/orgs");
  }

  const resolvedParams = await searchParams;
  const query = resolvedParams.q?.trim() ?? "";
  const { results, answer } =
    query.length > 1
      ? await runVectorSearch(query, membership.organizationId)
      : { results: [], answer: "" };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
        <p className="text-sm text-muted-foreground">
          Search across page titles and content.
        </p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <form className="flex items-center gap-2">
            <Input name="q" defaultValue={query} placeholder="Search pages..." />
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>
      <div className="space-y-3">
        {query.length <= 1 && (
          <p className="text-sm text-muted-foreground">
            Enter at least 2 characters to search.
          </p>
        )}
        {query.length > 1 && answer && (
          <Card>
            <CardContent className="space-y-2 pt-6">
              <div className="text-sm font-medium">AI answer</div>
              <p className="text-sm text-muted-foreground">{answer}</p>
            </CardContent>
          </Card>
        )}
        {query.length > 1 && results.length === 0 && (
          <p className="text-sm text-muted-foreground">No results found.</p>
        )}
        {results.map((result) => (
          <Card key={result.page.id}>
            <CardContent className="flex items-center justify-between gap-4 pt-6">
              <div>
                <div className="text-sm font-medium">{result.page.title}</div>
                <div className="text-xs text-muted-foreground">
                  Updated {result.page.updatedAt.toLocaleDateString()}
                </div>
              </div>
              <Button asChild variant="secondary" size="sm">
                <Link href={`/spaces/${result.page.spaceId}/pages/${result.page.id}`}>
                  Open
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
