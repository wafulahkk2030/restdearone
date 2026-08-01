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

export interface SectionCtx {
  userId: string;
  adminRole: string | null;
}

const ph = (label: string, desc?: string): SubTab["render"] =>
  () => <PlaceholderPanel title={label} description={desc} />;

export const adminSections: Section[] = [
  {
    key: "dashboard", label: "Dashboard & Analytics", icon: BarChart3,
    subtabs: [
      { key: "executive", label: "Executive Dashboard", render: ({ userId }) => <AdminOverview stats={{ memorials: 0, stories: 0, users: 0, reports: 0, payments: 0, communities: 0 }} /> },
      { key: "live", label: "Live User Stats", render: () => <AdminAnalytics /> },
      { key: "reports_periodic", label: "Daily / Weekly / Monthly Reports", render: ph("Periodic Reports", "Auto-generated daily, weekly and monthly rollups of memorials, stories, tributes, and revenue.") },
      { key: "revenue", label: "Revenue Dashboard", render: () => <AdminAnalytics /> },
      { key: "growth", label: "User Growth Analytics", render: ph("User Growth") },
      { key: "geo", label: "Geographic Distribution", render: ph("Geographic Distribution", "Map of memorial creators and contributors by country/city.") },
      { key: "retention", label: "User Retention", render: ph("Retention Cohorts") },
      { key: "churn", label: "Churn Analysis", render: ph("Churn Analysis") },
      { key: "sessions", label: "Active Sessions", render: ph("Active Sessions Monitor") },
      { key: "activity_feed", label: "Real-time Activity Feed", render: ph("Real-time Activity") },
      { key: "health", label: "System Health", render: ph("System Health") },
      { key: "ai_insights", label: "AI Insights", render: ph("AI Insights Dashboard") },
      { key: "export", label: "Export Reports", render: ph("Export Reports", "CSV / PDF export of any dashboard.") },
    ],
  },
  {
    key: "users", label: "User Management", icon: Users,
    subtabs: [
      { key: "directory", label: "User Directory", render: ({ userId, adminRole }) => <AdminUsers userId={userId} adminRole={adminRole} /> },
      { key: "auth_users", label: "Auth Users (Detailed)", render: () => <AdminUserDetails /> },
      { key: "search", label: "Advanced Search", render: ph("Advanced Search") },
      { key: "create", label: "Create Account", render: ph("Account Creation") },
      { key: "edit", label: "Edit User Info", render: ph("Edit User") },
      { key: "suspend", label: "Suspend / Ban / Unban", render: ({ userId, adminRole }) => <AdminUsers userId={userId} adminRole={adminRole} /> },
      { key: "delete_restore", label: "Delete / Restore", render: ph("Delete & Restore Accounts") },
      { key: "reset_pw", label: "Reset Passwords", render: () => <AdminUserDetails /> },
      { key: "roles", label: "Manage Roles", render: ph("Roles Manager") },
      { key: "permissions", label: "Manage Permissions", render: ph("Permission Matrix") },
      { key: "login_history", label: "Login History", render: ph("Login History") },
      { key: "device_history", label: "Device History", render: ph("Device History") },
      { key: "sessions", label: "Sessions / Force Logout", render: () => <AdminUserDetails /> },
      { key: "email_verify", label: "Email Verification", render: ph("Email Verification Queue") },
      { key: "phone_verify", label: "Phone Verification", render: ph("Phone Verification") },
      { key: "notes", label: "User Notes & Tags", render: ph("User Notes & Tags") },
      { key: "merge", label: "Merge Duplicate Accounts", render: ph("Merge Duplicates") },
      { key: "appeals", label: "Account Appeals", render: ph("Account Appeals") },
      { key: "blocked", label: "Blocked Users", render: ph("Blocked Users") },
    ],
  },
  {
    key: "profile_mod", label: "Profile Moderation", icon: ShieldCheck,
    subtabs: [
      { key: "photo_approval", label: "Photo Approval", render: ph("Photo Approval Queue", "Review new memorial photos and profile avatars.") },
      { key: "video_approval", label: "Video Approval", render: ph("Video Approval") },
      { key: "bio_review", label: "Bio Review", render: ph("Bio Review") },
      { key: "username_review", label: "Username Review", render: ph("Username Review") },
      { key: "profile_edits", label: "Profile Edit Review", render: ph("Profile Edit Review") },
      { key: "identity_verify", label: "Identity Verification", render: ph("Identity Verification") },
      { key: "family_verify", label: "Family Verification", render: ph("Family Verification", "Approve/reject relative badges submitted on memorial pages.") },
      { key: "fake_detect", label: "Fake Profile Detection", render: ph("Fake Profile Detection") },
      { key: "duplicate_detect", label: "Duplicate Detection", render: ph("Duplicate Detection") },
      { key: "nsfw", label: "NSFW / AI Image Detection", render: ph("NSFW & AI Image Detection") },
      { key: "featured", label: "Featured Profiles", render: ph("Featured Profiles") },
      { key: "hidden", label: "Hidden Profiles", render: ph("Hidden Profiles") },
      { key: "restore", label: "Restore Removed Profiles", render: ph("Restore Removed") },
      { key: "manual_review", label: "Manual Profile Review", render: ph("Manual Review Queue") },
      { key: "badges", label: "Verification Badges", render: ph("Badge Management") },
    ],
  },
  {
    key: "reports", label: "Reports & Moderation", icon: Flag,
    subtabs: [
      { key: "stories_mod", label: "Stories Moderation", render: () => <AdminStoriesMod /> },
      { key: "abuse", label: "Abuse Reports", render: ph("Abuse Reports") },
      { key: "scam", label: "Scam Reports", render: ph("Scam Reports") },
      { key: "spam", label: "Spam Reports", render: ph("Spam Reports") },
      { key: "fake", label: "Fake Profile Reports", render: ph("Fake Profile Reports") },
      { key: "harass", label: "Harassment Reports", render: ph("Harassment Reports") },
      { key: "inappropriate", label: "Inappropriate Content", render: ph("Inappropriate Content") },
      { key: "reported_chats", label: "Reported Chats", render: ph("Reported Chats") },
      { key: "reported_media", label: "Reported Images / Videos", render: ph("Reported Media") },
      { key: "queue", label: "Moderator Queue", render: ph("Moderator Queue") },
      { key: "warnings", label: "Warnings & Restrictions", render: ph("Warnings & Restrictions") },
      { key: "shadow_ban", label: "Shadow Ban", render: ph("Shadow Ban") },
      { key: "perm_ban", label: "Permanent Ban", render: ph("Permanent Ban") },
      { key: "blacklists", label: "Device / Email / Phone / IP Blacklist", render: ph("Blacklists") },
      { key: "mod_notes", label: "Moderator Notes", render: ph("Moderator Notes") },
      { key: "appeal_mgmt", label: "Appeal Management", render: ph("Appeals") },
      { key: "resolution", label: "Resolution History", render: ph("Resolution History") },
    ],
  },
  {
    key: "comms", label: "Communication", icon: MessageSquare,
    subtabs: [
      { key: "messaging", label: "Messaging Management", render: ph("Messaging Management", "Search and manage in-app chats.") },
      { key: "delete_msgs", label: "Delete Messages", render: ph("Delete Messages") },
      { key: "disable_msg", label: "Disable Messaging (per user)", render: ph("Disable Messaging") },
      { key: "icebreakers", label: "Reflection Prompts / Icebreakers", render: ph("Reflection Prompts") },
      { key: "templates", label: "Chat Templates", render: ph("Chat Templates") },
      { key: "voice_mod", label: "Voice Message Moderation", render: ph("Voice Moderation") },
      { key: "read_receipts", label: "Read Receipts / Typing Settings", render: ph("Chat UX Settings") },
      { key: "announcements", label: "Announcement Broadcasts", render: ph("Announcements") },
      { key: "user_restrictions", label: "User-to-User Restrictions", render: ph("User Restrictions") },
    ],
  },
  {
    key: "business", label: "Business & Platform", icon: Briefcase,
    subtabs: [
      { key: "payments", label: "Payment Transactions", render: () => <AdminPayments /> },
      { key: "fundraisers", label: "Fundraisers", render: ({ userId }) => <AdminFundraisers userId={userId} /> },
      { key: "communities", label: "Communities", render: ({ userId, adminRole }) => <AdminCommunities userId={userId} adminRole={adminRole} /> },
      { key: "plans", label: "Subscription Plans", render: ph("Subscription Plans") },
      { key: "premium", label: "Premium Features", render: ph("Premium Features") },
      { key: "refunds", label: "Refund Management", render: ph("Refunds") },
      { key: "coupons", label: "Coupons & Discounts", render: ph("Coupons") },
      { key: "gift", label: "Gift Memberships / Share Packages", render: ph("Gift Memberships") },
      { key: "revenue_reports", label: "Revenue Reports", render: () => <AdminAnalytics /> },
      { key: "tax", label: "Tax Management", render: ph("Tax Management") },
      { key: "currency", label: "Currency / Regional Pricing", render: ph("Currency & Pricing") },
      { key: "featured_pricing", label: "Featured / Spotlight Pricing", render: ph("Featured Pricing") },
      { key: "referral", label: "Referral Program", render: ph("Referrals") },
      { key: "affiliate", label: "Affiliate & Commission", render: ph("Affiliate Program") },
      { key: "branding", label: "Platform Branding", render: ph("Branding") },
      { key: "landing", label: "Landing Page Management", render: ph("Landing Pages") },
      { key: "version", label: "App Version Control", render: ph("App Version") },
      { key: "maintenance", label: "Maintenance Mode", render: () => <AdminKillSwitches /> },
    ],
  },
  {
    key: "security", label: "Security & Access", icon: Lock,
    subtabs: [
      { key: "admins", label: "Admin Management", render: ph("Admin Management") },
      { key: "rbac", label: "Role-Based Access Control", render: ph("RBAC") },
      { key: "perm_matrix", label: "Permission Matrix", render: ph("Permission Matrix") },
      { key: "twofa", label: "Two-Factor Authentication", render: ph("2FA Enforcement") },
      { key: "sso", label: "Single Sign-On", render: ph("SSO Config") },
      { key: "password_policy", label: "Password Policies", render: ph("Password Policies") },
      { key: "sessions", label: "Session Management", render: ph("Sessions") },
      { key: "admin_sessions", label: "Active Admin Sessions", render: ph("Active Admin Sessions") },
      { key: "login_attempts", label: "Login Attempts", render: ph("Login Attempts") },
      { key: "failed_login", label: "Failed Login Monitoring", render: ph("Failed Login Monitor") },
      { key: "ip_wl", label: "IP Whitelisting", render: ph("IP Whitelist") },
      { key: "ip_bl", label: "IP Blacklisting", render: ph("IP Blacklist") },
      { key: "device_fp", label: "Device Fingerprinting", render: ph("Device Fingerprints") },
      { key: "geoblock", label: "Geo-blocking", render: ph("Geo-blocking") },
      { key: "rate_limit", label: "Rate Limiting", render: ph("Rate Limiting") },
      { key: "api_keys", label: "API Key Management", render: ph("API Keys") },
      { key: "alerts", label: "Security Alerts", render: ph("Security Alerts") },
      { key: "ids", label: "Intrusion Detection", render: ph("Intrusion Detection") },
      { key: "waf", label: "Web Application Firewall", render: ph("WAF") },
      { key: "audit", label: "Security Audit Logs", render: ph("Security Audit") },
    ],
  },
  {
    key: "billing", label: "Subscription & Billing", icon: CreditCard,
    subtabs: [
      { key: "active", label: "Active Subscriptions", render: ph("Active Subscriptions") },
      { key: "history", label: "Subscription History", render: ph("Subscription History") },
      { key: "billing", label: "Billing History", render: () => <AdminPayments /> },
      { key: "invoices", label: "Invoice Management", render: ph("Invoices") },
      { key: "methods", label: "Payment Methods", render: ph("Payment Methods") },
      { key: "failed", label: "Failed Payments", render: ph("Failed Payments") },
      { key: "refund_req", label: "Refund Requests", render: ph("Refund Requests") },
      { key: "manual", label: "Manual Billing", render: ph("Manual Billing") },
      { key: "recurring", label: "Recurring Billing", render: ph("Recurring Billing") },
      { key: "upgrade", label: "Plan Upgrades / Downgrades", render: ph("Plan Changes") },
      { key: "trials", label: "Trial Accounts", render: ph("Trials") },
      { key: "forecast", label: "Revenue Forecasts", render: ph("Forecasts") },
      { key: "billing_reports", label: "Billing Reports", render: ph("Billing Reports") },
    ],
  },
  {
    key: "cms", label: "Content Management", icon: FileText,
    subtabs: [
      { key: "legends", label: "National Legends", render: () => <AdminNationalLegends /> },
      { key: "legend_articles", label: "Legend Articles", render: () => <AdminLegendArticles /> },
      { key: "blog", label: "Blog Posts", render: ph("Blog CMS") },
      { key: "news", label: "News Articles", render: ph("News") },
      { key: "landing_pages", label: "Landing Pages", render: ph("Landing Pages") },
      { key: "faqs", label: "FAQs", render: ph("FAQs") },
      { key: "help", label: "Help Center", render: ph("Help Center") },
      { key: "privacy", label: "Privacy Policy", render: ph("Privacy Policy CMS") },
      { key: "terms", label: "Terms of Service", render: ph("Terms CMS") },
      { key: "guidelines", label: "Community Guidelines", render: ph("Guidelines CMS") },
      { key: "email_tpl", label: "Email Templates", render: ph("Email Templates") },
      { key: "push_tpl", label: "Push Templates", render: ph("Push Templates") },
      { key: "sms_tpl", label: "SMS Templates", render: ph("SMS Templates") },
      { key: "banners", label: "Homepage / Promo Banners", render: ph("Banners") },
      { key: "popups", label: "Popup Messages", render: ph("Popups") },
      { key: "media", label: "Media Library", render: ph("Media Library") },
    ],
  },
  {
    key: "campaigns", label: "Notifications & Campaigns", icon: Megaphone,
    subtabs: [
      { key: "newsletter", label: "Newsletter", render: () => <AdminNewsletter /> },
      { key: "push", label: "Push Campaigns", render: ph("Push Campaigns") },
      { key: "email", label: "Email Campaigns", render: ph("Email Campaigns") },
      { key: "sms", label: "SMS Campaigns", render: ph("SMS Campaigns") },
      { key: "scheduled", label: "Scheduled Campaigns", render: ph("Scheduled") },
      { key: "segments", label: "Audience Segmentation", render: ph("Segmentation") },
      { key: "automation", label: "Automation Rules", render: ph("Automations") },
      { key: "welcome", label: "Welcome Messages", render: ph("Welcome") },
      { key: "reengage", label: "Re-engagement", render: ph("Re-engagement") },
      { key: "promo", label: "Promotional", render: ph("Promotional") },
      { key: "ab", label: "A/B Testing", render: ph("A/B Testing") },
      { key: "campaign_analytics", label: "Campaign Analytics", render: ph("Campaign Analytics") },
      { key: "notif_logs", label: "Notification Logs", render: ph("Notification Logs") },
      { key: "delivery", label: "Delivery Reports", render: ph("Delivery Reports") },
      { key: "failed_delivery", label: "Failed Deliveries", render: ph("Failed Deliveries") },
      { key: "history", label: "Announcement History", render: ph("Announcement History") },
    ],
  },
  {
    key: "verification", label: "Verification & Identity", icon: BadgeCheck,
    subtabs: [
      { key: "pending", label: "Pending Verifications", render: ph("Pending Family Verifications") },
      { key: "approved", label: "Approved Verifications", render: ph("Approved") },
      { key: "rejected", label: "Rejected Verifications", render: ph("Rejected") },
      { key: "family_review", label: "Family Relationship Review", render: ph("Family Review") },
      { key: "manual", label: "Manual Verification", render: ph("Manual Verification") },
      { key: "badge_assign", label: "Badge Assignment", render: ph("Badge Assign") },
      { key: "badge_revoke", label: "Badge Revocation", render: ph("Badge Revoke") },
      { key: "history", label: "Verification History", render: ph("History") },
      { key: "appeals", label: "Appeals", render: ph("Appeals") },
      { key: "analytics", label: "Verification Analytics", render: ph("Analytics") },
      { key: "fraud", label: "Fraud Detection", render: ph("Fraud Detection") },
    ],
  },
  {
    key: "support", label: "Customer Support", icon: LifeBuoy,
    subtabs: [
      { key: "contacted", label: "Contact Submissions", render: () => <AdminContacted /> },
      { key: "dashboard", label: "Support Dashboard", render: ph("Support Dashboard") },
      { key: "tickets", label: "Ticket Management", render: ph("Tickets") },
      { key: "live_chat", label: "Live Chat", render: ph("Live Chat") },
      { key: "email", label: "Email Support", render: ph("Email Support") },
      { key: "complaints", label: "Complaints", render: ph("Complaints") },
      { key: "escalations", label: "Escalations", render: ph("Escalations") },
      { key: "appeals", label: "User Appeals", render: ph("User Appeals") },
      { key: "moderator_inbox", label: "Moderator Inbox", render: ph("Moderator Inbox") },
      { key: "faq", label: "FAQ Management", render: ph("FAQ Management") },
      { key: "kb", label: "Knowledge Base", render: ph("Knowledge Base") },
      { key: "analytics", label: "Support Analytics", render: ph("Support Analytics") },
      { key: "sla", label: "SLA Monitoring", render: ph("SLA") },
      { key: "notes", label: "Internal Notes", render: ph("Internal Notes") },
      { key: "agents", label: "Support Agents", render: ph("Agents") },
      { key: "ratings", label: "Satisfaction Ratings", render: ph("Ratings") },
    ],
  },
  {
    key: "ai_safety", label: "AI · Trust & Safety", icon: Sparkles,
    subtabs: [
      { key: "content", label: "AI Content Moderation", render: ph("AI Content Moderation") },
      { key: "chat", label: "AI Chat Moderation", render: ph("AI Chat Moderation") },
      { key: "image", label: "AI Image Scanning", render: ph("AI Image Scanning") },
      { key: "video", label: "AI Video Scanning", render: ph("AI Video Scanning") },
      { key: "fake_ai", label: "Fake Profile AI", render: ph("Fake Profile AI") },
      { key: "scam", label: "Scam Detection", render: ph("Scam Detection") },
      { key: "fraud", label: "Fraud Detection", render: ph("Fraud Detection") },
      { key: "spam", label: "Spam Detection", render: ph("Spam Detection") },
      { key: "bot", label: "Bot Detection", render: ph("Bot Detection") },
      { key: "suspicious", label: "Suspicious Behavior", render: ph("Suspicious Behavior") },
      { key: "trust", label: "Trust Score Engine", render: ph("Trust Score") },
      { key: "risk", label: "Risk Scoring", render: ph("Risk Scoring") },
      { key: "auto_actions", label: "Automated User Actions", render: ph("Automated Actions") },
      { key: "learning", label: "AI Learning Reports", render: ph("Learning Reports") },
      { key: "safety", label: "Safety Analytics", render: ph("Safety Analytics") },
    ],
  },
  {
    key: "system", label: "System & Integrations", icon: Settings,
    subtabs: [
      { key: "kill", label: "Kill Switches", render: () => <AdminKillSwitches /> },
      { key: "general", label: "General Settings", render: ph("General Settings") },
      { key: "localization", label: "Localization / Languages", render: ph("Localization") },
      { key: "timezone", label: "Time Zones", render: ph("Time Zones") },
      { key: "integrations", label: "API Integrations", render: ph("Integrations") },
      { key: "gateways", label: "Payment Gateways", render: ph("Payment Gateways", "Paystack is connected. Additional gateways here.") },
      { key: "email_providers", label: "Email Providers", render: ph("Email Providers") },
      { key: "sms_providers", label: "SMS Providers", render: ph("SMS Providers") },
      { key: "oauth", label: "OAuth / Social Login", render: ph("OAuth Providers") },
      { key: "storage", label: "Cloud Storage / CDN", render: ph("Storage & CDN") },
      { key: "backup", label: "Backup / Restore", render: ph("Backup Management") },
      { key: "cron", label: "Cron Jobs", render: ph("Cron Jobs") },
      { key: "queue", label: "Queue Monitoring", render: ph("Queue Monitor") },
      { key: "feature_flags", label: "Feature Flags", render: ph("Feature Flags") },
      { key: "env", label: "Environment Variables", render: ph("Env Vars") },
      { key: "devtools", label: "Developer Tools", render: ph("Dev Tools") },
      { key: "errors", label: "Error Logs", render: ph("Error Logs") },
    ],
  },
  {
    key: "audit", label: "Audit Logs & Compliance", icon: ScrollText,
    subtabs: [
      { key: "admin_activity", label: "Admin Activity Logs", render: ph("Admin Activity", "View at /admin activity feed. Full search coming soon.") },
      { key: "user_activity", label: "User Activity Logs", render: ph("User Activity") },
      { key: "login", label: "Login Logs", render: ph("Login Logs") },
      { key: "payment", label: "Payment Logs", render: () => <AdminPayments /> },
      { key: "moderation", label: "Moderation Logs", render: ph("Moderation Logs") },
      { key: "security", label: "Security Logs", render: ph("Security Logs") },
      { key: "api", label: "API Logs", render: ph("API Logs") },
      { key: "export", label: "Data Export Logs", render: ph("Data Export Logs") },
      { key: "upload", label: "File Upload Logs", render: ph("File Upload Logs") },
      { key: "email_logs", label: "Email Logs", render: ph("Email Logs") },
      { key: "sms_logs", label: "SMS Logs", render: ph("SMS Logs") },
      { key: "notif_logs", label: "Notification Logs", render: ph("Notification Logs") },
      { key: "compliance", label: "Compliance Reports", render: ph("Compliance") },
      { key: "gdpr", label: "GDPR Requests", render: ph("GDPR Requests") },
      { key: "deletion", label: "Account Deletion Requests", render: ph("Deletion Requests") },
      { key: "retention", label: "Data Retention Policies", render: ph("Retention Policies") },
      { key: "consent", label: "Consent Management", render: ph("Consent") },
      { key: "legal_hold", label: "Legal Hold Records", render: ph("Legal Hold") },
      { key: "backup_audit", label: "Backup Audit History", render: ph("Backup Audit") },
      { key: "full_audit", label: "Full System Audit Trail", render: ph("System Audit Trail") },
    ],
  },
];