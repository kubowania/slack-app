/**
 * Search Results Page — Server Component
 *
 * Next.js App Router page for the /search route within the (workspace)
 * route group. Reads the URL search parameters (q for query, type for
 * filter) and delegates all search UI rendering — query input, filter
 * tabs, result cards, loading/empty states — to the SearchResults
 * client component.
 *
 * URL: /search?q=<query>&type=<messages|files|channels|people>
 */

import SearchResults from "@/app/components/SearchResults";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const params = await searchParams;
  return <SearchResults initialQuery={params.q || ""} />;
}
