/**
 * People Directory Page
 *
 * Renders the PeopleDirectory component which displays all workspace members
 * with names, titles, statuses, and availability indicators.
 *
 * URL: /(workspace)/people
 */

import PeopleDirectory from "@/app/components/PeopleDirectory";

export default function PeoplePage() {
  return <PeopleDirectory />;
}
