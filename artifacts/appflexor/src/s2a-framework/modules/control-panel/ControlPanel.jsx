import React from "react";

/* ─── Panel definitions ──────────────────────────────────────────────────────── */
const PANELS = [
    {
        id: "capture",
        icon: "bi bi-tray-arrow-down",
        accent: { bg: "#eef2ff", icon: "#4f46e5", btn: "#4f46e5", btnHover: "#4338ca", text: "#4f46e5", soft: "#e0e7ff" },
        title: "Capture",
        subtitle: "Receive business events from external channels.",
        status: "Healthy",
        statusOk: true,
        lastActivity: "2m ago",
        stats: [
            { icon: "fa-solid fa-envelope",                   label: "Emails Today",      value: "247"   },
            { icon: "fa-brands fa-whatsapp",                  label: "WhatsApp Messages", value: "32"    },
            { icon: "fa-regular fa-rectangle-list",           label: "Forms",             value: "18"    },
            { icon: "fa-solid fa-code",                       label: "Active APIs",       value: "6"     },
            { icon: "fa-solid fa-chart-line",                 label: "Capture Success",   value: "99.8%" },
        ],
        quickActions: [
            { icon: "fa-solid fa-envelope",  label: "Add Email Connector"    },
            { icon: "fa-brands fa-whatsapp", label: "Add WhatsApp Connector" },
            { icon: "fa-solid fa-globe",     label: "Create Portal"          },
            { icon: "fa-solid fa-code",      label: "Create API"             },
        ],
        recentActivity: [
            { icon: "fa-solid fa-envelope", label: "Customer Support mailbox connected", time: "10m ago" },
            { icon: "fa-solid fa-globe",    label: "Travel Portal published",            time: "1h ago"  },
            { icon: "fa-solid fa-link",     label: "Webhook endpoint updated",           time: "3h ago"  },
        ],
    },
    {
        id: "orchestrate",
        icon: "fa-solid fa-arrows-spin",
        accent: { bg: "#ecfdf5", icon: "#059669", btn: "#059669", btnHover: "#047857", text: "#059669", soft: "#d1fae5" },
        title: "Orchestrate",
        subtitle: "Design, deploy and monitor business processes.",
        status: "Healthy",
        statusOk: true,
        lastActivity: "5m ago",
        stats: [
            { icon: "fa-solid fa-layer-group",              label: "Business Areas",       value: "12"  },
            { icon: "fa-regular fa-file-lines",             label: "Process Definitions",  value: "84"  },
            { icon: "fa-solid fa-circle-play",              label: "Running Processes",    value: "235" },
            { icon: "fa-solid fa-user-check",               label: "User Tasks",           value: "42"  },
            { icon: "fa-solid fa-triangle-exclamation",     label: "Process Incidents",    value: "2",  warn: true },
        ],
        quickActions: [
            { icon: "fa-solid fa-layer-group", label: "Create Business Area"    },
            { icon: "fa-solid fa-folder-plus", label: "Create Process Category" },
            { icon: "fa-solid fa-rocket",      label: "Deploy Process"          },
        ],
        recentActivity: [
            { icon: "fa-solid fa-circle-play",  label: "Customer Complaint workflow deployed", time: "15m ago" },
            { icon: "fa-regular fa-file-lines", label: "Vendor Onboarding updated",            time: "2h ago"  },
            { icon: "fa-solid fa-user-check",   label: "Leave Approval published",             time: "5h ago"  },
        ],
    },
    {
        id: "integrate",
        icon: "fa-solid fa-link",
        accent: { bg: "#f5f3ff", icon: "#7c3aed", btn: "#7c3aed", btnHover: "#6d28d9", text: "#7c3aed", soft: "#ede9fe" },
        title: "Integrate",
        subtitle: "Connect enterprise applications and external services.",
        status: "Attention Required",
        statusOk: false,
        lastActivity: "8m ago",
        stats: [
            { icon: "fa-solid fa-plug-circle-check",        label: "Active Connectors",   value: "18"    },
            { icon: "fa-solid fa-globe",                    label: "External Connectors", value: "3"     },
            { icon: "fa-solid fa-triangle-exclamation",     label: "Failed Syncs",        value: "2",    warn: true },
            { icon: "fa-solid fa-message",                  label: "Messages Today",      value: "1,248" },
        ],
        quickActions: [
            { icon: "fa-solid fa-plug",  label: "Add Enterprise Connector" },
            { icon: "fa-solid fa-globe", label: "Add External Connector"   },
            { icon: "fa-solid fa-link",  label: "Add Webhook"              },
        ],
        recentActivity: [
            { icon: "fa-solid fa-circle",  label: "Odoo connected",                      time: "20m ago", successDot: true },
            { icon: "fa-solid fa-gear",    label: "Kafka topic configured",              time: "1h ago"  },
            { icon: "fa-solid fa-rotate",  label: "QuickBooks synchronization completed", time: "2h ago" },
        ],
    },
    {
        id: "administration",
        icon: "fa-solid fa-gear",
        accent: { bg: "#fff7ed", icon: "#ea580c", btn: "#ea580c", btnHover: "#c2410c", text: "#ea580c", soft: "#ffedd5" },
        title: "Administration",
        subtitle: "Manage platform configuration and security.",
        status: "Healthy",
        statusOk: true,
        lastActivity: "3m ago",
        stats: [
            { icon: "fa-solid fa-users",                label: "Users",               value: "246" },
            { icon: "fa-solid fa-shield-halved",        label: "Roles",               value: "18"  },
            { icon: "fa-solid fa-robot",                label: "AI Providers",        value: "5"   },
            { icon: "fa-solid fa-receipt",              label: "Active Subscription", value: "1"   },
            { icon: "fa-solid fa-bell",                 label: "Audit Alerts",        value: "4",  warn: true },
        ],
        quickActions: [
            { icon: "fa-solid fa-user-plus",     label: "Add User"        },
            { icon: "fa-solid fa-shield-halved", label: "Add Role"        },
            { icon: "fa-solid fa-robot",         label: "Add AI Provider" },
        ],
        recentActivity: [
            { icon: "fa-solid fa-user-shield", label: "New administrator added",  time: "30m ago" },
            { icon: "fa-solid fa-robot",       label: "OpenAI provider updated",  time: "1h ago"  },
            { icon: "fa-solid fa-receipt",     label: "Subscription renewed",     time: "6h ago"  },
        ],
    },
];

/* ─── Shared inline styles using theme CSS vars ────────────────────────────── */
const sx = {
    page:        { background: "var(--bg-app)",         minHeight: "100vh", padding: "1.5rem" },
    headTitle:   { color: "var(--text-primary)",        fontWeight: 700, fontSize: "1.375rem", margin: 0 },
    headSub:     { color: "var(--text-muted)",          fontSize: "0.8125rem", marginTop: "0.25rem" },
    card:        { background: "var(--bg-surface)",     border: "1px solid var(--border-default)", borderRadius: "1rem", boxShadow: "0 1px 4px var(--shadow-color)", display: "flex", flexDirection: "column", overflow: "hidden" },
    cardHeader:  { padding: "1.25rem 1.25rem 0.75rem" },
    panelTitle:  { color: "var(--text-primary)",        fontWeight: 700, fontSize: "1.0625rem", lineHeight: 1 },
    panelLabel:  { color: "var(--text-muted)",          fontSize: "0.7rem" },
    panelSub:    { color: "var(--text-muted)",          fontSize: "0.75rem", marginTop: "0.5rem" },
    lastAct:     { color: "var(--text-muted)",          fontSize: "0.7rem", whiteSpace: "nowrap" },
    statsDivider:{ borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)", padding: "0.75rem 1.25rem", display: "flex", flexWrap: "wrap", gap: "1.25rem", alignItems: "center" },
    statVal:     { color: "var(--text-primary)",        fontWeight: 700, fontSize: "0.875rem", lineHeight: 1 },
    statWarnVal: { color: "var(--warning)",             fontWeight: 700, fontSize: "0.875rem", lineHeight: 1 },
    statLabel:   { color: "var(--text-muted)",          fontSize: "0.625rem", marginTop: "0.2rem", lineHeight: 1 },
    bodyRow:     { display: "flex", flex: 1, borderTop: "1px solid var(--border-subtle)" },
    colLeft:     { flex: 1, padding: "1rem 1rem 1rem 1.25rem", borderRight: "1px solid var(--border-subtle)" },
    colRight:    { flex: 1, padding: "1rem 1.25rem 1rem 1rem" },
    sectionHead: { color: "var(--text-muted)",          fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" },
    actLabel:    { color: "var(--text-secondary)",      fontSize: "0.75rem", lineHeight: 1.3 },
    actTime:     { color: "var(--text-muted)",          fontSize: "0.625rem", whiteSpace: "nowrap" },
    actIcon:     { color: "var(--text-muted)",          fontSize: "0.7rem", width: "1rem", textAlign: "center", flexShrink: 0, marginTop: "0.125rem" },
    cardFooter:  { padding: "0.75rem 1.25rem 1.25rem", display: "flex", justifyContent: "flex-end" },
    viewAll:     { fontSize: "0.7rem", fontWeight: 600, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem", padding: 0, marginTop: "0.75rem" },
    addBtn:      { background: "none", border: "none", display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.2rem 0", cursor: "pointer", fontSize: "0.75rem", fontWeight: 500, width: "100%", textAlign: "left" },
    addBtnIcon:  { width: "1.25rem", height: "1.25rem", borderRadius: "0.3rem", border: "1px solid var(--border-default)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.55rem", color: "var(--text-muted)" },
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
                            <i className={panel.icon} style={{ color: ac.icon, fontSize: "1.1rem" }} />
                        </div>
                        {/* Title + status */}
                        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                            <span style={sx.panelTitle}>{panel.title}</span>
                            <span style={sx.panelLabel}>Platform Status</span>
                            <StatusBadge ok={panel.statusOk} />
                        </div>
                    </div>
                    <span style={sx.lastAct}>Last activity: {panel.lastActivity}</span>
                </div>
                <p style={{ ...sx.panelSub, paddingLeft: "3.5rem" }}>{panel.subtitle}</p>
            </div>

            {/* Stats bar */}
            <div style={sx.statsDivider}>
                {panel.stats.map(s => (
                    <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: "60px" }}>
                        <i className={s.icon} style={{ color: s.warn ? "var(--warning)" : ac.icon, fontSize: "0.875rem" }} />
                        <div>
                            <p style={s.warn ? sx.statWarnVal : sx.statVal}>{s.value}</p>
                            <p style={sx.statLabel}>{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Body */}
            <div style={sx.bodyRow}>
                {/* Quick Actions */}
                <div style={sx.colLeft}>
                    <p style={sx.sectionHead}>Quick Actions</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {panel.quickActions.map(a => (
                            <button key={a.label} style={{ ...sx.addBtn, color: ac.text }}>
                                <span style={sx.addBtnIcon}>
                                    <i className="fa-solid fa-plus" />
                                </span>
                                {a.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div style={sx.colRight}>
                    <p style={sx.sectionHead}>Recent Activity</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                        {panel.recentActivity.map((a, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                                    {a.successDot
                                        ? <span style={{ width: "1rem", height: "1rem", borderRadius: "50%", background: "var(--success)", flexShrink: 0 }} />
                                        : <i className={a.icon} style={sx.actIcon} />
                                    }
                                    <span style={{ ...sx.actLabel, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.label}</span>
                                </div>
                                <span style={sx.actTime}>{a.time}</span>
                            </div>
                        ))}
                    </div>
                    <button style={{ ...sx.viewAll, color: ac.text }}>
                        View all activity
                        <i className="fa-solid fa-arrow-right" style={{ fontSize: "0.55rem" }} />
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div style={sx.cardFooter}>
                <button
                    style={{ background: ac.btn, color: "#fff", fontSize: "0.75rem", fontWeight: 600, padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", boxShadow: "0 1px 3px var(--shadow-color)" }}
                    onMouseEnter={e => e.currentTarget.style.background = ac.btnHover}
                    onMouseLeave={e => e.currentTarget.style.background = ac.btn}
                >
                    Open Workspace
                    <i className="fa-solid fa-arrow-right" style={{ fontSize: "0.625rem" }} />
                </button>
            </div>
        </div>
    );
}

/* ─── Main page ──────────────────────────────────────────────────────────────── */
export default function ControlPanel() {
    return (
        <div style={sx.page}>
            <div style={{ marginBottom: "1.5rem" }}>
                <h1 style={sx.headTitle}>Control Panel</h1>
                <p style={sx.headSub}>Monitor and manage all platform modules from one place.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))", gap: "1.25rem" }}>
                {PANELS.map(panel => (
                    <PanelCard key={panel.id} panel={panel} />
                ))}
            </div>
        </div>
    );
}
