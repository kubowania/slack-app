/**
 * Canvas / Notes Editor Page
 *
 * Renders the CanvasEditor component which provides a visual mockup of the
 * Slack canvas/notes editor with toolbar and text area.
 *
 * URL: /(workspace)/canvas
 */

import CanvasEditor from "@/app/components/CanvasEditor";

export default function CanvasPage() {
  return <CanvasEditor />;
}
