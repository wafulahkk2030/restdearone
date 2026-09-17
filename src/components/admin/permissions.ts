/**
 * Role-based access control for the admin dashboard.
 *
 * Each role gets an explicit allow-list of sections / subtabs it may VIEW,
 * plus a list of sections it may WRITE to (approve, edit, delete, create).
 * Anything not listed is hidden entirely.
 *
 * Keys are either a section key ("moderation") or "section.subtab"
 * ("users.roles"). "*" means everything.
 */

export type AdminRole =
  | "super_admin"
  | "platform_admin"
  | "community_moderator"
  | "memorial_moderator"
  | "support_admin";

interface RolePolicy {
  label: string;
  summary: string;
  /** Viewable keys, or "*" for all. */
  view: string[] | "*";
  /** Explicitly hidden keys (applied after view). */
  deny?: string[];
  /** Writable keys, or "*" for all. */
  write: string[] | "*";
}

export const ROLE_POLICIES: Record<AdminRole, RolePolicy> = {
  super_admin: {
    label: "Super Admin",
    summary: "Full control of the platform, including granting and revoking admin roles.",
    view: "*",
    write: "*",
  },
  platform_admin: {
    label: "Platform Admin",
    summary: "Runs the whole platform except admin role assignment, which only the Super Admin controls.",
    view: "*",
    deny: ["users.roles"],
    write: "*",
  },
  community_moderator: {
    label: "Community Moderator",
    summary: "Moderates communities, forums and chats. No access to users, money or settings.",
    view: [
      "dashboard.executive",
      "moderation.reports",
      "moderation.flags",
      "moderation.forum_posts",
      "moderation.forum_comments",
      "moderation.chats",
      "communities",
    ],
    write: ["moderation", "communities"],
  },
  memorial_moderator: {
    label: "Memorial Moderator",
    summary: "Moderates memorial pages, stories, photos and family verifications only.",
    view: [
      "dashboard.executive",
      "moderation.stories_mod",
      "moderation.reports",
      "moderation.flags",
      "moderation.story_comments",
      "moderation.photos",
      "moderation.embeds",
      "memorials",
    ],
    write: ["moderation", "memorials"],
  },
  support_admin: {
    label: "Support Admin",
    summary: "Handles enquiries and announcements. Sees user contact details but cannot change accounts.",
    view: [
      "dashboard.executive",
      "users.directory",
      "users.profiles",
      "support",
      "campaigns",
    ],
    write: ["support", "campaigns"],
  },
};

const matches = (list: string[], sectionKey: string, subKey?: string) =>
  list.some((entry) => entry === sectionKey || (subKey ? entry === `${sectionKey}.${subKey}` : entry.startsWith(`${sectionKey}.`)));

export const getPolicy = (role: string | null): RolePolicy | null =>
  role && role in ROLE_POLICIES ? ROLE_POLICIES[role as AdminRole] : null;

export const canView = (role: string | null, sectionKey: string, subKey?: string) => {
  const policy = getPolicy(role);
  if (!policy) return false;
  if (policy.deny && matches(policy.deny, sectionKey, subKey)) return false;
  if (policy.view === "*") return true;
  return matches(policy.view, sectionKey, subKey);
};

export const canWrite = (role: string | null, sectionKey: string, subKey?: string) => {
  const policy = getPolicy(role);
  if (!policy) return false;
  if (!canView(role, sectionKey, subKey)) return false;
  if (policy.write === "*") return true;
  return matches(policy.write, sectionKey, subKey);
};

export const roleLabel = (role: string | null) => getPolicy(role)?.label ?? "Admin";
export const roleSummary = (role: string | null) => getPolicy(role)?.summary ?? "";
