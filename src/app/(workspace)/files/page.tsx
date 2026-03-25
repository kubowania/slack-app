/**
 * File Browser Page
 *
 * Renders the FileBrowser component which displays all files shared across
 * the workspace with metadata (type, size, uploader, channel, date).
 *
 * URL: /(workspace)/files
 */

import FileBrowser from "@/app/components/FileBrowser";

export default function FilesPage() {
  return <FileBrowser />;
}
