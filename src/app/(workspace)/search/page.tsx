/**
 * Search Results Page — Server Component
 *
 * Renders the SearchResults component with the initial query extracted from
 * the URL search parameters. The SearchResults component handles all client-side
 * search interaction, filtering, and result display.
 *
 * URL: /(workspace)/search?q=<query>
 */

import SearchResults from "@/app/components/SearchResults";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  return <SearchResults initialQuery={q ?? ""} />;
}
