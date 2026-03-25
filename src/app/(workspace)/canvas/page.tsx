/**
 * Canvas / Notes Editor Page
 *
 * Renders the CanvasEditor visual mockup component inside a flex container
 * that fills the workspace layout's main content area. This is a purely
 * visual page with no backend API — all state (canvas title, content,
 * formatting toggles) is managed locally inside the CanvasEditor component.
 *
 * URL: /canvas (route group `(workspace)` adds no URL segment)
 */

import CanvasEditor from "@/app/components/CanvasEditor";

export default function CanvasPage() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <CanvasEditor />
    </div>
  );
}
