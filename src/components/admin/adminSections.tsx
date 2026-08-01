import { ReactNode } from "react";
import {
  BarChart3, Users, Flag, HeartHandshake, MessageSquare, HandCoins,
  CreditCard, FileText, Megaphone, LifeBuoy, Settings,
} from "lucide-react";
import AdminOverviewLive from "./AdminOverviewLive";
import AdminAnalytics from "./AdminAnalytics";
import AdminKillSwitches from "./AdminKillSwitches";
import AdminUsers from "./AdminUsers";
import AdminUserDetails from "./AdminUserDetails";
import AdminStoriesMod from "./AdminStoriesMod";
import AdminPayments from "./AdminPayments";
import AdminFundraisers from "./AdminFundraisers";
import AdminNationalLegends from "./AdminNationalLegends";
import AdminLegendArticles from "./AdminLegendArticles";
import AdminNewsletter from "./AdminNewsletter";
import AdminContacted from "./AdminContacted";
import AdminCommunities from "./AdminCommunities";
import AdminRoles from "./AdminRoles";
import AdminBroadcast from "./AdminBroadcast";
import AdminTablePanel, { AdminTablePanelProps } from "./AdminTablePanel";

export interface SectionCtx {
  userId: string;
  adminRole: string | null;
}

export interface SubTab {
  key: string;
  label: string;
  render: (ctx: SectionCtx) => ReactNode;
}

export interface Section {
  key: string;
  label: string;
  icon: any;
  subtabs: SubTab[];
}

/** Renders a live, data-backed table for a real database table. */
const t = (props: AdminTablePanelProps): SubTab["render"] => () => <AdminTablePanel {...props} />;

const created = { key: "created_at", label: "Created", type: "date" as const };

export const adminSections: Section[] = [
  {
    key: "dashboard", label: "Dashboard & Analytics", icon: BarChart3,
    subtabs: [
      { key: "executive", label: "Executive Dashboard", render: () => <AdminOverviewLive /> },
      { key: "live", label: "Platform Analytics", render: () => <AdminAnalytics /> },
      {
        key: "activity", label: "Admin Activity Log",
        render: t({
          table: "admin_activity_logs",
          title: "Admin activity log",
          description: "Every administrative action taken on the platform.",
          columns: [
            { key: "action", label: "Action" },
            { key: "target_type", label: "Target" },
            { key: "target_id", label: "Target ID" },
            { key: "details", label: "Details", type: "json" },
            created,
          ],
          searchColumns: ["action", "target_type"],
        }),
      },
      {
        key: "security_events", label: "Security Events",
        render: t({
          table: "security_events",
          title: "Security events",
          columns: [
            { key: "event_type", label: "Event" },
            { key: "severity", label: "Severity" },
            { key: "source", label: "Source" },
            { key: "details", label: "Details", type: "json" },
            created,
          ],
          searchColumns: ["event_type", "severity", "source"],
        }),
      },
    ],
  },
  {
    key: "users", label: "User Management", icon: Users,
    subtabs: [
      { key: "directory", label: "User Directory", render: ({ userId, adminRole }) => <AdminUsers userId={userId} adminRole={adminRole} /> },
      { key: "auth_users", label: "Accounts, Bans & Passwords", render: () => <AdminUserDetails /> },
      { key: "roles", label: "Roles & Permissions", render: () => <AdminRoles /> },
      {
        key: "profiles", label: "Profiles",
        render: t({
          table: "profiles",
          columns: [
            { key: "display_name", label: "Name" },
            { key: "username", label: "Username" },
            { key: "email", label: "Email" },
            { key: "country", label: "Country" },
            { key: "city", label: "City" },
            { key: "last_login", label: "Last login", type: "date" },
            created,
          ],
          searchColumns: ["display_name", "username", "email"],
        }),
      },
      {
        key: "warnings", label: "Warnings",
        render: t({
          table: "user_warnings",
          columns: [
            { key: "user_id", label: "User" },
            { key: "warning_reason", label: "Reason" },
            created,
          ],
          searchColumns: ["warning_reason"],
          allowDelete: true,
        }),
      },
      {
        key: "suspensions", label: "Suspensions",
        render: t({
          table: "user_suspensions",
          columns: [
            { key: "user_id", label: "User" },
            { key: "suspension_type", label: "Type" },
            { key: "reason", label: "Reason" },
            { key: "suspension_end_date", label: "Ends", type: "date" },
            created,
          ],
          searchColumns: ["reason"],
          allowDelete: true,
        }),
      },
    ],
  },
  {
    key: "moderation", label: "Moderation", icon: Flag,
    subtabs: [
      { key: "stories_mod", label: "Stories", render: () => <AdminStoriesMod /> },
      {
        key: "reports", label: "Reports",
        render: t({
          table: "reports",
          title: "User reports",
          columns: [
            { key: "content_type", label: "Type" },
            { key: "content_id", label: "Content ID" },
            { key: "reason", label: "Reason" },
            { key: "status", label: "Status" },
            created,
          ],
          searchColumns: ["content_type", "reason"],
          statusAction: {
            column: "status",
            options: [
              { value: "under_review", label: "Review" },
              { value: "resolved", label: "Resolve" },
              { value: "dismissed", label: "Dismiss", variant: "destructive" },
            ],
          },
        }),
      },
      {
        key: "flags", label: "Content Flags",
        render: t({
          table: "content_flags",
          columns: [
            { key: "content_type", label: "Type" },
            { key: "flag_reason", label: "Reason" },
            { key: "reviewed", label: "Reviewed", type: "bool" },
            created,
          ],
          searchColumns: ["content_type", "flag_reason"],
          statusAction: { column: "reviewed", options: [{ value: true, label: "Mark reviewed" }] },
          allowDelete: true,
        }),
      },
      {
        key: "story_comments", label: "Story Comments",
        render: t({
          table: "story_comments",
          columns: [
            { key: "comment", label: "Comment" },
            { key: "author_id", label: "Author" },
            { key: "story_id", label: "Story" },
            created,
          ],
          searchColumns: ["comment"],
          allowDelete: true,
        }),
      },
      {
        key: "forum_posts", label: "Forum Posts",
        render: t({
          table: "forum_posts",
          columns: [
            { key: "title", label: "Title" },
            { key: "category", label: "Category" },
            { key: "content", label: "Content" },
            created,
          ],
          searchColumns: ["title", "content"],
          allowDelete: true,
        }),
      },
      {
        key: "forum_comments", label: "Forum Comments",
        render: t({
          table: "forum_comments",
          columns: [
            { key: "comment", label: "Comment" },
            { key: "author_id", label: "Author" },
            created,
          ],
          searchColumns: ["comment"],
          allowDelete: true,
        }),
      },
      {
        key: "chats", label: "Chat Messages",
        render: t({
          table: "chat_messages",
          description: "Flagged and recent in-app messages.",
          columns: [
            { key: "message", label: "Message" },
            { key: "sender_id", label: "Sender" },
            { key: "is_flagged", label: "Flagged", type: "bool" },
            created,
          ],
          searchColumns: ["message"],
          allowDelete: true,
        }),
      },
      {
        key: "photos", label: "Memorial Photos",
        render: t({
          table: "memorial_photos",
          columns: [
            { key: "photo_url", label: "Photo", type: "image" },
            { key: "caption", label: "Caption" },
            { key: "memorial_id", label: "Memorial" },
            created,
          ],
          searchColumns: ["caption"],
          allowDelete: true,
        }),
      },
      {
        key: "embeds", label: "Media Embeds",
        render: t({
          table: "media_embeds",
          columns: [
            { key: "title", label: "Title" },
            { key: "embed_url", label: "URL" },
            { key: "embed_type", label: "Type" },
            created,
          ],
          searchColumns: ["title", "embed_url"],
          allowDelete: true,
        }),
      },
    ],
  },
  {
    key: "memorials", label: "Memorials", icon: HeartHandshake,
    subtabs: [
      {
        key: "pages", label: "Memorial Pages",
        render: t({
          table: "memorial_pages",
          columns: [
            { key: "full_name", label: "Name" },
            { key: "birth_year", label: "Born" },
            { key: "death_year", label: "Died" },
            { key: "status", label: "Status" },
            { key: "activation_expiry", label: "Expires", type: "date" },
            created,
          ],
          searchColumns: ["full_name"],
          statusAction: {
            column: "status",
            options: [
              { value: "active", label: "Activate" },
              { value: "inactive", label: "Deactivate", variant: "destructive" },
            ],
          },
        }),
      },
      {
        key: "verifications", label: "Family Verifications",
        render: t({
          table: "family_verifications",
          columns: [
            { key: "relationship", label: "Relationship" },
            { key: "evidence_text", label: "Evidence" },
            { key: "status", label: "Status" },
            created,
          ],
          searchColumns: ["relationship", "evidence_text"],
          statusAction: {
            column: "status",
            options: [
              { value: "approved", label: "Approve" },
              { value: "rejected", label: "Reject", variant: "destructive" },
            ],
          },
        }),
      },
      {
        key: "service", label: "Service Details",
        render: t({
          table: "memorial_service_info",
          orderBy: { column: "created_at", ascending: false },
          columns: [
            { key: "venue_name", label: "Venue" },
            { key: "service_date", label: "Date" },
            { key: "service_time", label: "Time" },
            { key: "venue_address", label: "Address" },
          ],
          searchColumns: ["venue_name", "venue_address"],
          allowDelete: true,
        }),
      },
      {
        key: "journey", label: "Journey Timeline Events",
        render: t({
          table: "memorial_journey_events",
          columns: [
            { key: "year", label: "Year" },
            { key: "title", label: "Title" },
            { key: "description", label: "Description" },
          ],
          searchColumns: ["title", "description"],
          allowDelete: true,
        }),
      },
      {
        key: "followers", label: "Followers",
        render: t({
          table: "memorial_followers",
          orderBy: { column: "followed_at", ascending: false },
          columns: [
            { key: "memorial_id", label: "Memorial" },
            { key: "user_id", label: "User" },
            { key: "followed_at", label: "Followed", type: "date" },
          ],
        }),
      },
    ],
  },
  {
    key: "communities", label: "Communities", icon: MessageSquare,
    subtabs: [
      { key: "overview", label: "Community Overview", render: ({ userId, adminRole }) => <AdminCommunities userId={userId} adminRole={adminRole} /> },
      {
        key: "groups", label: "All Groups",
        render: t({
          table: "community_groups",
          columns: [
            { key: "name", label: "Name" },
            { key: "category", label: "Category" },
            { key: "member_count", label: "Members" },
            { key: "story_count", label: "Stories" },
            { key: "is_active", label: "Active", type: "bool" },
            created,
          ],
          searchColumns: ["name", "category"],
          statusAction: {
            column: "is_active",
            options: [
              { value: true, label: "Enable" },
              { value: false, label: "Disable", variant: "destructive" },
            ],
          },
        }),
      },
      {
        key: "members", label: "Members",
        render: t({
          table: "community_members",
          orderBy: { column: "joined_at", ascending: false },
          columns: [
            { key: "community_id", label: "Community" },
            { key: "user_id", label: "User" },
            { key: "role", label: "Role" },
            { key: "status", label: "Status" },
            { key: "stories_posted", label: "Stories" },
            { key: "joined_at", label: "Joined", type: "date" },
          ],
          allowDelete: true,
        }),
      },
      {
        key: "cstories", label: "Community Stories",
        render: t({
          table: "community_stories",
          columns: [
            { key: "title", label: "Title" },
            { key: "story_type", label: "Type" },
            { key: "content", label: "Content" },
            created,
          ],
          searchColumns: ["title", "content"],
          allowDelete: true,
        }),
      },
    ],
  },
  {
    key: "fundraising", label: "Fundraising", icon: HandCoins,
    subtabs: [
      { key: "campaigns", label: "Campaign Approvals", render: ({ userId }) => <AdminFundraisers userId={userId} /> },
      {
        key: "contributions", label: "Contributions",
        render: t({
          table: "contributions",
          columns: [
            { key: "donor_name", label: "Donor" },
            { key: "gross_amount", label: "Gross", type: "money" },
            { key: "platform_fee", label: "Fee", type: "money" },
            { key: "net_amount", label: "Net", type: "money" },
            { key: "payment_status", label: "Status" },
            { key: "payment_reference", label: "Reference" },
            created,
          ],
          searchColumns: ["donor_name", "payment_reference"],
        }),
      },
      {
        key: "payouts", label: "Payout Accounts",
        render: t({
          table: "fundraiser_payouts",
          columns: [
            { key: "fundraiser_id", label: "Fundraiser" },
            { key: "payout_method", label: "Method" },
            { key: "payout_account", label: "Account" },
            created,
          ],
          searchColumns: ["payout_method", "payout_account"],
        }),
      },
      {
        key: "clicks", label: "Link Clicks",
        render: t({
          table: "fundraiser_link_clicks",
          orderBy: { column: "clicked_at", ascending: false },
          columns: [
            { key: "fundraiser_id", label: "Fundraiser" },
            { key: "referrer", label: "Referrer" },
            { key: "clicked_at", label: "Clicked", type: "date" },
          ],
        }),
      },
    ],
  },
  {
    key: "finance", label: "Payments & Finance", icon: CreditCard,
    subtabs: [
      { key: "payments", label: "Payment Transactions", render: () => <AdminPayments /> },
      {
        key: "community_payments", label: "Community Payments",
        render: t({
          table: "community_payments",
          columns: [
            { key: "community_id", label: "Community" },
            { key: "amount", label: "Amount", type: "money" },
            { key: "billing_cycle", label: "Cycle" },
            { key: "status", label: "Status" },
            { key: "expires_at", label: "Expires", type: "date" },
            created,
          ],
          searchColumns: ["payment_reference", "status"],
        }),
      },
      {
        key: "tributes", label: "Flower Tributes",
        render: t({
          table: "flower_tributes",
          columns: [
            { key: "sender_name", label: "Sender" },
            { key: "flower_type", label: "Flower" },
            { key: "tribute_value", label: "Value", type: "money" },
            { key: "status", label: "Status" },
            created,
          ],
          searchColumns: ["sender_name", "flower_type"],
        }),
      },
      {
        key: "legend_contributions", label: "Legend Contributions",
        render: t({
          table: "legend_contributions",
          columns: [
            { key: "contributor_name", label: "Contributor" },
            { key: "contribution_type", label: "Type" },
            { key: "amount", label: "Amount", type: "money" },
            { key: "status", label: "Status" },
            created,
          ],
          searchColumns: ["contributor_name", "payment_reference"],
        }),
      },
    ],
  },
  {
    key: "cms", label: "Content Management", icon: FileText,
    subtabs: [
      { key: "legends", label: "National Legends", render: () => <AdminNationalLegends /> },
      { key: "legend_articles", label: "Legend Articles", render: () => <AdminLegendArticles /> },
      {
        key: "prompts", label: "Reflection Prompts",
        render: t({
          table: "memory_prompts",
          title: "Reflection prompts",
          description: "Prompts shown across the platform to invite new memories.",
          columns: [
            { key: "prompt_text", label: "Prompt" },
            created,
          ],
          searchColumns: ["prompt_text"],
          createFields: [{ key: "prompt_text", label: "Prompt text", type: "textarea", required: true }],
          allowDelete: true,
        }),
      },
      {
        key: "invites", label: "Invites",
        render: t({
          table: "invites",
          columns: [
            { key: "code", label: "Code" },
            { key: "uses", label: "Uses" },
            created,
          ],
          searchColumns: ["code"],
          allowDelete: true,
        }),
      },
    ],
  },
  {
    key: "campaigns", label: "Notifications & Campaigns", icon: Megaphone,
    subtabs: [
      { key: "broadcast", label: "Send Announcement", render: () => <AdminBroadcast /> },
      {
        key: "log", label: "Notification Log",
        render: t({
          table: "notifications",
          columns: [
            { key: "message", label: "Message" },
            { key: "user_id", label: "User" },
            { key: "read", label: "Read", type: "bool" },
            created,
          ],
          searchColumns: ["message"],
          allowDelete: true,
        }),
      },
      { key: "newsletter", label: "Newsletter Subscribers", render: () => <AdminNewsletter /> },
    ],
  },
  {
    key: "support", label: "Customer Support", icon: LifeBuoy,
    subtabs: [
      { key: "contacted", label: "Contact Submissions", render: () => <AdminContacted /> },
    ],
  },
  {
    key: "settings", label: "Platform Settings", icon: Settings,
    subtabs: [
      { key: "kill", label: "Kill Switches & Maintenance", render: () => <AdminKillSwitches /> },
    ],
  },
];