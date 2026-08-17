import React from "react";
import { HiInboxArrowDown } from "react-icons/hi2";
import { Link } from "react-router-dom";

/* ─── Panel definitions ──────────────────────────────────────────────────────── */
const PANELS = [
    {
        id: "capture",
        icon: HiInboxArrowDown,
        accent: { bg: "#eef2ff", icon: "#4f46e5", btn: "#4f46e5", btnHover: "#4338ca", text: "#4f46e5", soft: "#e0e7ff" },
        title: "Capture - Business Data and Events with Context",
        subtitle: "Capture business events, enrich data with context, and initiate relevant business processes.",
        showDemoDisclaimer: true,
        status: "Healthy",
        statusOk: true,
        lastActivity: "2m ago",
        stats: [
            { icon: "fa-solid fa-envelope", label: "Emails Events", value: "247" },
            { icon: "fa-solid fa-store", label: "E-commerce Events", value: "18" },
            { icon: "fa-solid fa-link", label: "Webhook Events", value: "6" },
            { icon: "fa-solid fa-triangle-exclamation", label: "Failed Events", value: "2", warn: true },
            { icon: "fa-solid fa-chart-line", label: "Success Rate", value: "99.8%" },
        ],
        quickActions: [
            {
                icon: "fa-solid fa-envelope-open-text",
                label: "Data Intake using Web Forms",
                doc: { section: "capture", slug: "forms", title: "Forms" },
                description: "How to take structured information using web forms and trigger processes."
            },
            {
                icon: "fa-solid fa-plug",
                label: "Data Intake using APIs",
                doc: { section: "capture", slug: "apis", title: "APIs" },
                description: "How to receive business data from external systems and trigger relevant business processes."
            },
            {
                icon: "fa-solid fa-robot",
                label: "Data Enrichment using AI",
                doc: { section: "capture", slug: "ai-agent", title: "AI Agent — Enrich Data" },
                description: "How to validate, classify, and enrich captured data using context-aware AI agents."
            },
        ],

        recentActivity: [
            { icon: "fa-solid fa-envelope", label: "Customer Support mailbox connected", time: "10m ago" },
            { icon: "fa-solid fa-store", label: "Amazon store connected", time: "1h ago" },
            { icon: "fa-solid fa-link", label: "Webhook endpoint updated", time: "3h ago" },
        ],
    },
    {
        id: "orchestrate",
        icon: "fa-solid fa-arrows-spin",
        accent: { bg: "#ecfdf5", icon: "#059669", btn: "#059669", btnHover: "#047857", text: "#059669", soft: "#d1fae5" },
        title: "Orchestrate - Business Activities Across People and Systems",
        subtitle: "Configure and deploy processes to coordinate and automate business activities.",
        status: "Healthy",
        statusOk: true,
        lastActivity: "5m ago",
        stats: [
            { icon: "fa-solid fa-layer-group", label: "Business Areas", value: "12" },
            { icon: "fa-regular fa-file-lines", label: "Process Definitions", value: "84" },
            { icon: "fa-solid fa-circle-play", label: "Running Processes", value: "235" },
            { icon: "fa-solid fa-user-check", label: "User Tasks", value: "42" },
            { icon: "fa-solid fa-triangle-exclamation", label: "Process Incidents", value: "2", warn: true },
        ],
        quickActions: [
            {
                icon: "fa-solid fa-layer-group",
                label: "Business Areas",
                route: "/orchestrate-configuration?section=BUSINESS_AREA",
                description: "Define and manage business domains for processes",
            },
            {
                icon: "fa-solid fa-folder-tree",
                label: "Governing Bodies",
                route: "/orchestrate-configuration?section=GOVERNING_BODY",
                description: "Bodies responsible for defining and optimising business processes"
            },
            {
                icon: "fa-solid fa-rocket",
                label: "Deploy Process",
                route: "/orchestrate-configuration?section=PROCESSES",
                description: "Launch new or updated processes into production"
            },
            {
                icon: "fa-solid fa-chart-line",
                label: "Monitor Process",
                route: "/orchestrate-configuration?section=PROCESS_MONITOR",
                description: "Track performance and status of running processes"
            },
            {
                icon: "fa-solid fa-robot",
                label: "Task Automation",
                doc: { section: "orchestrate", slug: "ai-agent", title: "AI Agent — Orchestrate" },
                description: "Use AI, Data APIs, and external systems inside workflows for task automations"
            },
        ],
        recentActivity: [
            { icon: "fa-solid fa-circle-play", label: "Customer Complaint workflow deployed", time: "15m ago" },
            { icon: "fa-regular fa-file-lines", label: "Vendor Onboarding updated", time: "2h ago" },
            { icon: "fa-solid fa-user-check", label: "Leave Approval published", time: "5h ago" },
        ],
    },
    {
        id: "integrate",
        icon: "fa-solid fa-link",
        accent: { bg: "#f5f3ff", icon: "#7c3aed", btn: "#7c3aed", btnHover: "#6d28d9", text: "#7c3aed", soft: "#ede9fe" },
        title: "Integrate – Connect Enterprise Systems and Data",
        subtitle: "Connect enterprise applications, to execute tasks and exchange business information.",
        showDemoDisclaimer: true,
        status: "Attention Required",
        statusOk: false,
        lastActivity: "8m ago",
        stats: [
            { icon: "fa-solid fa-plug-circle-check", label: "Active Connectors", value: "18" },
            { icon: "fa-solid fa-globe", label: "External Connectors", value: "3" },
            { icon: "fa-solid fa-triangle-exclamation", label: "Failed Syncs", value: "2", warn: true },
            { icon: "fa-solid fa-message", label: "Messages Today", value: "1,248" },
        ],
        quickActions: [                         
            {
                icon: "fa-solid fa-database",
                label: "Data Sharing Services",
                route: "/data-management",
                description: "Design reusable forms, manage persistent data lists, and configure SQL‑based APIs."
            },
            {
                icon: "fa-solid fa-magnifying-glass-chart",
                label: "Custom Reports and Analytics",
                route: "/data-analysis",
                description: "Deploy custom reports to analyze data streams and generate actionable insights for decision-making."
            },
            {
                icon: "fa-solid fa-paper-plane",
                label: "Email Services",
                route: "/email-management",
                description: "Manage accounts and templates for sending system‑generated emails."
            },
            {
                icon: "fa-solid fa-robot",
                label: "AI Provider Services",
                route: "/ai-services",
                description: "Configure AI providers, agents, and task definitions for workflow automation"
            }, 
            {
                icon: "fa-solid fa-plug",
                label: "External Systems Integration",
                doc: { section: "integrate", slug: "connector", title: "Connector" },
                description: "Guidelines to integrate external systems with your processes as external workers"
            },
                      
        ],

        recentActivity: [
            { icon: "fa-solid fa-circle", label: "Odoo connected", time: "20m ago", successDot: true },
            { icon: "fa-solid fa-gear", label: "Kafka topic configured", time: "1h ago" },
            { icon: "fa-solid fa-rotate", label: "QuickBooks synchronization completed", time: "2h ago" },
        ],
    },
    {
        id: "administration",
        icon: "fa-solid fa-gear",
        accent: { bg: "#fff7ed", icon: "#ea580c", btn: "#ea580c", btnHover: "#c2410c", text: "#ea580c", soft: "#ffedd5" },
        title: "Administrate – Platform Configurations and Security",
        subtitle: "Manage platform configuration and security for controlled execution.",
        status: "Healthy",
        statusOk: true,
        lastActivity: "3m ago",
        stats: [
            { icon: "fa-solid fa-users", label: "Users", value: "246" },
            { icon: "fa-solid fa-shield-halved", label: "Groups", value: "18" },
            // { icon: "fa-solid fa-brain", label: "AI Providers", value: "5" },
            { icon: "fa-solid fa-receipt", label: "Active Subscription", value: "1" },
            { icon: "fa-solid fa-bell", label: "System Alerts", value: "4", warn: true },
        ],
        quickActions: [
            {
                icon: "fa-solid fa-building",
                label: "People and Organizations",
                route: "/user-management",
                description: "Manage user accounts, group memberships, and organizational structures"
            },                                   
            {
                icon: "fa-solid fa-globe",
                label: "User Experience",
                route: "/site-administration",
                description: "Configure dynamic Menus and Pages to show Tasks, Data, Charts and Reports with authorizations"
            },
            {
                icon: "fa-solid fa-file-alt",
                label: "Knowledge Base",
                route: "/content-management",
                description: "Create web content, posts and digital assets for internal and external audiences"
            },
            // { 
            //   icon: "fa-solid fa-brain", 
            //   label: "AI Provider", 
            //   route: "/ai-providers", 
            //   disabled: true,
            //   description: "Integrate AI services for intelligent automation"
            // },            
            {
                icon: "fa-solid fa-credit-card",
                label: "Subscription",
                route: "/payment-processor",
                description: "Manage billing, subscriptions, and payment processing"
            },
        ],
        recentActivity: [
            { icon: "fa-solid fa-user-shield", label: "New administrator added", time: "30m ago" },
            // { icon: "fa-solid fa-robot", label: "OpenAI provider updated", time: "1h ago" },
            { icon: "fa-solid fa-receipt", label: "Subscription renewed", time: "6h ago" },
        ],
    },
];

/* ─── Shared inline styles using theme CSS vars ────────────────────────────── */
const sx = {
    page: { background: "var(--secondary-color)", minHeight: "100vh", padding: "1.5rem" },
    headTitle: { color: "var(--text-primary)", fontWeight: 700, fontSize: "1.375rem", margin: 0 },
    headSub: { color: "var(--text-muted)", fontSize: "0.8125rem", marginTop: "0.25rem" },
    card: { background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "1rem", boxShadow: "0 1px 4px var(--shadow-color)", display: "flex", flexDirection: "column", overflow: "hidden" },
    cardHeader: { padding: "1.25rem 1.25rem 0.75rem" },
    panelTitle: { color: "var(--text-primary)", fontWeight: 700, fontSize: "1.0625rem", lineHeight: 1 },
    panelLabel: { color: "var(--text-muted)", fontSize: "0.7rem" },
    panelSub: { color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.5rem" },
    lastAct: { color: "var(--text-muted)", fontSize: "0.7rem", whiteSpace: "nowrap" },
    statsDivider: { borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)", padding: "0.75rem 1.25rem", display: "flex", flexWrap: "wrap", gap: "1.25rem", alignItems: "center" },
    statVal: { color: "var(--text-primary)", fontWeight: 700, fontSize: "0.875rem", lineHeight: 1 },
    statWarnVal: { color: "var(--warning)", fontWeight: 700, fontSize: "0.875rem", lineHeight: 1 },
    statLabel: { color: "var(--text-muted)", fontSize: "0.625rem", marginTop: "0.2rem", lineHeight: 1 },
    bodyRow: { display: "flex", flex: 1, borderTop: "1px solid var(--border-subtle)" },
    colLeft: { flex: 1, padding: "1rem 1rem 1rem 1.25rem", borderRight: "1px solid var(--border-subtle)" },
    colRight: { flex: 1, padding: "1rem 1.25rem 1rem 1rem" },
    sectionHead: { color: "var(--text-muted)", fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" },
    actLabel: { color: "var(--text-secondary)", fontSize: "0.75rem", lineHeight: 1.3 },
    actTime: { color: "var(--text-muted)", fontSize: "0.625rem", whiteSpace: "nowrap" },
    actIcon: { color: "var(--text-muted)", fontSize: "0.7rem", width: "1rem", textAlign: "center", flexShrink: 0, marginTop: "0.125rem" },
    cardFooter: { padding: "0.75rem 1.25rem 1.25rem", display: "flex", justifyContent: "flex-end" },
    viewAll: { fontSize: "0.7rem", fontWeight: 600, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem", padding: 0, marginTop: "0.75rem" },
    addBtn: { background: "none", border: "none", display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.2rem 0", cursor: "pointer", fontSize: "0.75rem", fontWeight: 500, width: "100%", textAlign: "left", textDecoration: "none" },
    addBtnIcon: { width: "1.5rem", height: "1.5rem", borderRadius: "0.35rem", border: "1px solid var(--border-default)", background: "var(--bg-surface-alt)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.75rem" },
    demoBanner: { margin: "0 1.25rem 0.75rem", padding: "0.625rem 0.75rem", border: "1px solid var(--border-default)", borderRadius: "0.5rem", background: "var(--bg-surface-alt)", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", lineHeight: 1.4 },
    demoNote: { margin: 0, padding: "0.75rem 1.25rem", borderTop: "1px solid var(--border-subtle)", color: "var(--text-muted)", background: "var(--bg-surface-alt)", fontSize: "0.6875rem", lineHeight: 1.5 },
};

/* ─── Status badge ───────────────────────────────────────────────────────────── */
function StatusBadge({ ok }) {
    return (
        <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.7rem", fontWeight: 600, color: ok ? "var(--success)" : "var(--warning)" }}>
            <span style={{ width: "0.5rem", height: "0.5rem", borderRadius: "50%", background: ok ? "var(--success)" : "var(--warning)", display: "inline-block" }} />
            {ok ? "Healthy" : "Attention Required"}
        </span>
    );
}

/* ─── Panel card ─────────────────────────────────────────────────────────────── */
function PanelCard({ panel }) {
    const ac = panel.accent;

    return (
        <div style={sx.card}>
            {/* Header */}
            <div style={sx.cardHeader}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        {/* Module icon */}
                        <div style={{ width: "2.75rem", height: "2.75rem", background: ac.bg, borderRadius: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {typeof panel.icon === "string"
                                ? <i className={panel.icon} style={{ color: ac.icon, fontSize: "1.1rem" }} />
                                : <panel.icon style={{ color: ac.icon, fontSize: "1.25rem" }} />
                            }
                        </div>
                        {/* Title + status */}
                        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                            <span style={sx.panelTitle}>{panel.title}</span>
                            {/* <span style={sx.panelLabel}>Platform Status</span> */}
                            {/* <StatusBadge ok={panel.statusOk} /> */}
                        </div>
                    </div>
                    {/* <span style={sx.lastAct}>Last activity: {panel.lastActivity}</span> */}
                </div>
                <p style={{ ...sx.panelSub, paddingLeft: "3.5rem" }}>{panel.subtitle}</p>
            </div>

            {/* {panel.showDemoDisclaimer && (
                <div style={sx.demoBanner} role="note">
                    <i className="fa-solid fa-circle-info" style={{ color: ac.icon, flexShrink: 0 }} />
                    <span>Demo data shown — integration features coming soon.</span>
                </div>
            )} */}

            {/* Stats bar */}
            {/* <div style={sx.statsDivider}>
                {panel.stats.map(s => (
                    <div key={s.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.05rem" }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "0.3rem" }}>
                            <i className={s.icon} style={{ color: s.warn ? "var(--warning)" : ac.icon, fontSize: "0.8rem", lineHeight: 1 }} />
                            <p style={s.warn ? sx.statWarnVal : sx.statVal}>{s.value}</p>
                        </div>
                        <p style={{ ...sx.statLabel, textAlign: "center" }}>{s.label}</p>
                    </div>
                ))}
            </div> */}

            {/* Body */}
            <div style={sx.bodyRow}>
                {/* Quick Actions */}
                <div style={sx.colLeft}>
                    <p style={sx.sectionHead}>Quick Actions</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {panel.quickActions.map(a => (
                            <Link
                                key={a.label}
                                to={panel.disableQuickActions || a.disabled ? "#" : (a.route || "#")}
                                style={{
                                    ...sx.addBtn,
                                    color: panel.disableQuickActions || a.disabled
                                        ? "var(--text-muted)"
                                        : ac.text,
                                    cursor: panel.disableQuickActions || a.disabled
                                        ? "not-allowed"
                                        : "pointer",
                                    opacity: panel.disableQuickActions || a.disabled ? 0.6 : 1,
                                    textAlign: "left", // ensures label + description align nicely
                                }}
                                aria-disabled={panel.disableQuickActions || a.disabled}
                                tabIndex={panel.disableQuickActions || a.disabled ? -1 : 0}
                                title={panel.disableQuickActions || a.disabled ? "Coming soon" : undefined}
                                target={a.route?.startsWith("http") ? "_blank" : undefined}
                                rel={a.route?.startsWith("http") ? "noopener noreferrer" : undefined}
                                onClick={event => {
                                    if (panel.disableQuickActions || a.disabled) {
                                        event.preventDefault();
                                        return;
                                    }
                                    if (a.doc) {
                                        event.preventDefault();
                                        window.dispatchEvent(new CustomEvent("openDoc", { detail: a.doc }));
                                        return;
                                    }
                                }}
                            >
                                <span
                                    style={{
                                        ...sx.addBtnIcon,
                                        color: panel.disableQuickActions || a.disabled
                                            ? "var(--text-muted)"
                                            : ac.icon,
                                    }}
                                >
                                    <i className={a.icon} />
                                </span>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                                    <span>{a.label}</span>
                                    {a.description && (
                                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                            {a.description}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>


            {/* {panel.showDemoDisclaimer && (
                <p style={sx.demoNote}>
                    This dashboard displays sample data for demonstration purposes. Live integrations with Email, Ecommerce, and Webhooks will be available in upcoming releases.
                </p>
            )} */}

            {/* Footer */}
            {/* <div style={sx.cardFooter}>
                <button
                    style={{ background: ac.btn, color: "#fff", fontSize: "0.75rem", fontWeight: 600, padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", boxShadow: "0 1px 3px var(--shadow-color)" }}
                    onMouseEnter={e => e.currentTarget.style.background = ac.btnHover}
                    onMouseLeave={e => e.currentTarget.style.background = ac.btn}
                >
                    Open Workspace
                    <i className="fa-solid fa-arrow-right" style={{ fontSize: "0.625rem" }} />
                </button>
            </div> */}
        </div>
    );
}

/* ─── Main page ──────────────────────────────────────────────────────────────── */
export default function ControlPanel() {
    return (
        <div style={sx.page}>
            <div style={{ marginBottom: "1.5rem" }}>
                <h1 style={sx.headTitle}>Control Panel</h1>
                <p style={sx.headSub}>Integrate and Optimize People, Processes and Technology to Streamline and Continuously Improve Business Operations.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))", gap: "1.25rem" }}>
                {PANELS.map(panel => (
                    <PanelCard key={panel.id} panel={panel} />
                ))}
            </div>
        </div>
    );
}
