import React, { useState } from "react";
import { Link } from "react-router-dom";

/* ─── Mock data ──────────────────────────────────────────────────────────────── */
const PANELS = [
    {
        id: "capture",
        icon: "fa-solid fa-arrow-down-to-bracket",
        iconBg: "bg-indigo-100",
        iconColor: "text-indigo-600",
        accentColor: "indigo",
        title: "Capture",
        subtitle: "Receive business events from external channels.",
        status: "Healthy",
        statusOk: true,
        lastActivity: "2m ago",
        stats: [
            { icon: "fa-solid fa-envelope",        label: "Emails Today",      value: "247" },
            { icon: "fa-brands fa-whatsapp",        label: "WhatsApp Messages", value: "32"  },
            { icon: "fa-regular fa-rectangle-list", label: "Forms",             value: "18"  },
            { icon: "fa-solid fa-code",             label: "Active APIs",       value: "6"   },
            { icon: "fa-solid fa-chart-line",       label: "Capture Success",   value: "99.8%" },
        ],
        quickActions: [
            { icon: "fa-solid fa-envelope",    label: "Add Email Connector"    },
            { icon: "fa-brands fa-whatsapp",   label: "Add WhatsApp Connector" },
            { icon: "fa-solid fa-globe",       label: "Create Portal"          },
            { icon: "fa-solid fa-code",        label: "Create API"             },
        ],
        recentActivity: [
            { icon: "fa-solid fa-envelope",  label: "Customer Support mailbox connected", time: "10m ago" },
            { icon: "fa-solid fa-globe",     label: "Travel Portal published",            time: "1h ago"  },
            { icon: "fa-solid fa-link",      label: "Webhook endpoint updated",           time: "3h ago"  },
        ],
        btnClass: "btn-indigo",
    },
    {
        id: "orchestrate",
        icon: "fa-solid fa-arrows-spin",
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600",
        accentColor: "emerald",
        title: "Orchestrate",
        subtitle: "Design, deploy and monitor business processes.",
        status: "Healthy",
        statusOk: true,
        lastActivity: "5m ago",
        stats: [
            { icon: "fa-solid fa-layer-group",  label: "Business Areas",      value: "12"  },
            { icon: "fa-regular fa-file-lines", label: "Process Definitions", value: "84"  },
            { icon: "fa-solid fa-circle-play",  label: "Running Processes",   value: "235" },
            { icon: "fa-solid fa-user-check",   label: "User Tasks",          value: "42"  },
            { icon: "fa-solid fa-triangle-exclamation", label: "Process Incidents", value: "2", warn: true },
        ],
        quickActions: [
            { icon: "fa-solid fa-layer-group",  label: "Create Business Area"    },
            { icon: "fa-solid fa-folder-plus",  label: "Create Process Category" },
            { icon: "fa-solid fa-rocket",       label: "Deploy Process"          },
        ],
        recentActivity: [
            { icon: "fa-solid fa-circle-play",  label: "Customer Complaint workflow deployed", time: "15m ago" },
            { icon: "fa-regular fa-file-lines", label: "Vendor Onboarding updated",            time: "2h ago"  },
            { icon: "fa-solid fa-user-check",   label: "Leave Approval published",             time: "5h ago"  },
        ],
        btnClass: "btn-emerald",
    },
    {
        id: "integrate",
        icon: "fa-solid fa-link",
        iconBg: "bg-violet-100",
        iconColor: "text-violet-600",
        accentColor: "violet",
        title: "Integrate",
        subtitle: "Connect enterprise applications and external services.",
        status: "Attention Required",
        statusOk: false,
        lastActivity: "8m ago",
        stats: [
            { icon: "fa-solid fa-plug-circle-check", label: "Active Connectors",   value: "18"    },
            { icon: "fa-solid fa-globe",             label: "External Connectors", value: "3"     },
            { icon: "fa-solid fa-triangle-exclamation", label: "Failed Syncs",     value: "2", warn: true },
            { icon: "fa-solid fa-message",           label: "Messages Today",      value: "1,248" },
        ],
        quickActions: [
            { icon: "fa-solid fa-plug",        label: "Add Enterprise Connector" },
            { icon: "fa-solid fa-globe",       label: "Add External Connector"   },
            { icon: "fa-solid fa-link",        label: "Add Webhook"              },
        ],
        recentActivity: [
            { icon: "fa-solid fa-circle",      label: "Odoo connected",                    time: "20m ago", dot: "bg-green-500" },
            { icon: "fa-solid fa-gear",        label: "Kafka topic configured",             time: "1h ago"  },
            { icon: "fa-solid fa-rotate",      label: "QuickBooks synchronization completed", time: "2h ago" },
        ],
        btnClass: "btn-violet",
    },
    {
        id: "administration",
        icon: "fa-solid fa-gear",
        iconBg: "bg-orange-100",
        iconColor: "text-orange-600",
        accentColor: "orange",
        title: "Administration",
        subtitle: "Manage platform configuration and security.",
        status: "Healthy",
        statusOk: true,
        lastActivity: "3m ago",
        stats: [
            { icon: "fa-solid fa-users",           label: "Users",               value: "246" },
            { icon: "fa-solid fa-shield-halved",   label: "Roles",               value: "18"  },
            { icon: "fa-solid fa-robot",           label: "AI Providers",        value: "5"   },
            { icon: "fa-solid fa-receipt",         label: "Active Subscription", value: "1"   },
            { icon: "fa-solid fa-bell",            label: "Audit Alerts",        value: "4", warn: true },
        ],
        quickActions: [
            { icon: "fa-solid fa-user-plus",       label: "Add User"        },
            { icon: "fa-solid fa-shield-halved",   label: "Add Role"        },
            { icon: "fa-solid fa-robot",           label: "Add AI Provider" },
        ],
        recentActivity: [
            { icon: "fa-solid fa-user-shield", label: "New administrator added",    time: "30m ago" },
            { icon: "fa-solid fa-robot",       label: "OpenAI provider updated",    time: "1h ago"  },
            { icon: "fa-solid fa-receipt",     label: "Subscription renewed",       time: "6h ago"  },
        ],
        btnClass: "btn-orange",
    },
];

/* ─── Accent colour map ─────────────────────────────────────────────────────── */
const ACCENT = {
    indigo:  { btn: "bg-indigo-600 hover:bg-indigo-700",  statIcon: "text-indigo-500",  action: "text-indigo-600 hover:text-indigo-700",  viewAll: "text-indigo-600", ring: "border-indigo-200" },
    emerald: { btn: "bg-emerald-600 hover:bg-emerald-700", statIcon: "text-emerald-500", action: "text-emerald-600 hover:text-emerald-700", viewAll: "text-emerald-600", ring: "border-emerald-200" },
    violet:  { btn: "bg-violet-600 hover:bg-violet-700",  statIcon: "text-violet-500",  action: "text-violet-600 hover:text-violet-700",  viewAll: "text-violet-600", ring: "border-violet-200" },
    orange:  { btn: "bg-orange-500 hover:bg-orange-600",  statIcon: "text-orange-500",  action: "text-orange-600 hover:text-orange-700",  viewAll: "text-orange-600", ring: "border-orange-200" },
};

/* ─── Sub-components ─────────────────────────────────────────────────────────── */
function StatusBadge({ ok }) {
    return ok ? (
        <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            Healthy
        </span>
    ) : (
        <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
            Attention Required
        </span>
    );
}

function PanelCard({ panel }) {
    const ac = ACCENT[panel.accentColor];

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
            {/* ── Header ── */}
            <div className="p-5 pb-3">
                <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 ${panel.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <i className={`${panel.icon} ${panel.iconColor} text-lg`}></i>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">
                                    {panel.title}
                                </h3>
                                <span className="text-xs text-slate-400 dark:text-slate-500">Platform Status</span>
                                <StatusBadge ok={panel.statusOk} />
                            </div>
                        </div>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap ml-2 mt-1">
                        Last activity: {panel.lastActivity}
                    </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 ml-14">
                    {panel.subtitle}
                </p>
            </div>

            {/* ── Stats bar ── */}
            <div className="flex items-center gap-5 px-5 py-3 border-t border-b border-slate-100 dark:border-slate-700 flex-wrap">
                {panel.stats.map(s => (
                    <div key={s.label} className="flex items-center gap-2 min-w-[60px]">
                        <i className={`${s.icon} ${s.warn ? "text-amber-500" : ac.statIcon} text-sm`}></i>
                        <div>
                            <p className={`text-sm font-bold leading-none ${s.warn ? "text-amber-600" : "text-slate-800 dark:text-slate-100"}`}>
                                {s.value}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-none">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Body: Quick Actions + Recent Activity ── */}
            <div className="flex flex-1 gap-0 divide-x divide-slate-100 dark:divide-slate-700 px-0">
                {/* Quick Actions */}
                <div className="flex-1 p-5 pr-4">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">Quick Actions</p>
                    <div className="space-y-2">
                        {panel.quickActions.map(a => (
                            <button
                                key={a.label}
                                className={`flex items-center gap-2 text-xs font-medium ${ac.action} transition-colors group w-full text-left`}
                            >
                                <span className="w-5 h-5 rounded border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-400 group-hover:border-current group-hover:text-current transition-colors flex-shrink-0">
                                    <i className="fa-solid fa-plus text-[9px]"></i>
                                </span>
                                <span>{a.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="flex-1 p-5 pl-4">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">Recent Activity</p>
                    <div className="space-y-2.5">
                        {panel.recentActivity.map((a, i) => (
                            <div key={i} className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    {a.dot
                                        ? <span className={`w-4 h-4 rounded-full ${a.dot} flex-shrink-0 mt-0.5`}></span>
                                        : <i className={`${a.icon} text-slate-400 dark:text-slate-500 text-xs flex-shrink-0 mt-0.5 w-4 text-center`}></i>
                                    }
                                    <span className="text-xs text-slate-600 dark:text-slate-300 leading-snug truncate">{a.label}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 whitespace-nowrap">{a.time}</span>
                            </div>
                        ))}
                    </div>
                    <button className={`mt-3 text-xs font-medium ${ac.viewAll} transition-colors flex items-center gap-1`}>
                        View all activity
                        <i className="fa-solid fa-arrow-right text-[9px]"></i>
                    </button>
                </div>
            </div>

            {/* ── Footer: Open Workspace ── */}
            <div className="px-5 pb-5 pt-2 flex justify-end">
                <button className={`${ac.btn} text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm`}>
                    Open Workspace
                    <i className="fa-solid fa-arrow-right text-[10px]"></i>
                </button>
            </div>
        </div>
    );
}

/* ─── Main page ─────────────────────────────────────────────────────────────── */
export default function ControlPanel() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
            {/* Page header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Control Panel</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Monitor and manage all platform modules from one place.
                </p>
            </div>

            {/* 2-column grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {PANELS.map(panel => (
                    <PanelCard key={panel.id} panel={panel} />
                ))}
            </div>
        </div>
    );
}
