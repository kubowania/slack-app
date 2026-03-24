/**
 * Channel Browser Page
 *
 * Renders the ChannelBrowser component which displays a browsable, filterable
 * list of all workspace channels with descriptions, member counts, and join
 * actions.
 *
 * URL: /(workspace)/channels/browse
 */

import ChannelBrowser from "@/app/components/ChannelBrowser";

export default function ChannelBrowsePage() {
  return <ChannelBrowser />;
}
