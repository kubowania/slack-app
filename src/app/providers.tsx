"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";

import type { User, Channel, Workspace } from "@/lib/types";

// =============================================================================
// Context Value Interface
// =============================================================================

/**
 * Shape of the workspace context value provided to all child components.
 *
 * - currentUser / setCurrentUser: The currently selected user (no auth — user
 *   is chosen via a dropdown in the Sidebar component). Starts as null until
 *   the users list is fetched, then defaults to the first user.
 * - users: Full list of workspace users fetched from /api/users on mount.
 * - channels: Full list of workspace channels fetched from /api/channels on mount.
 * - workspace: Workspace metadata fetched from /api/workspace on mount. Falls
 *   back to a sensible default if the endpoint is unavailable.
 */
interface WorkspaceContextValue {
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  users: User[];
  channels: Channel[];
  /** Exposes the channels state setter so consumers (e.g., workspace layout)
   *  can append newly created channels without a full refetch. */
  setChannels: Dispatch<SetStateAction<Channel[]>>;
  workspace: Workspace | null;
}

// =============================================================================
// Context Creation
// =============================================================================

/**
 * React Context that holds the workspace-level state.
 *
 * Initialized as `null` — consumers must use the `useWorkspace` hook which
 * throws a descriptive error when the context is missing (i.e. the component
 * is rendered outside of <WorkspaceProvider>).
 */
export const WorkspaceContext = createContext<WorkspaceContextValue | null>(
  null
);

// =============================================================================
// WorkspaceProvider Component
// =============================================================================

/**
 * Client-side context provider that wraps all workspace child routes.
 *
 * This component exists because `src/app/layout.tsx` is a Server Component and
 * cannot contain client-side state hooks. The WorkspaceProvider acts as the
 * client boundary that the root layout's `<body>` wraps around `{children}`.
 *
 * On mount it fetches:
 *   1. /api/users   → populates `users` and sets `currentUser` to the first user
 *   2. /api/channels → populates `channels`
 *   3. /api/workspace → populates `workspace` (with fallback on failure)
 *
 * All fetch calls include error handling — failures are silently caught so the
 * UI degrades gracefully (empty lists or fallback workspace metadata) rather
 * than crashing the entire application.
 */
function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);

  useEffect(() => {
    // ── Fetch all workspace users ────────────────────────────────────────
    fetch("/api/users")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Users fetch failed with status ${response.status}`);
        }
        return response.json();
      })
      .then((data: User[]) => {
        setUsers(data);
        // Auto-select the first user when no user has been chosen yet.
        // This replicates the behavior from the original page.tsx (line 43-44).
        if (data.length > 0 && !currentUser) {
          setCurrentUser(data[0]);
        }
      })
      .catch(() => {
        // Silently handle — UI will show an empty user list
      });

    // ── Fetch all workspace channels ─────────────────────────────────────
    fetch("/api/channels")
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Channels fetch failed with status ${response.status}`
          );
        }
        return response.json();
      })
      .then((data: Channel[]) => {
        setChannels(data);
      })
      .catch(() => {
        // Silently handle — UI will show an empty channel list
      });

    // ── Fetch workspace metadata ─────────────────────────────────────────
    // The /api/workspace endpoint may not exist yet during incremental
    // development. When it fails, we fall back to sensible default metadata
    // so the sidebar header and workspace-dependent UI still render.
    fetch("/api/workspace")
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Workspace fetch failed with status ${response.status}`
          );
        }
        return response.json();
      })
      .then((data: Workspace) => {
        setWorkspace(data);
      })
      .catch(() => {
        setWorkspace({
          id: 1,
          name: "Slack Clone",
          member_count: 0,
          plan: "free",
          created_at: "",
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const contextValue: WorkspaceContextValue = {
    currentUser,
    setCurrentUser,
    users,
    channels,
    setChannels,
    workspace,
  };

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  );
}

// =============================================================================
// useWorkspace Hook
// =============================================================================

/**
 * Custom hook for consuming the workspace context.
 *
 * Returns the full WorkspaceContextValue object containing:
 *   - currentUser / setCurrentUser
 *   - users
 *   - channels
 *   - workspace
 *
 * @throws {Error} When called outside of a <WorkspaceProvider> — this is a
 *   developer-facing error to catch incorrect component tree composition.
 */
export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}

// =============================================================================
// Default Export
// =============================================================================

export default WorkspaceProvider;
