import { redirect } from "next/navigation";

/**
 * Root page component — redirects to the default workspace channel view.
 *
 * The original monolithic SlackClone component (248 lines) has been decomposed:
 * - Interfaces (User, Channel, Message) → src/lib/types.ts
 * - Sidebar UI → src/app/components/Sidebar.tsx
 * - Channel header → src/app/components/ChannelHeader.tsx
 * - Message rendering → src/app/components/MessageBubble.tsx
 * - Message input → src/app/components/MessageInput.tsx
 * - State management & data fetching → src/app/(workspace)/channel/[id]/page.tsx
 *
 * Visiting "/" now redirects to the "general" channel (ID 1) in the workspace
 * route group, preserving the original user flow.
 */
export default function Home() {
  redirect("/(workspace)/channel/1");
}
