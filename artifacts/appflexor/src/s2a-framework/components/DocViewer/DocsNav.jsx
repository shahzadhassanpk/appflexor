import React, { useState } from "react";

export const DOC_MANIFEST = [
    {
        section: "Capture",
        slug: "capture",
        icon: "fa-solid fa-table-list",
        docs: [
            { title: "Data Intake using Web Forms", slug: "forms", excerpt: "Take structured information through web forms and trigger processes." },
            { title: "Data Intake using APIs", slug: "apis", excerpt: "Receive business data from external systems and trigger relevant processes." },
            { title: "Data Enrichment using AI", slug: "ai-agent", excerpt: "Validate, classify, and enrich captured data with context-aware AI agents." },
        ],
    },
    {
        section: "Orchestrate",
        slug: "orchestrate",
        icon: "fa-solid fa-diagram-project",
        docs: [
            { title: "Business Areas", slug: "business-areas", excerpt: "Define and manage business domains for processes." },
            { title: "Governing Bodies", slug: "governing-bodies", excerpt: "Assign the teams responsible for process approvals and policy." },
            { title: "Process Categories", slug: "process-categories", excerpt: "Define the strategic intent represented by each process category." },
            { title: "Deploy Process", slug: "deploy-process", excerpt: "Launch new or updated processes into production." },
            { title: "Monitor Process", slug: "monitor-process", excerpt: "Track performance and status of running processes." },
            { title: "Task Automation", slug: "ai-agent", excerpt: "Use AI, Data APIs, and external systems inside workflows for task automation." },
        ],
    },
    {
        section: "Integrate",
        slug: "integrate",
        icon: "fa-solid fa-plug",
        docs: [
            { title: "External Systems Integration", slug: "connector", excerpt: "Integrate external systems with your processes as external workers." },
            { title: "AI Agent", slug: "ai-agent", excerpt: "Strengthen external connectors with contextual AI intelligence" },
        ],
    },
    {
        section: "Administrate",
        slug: "administrate",
        icon: "fa-solid fa-gear",
        docs: [
            { title: "People and Organizations", slug: "users", excerpt: "Manage user accounts, group memberships, and organizational structures." },
            { title: "User Experience", slug: "websites", excerpt: "Configure menus and pages for tasks, data, charts, reports, and authorized audiences." },
            { title: "Knowledge Base", slug: "content", excerpt: "Create web content, posts, and digital assets for internal and external audiences." },
            { title: "Custom Reports and Analytics", slug: "reports", excerpt: "Analyze data streams and generate insights for decision-making." },
            { title: "Subscription", slug: "subscription", excerpt: "Manage billing, subscriptions, and payment processing." },
            { title: "AI Provider Services", slug: "ai-services", excerpt: "Configure AI providers, agents, and task definitions for workflow automation." },
        ],
    },
];

function DocsNav({ activeDoc, onSelect }) {
    const [collapsed, setCollapsed] = useState({});

    function toggle(slug) {
        setCollapsed(prev => ({ ...prev, [slug]: !prev[slug] }));
    }

    function isActive(section, doc) {
        return activeDoc?.section === section.slug && activeDoc?.slug === doc.slug;
    }

    return (
        <nav className="docs-nav">
            <button
                className="docs-nav-home"
                onClick={() => onSelect(null)}
                title="Back to overview">
                <i className="fa-solid fa-house-chimney"></i>
                <span>Documentation Home</span>
            </button>

            {DOC_MANIFEST.map(section => (
                <div key={section.slug} className="docs-nav-section">
                    <button
                        className="docs-nav-section-header"
                        onClick={() => toggle(section.slug)}
                        aria-expanded={!collapsed[section.slug]}>
                        <span className="docs-nav-section-label">
                            <i className={`${section.icon} docs-nav-section-icon`}></i>
                            {section.section}
                        </span>
                        <i className={`fa-solid fa-chevron-down docs-nav-chevron ${collapsed[section.slug] ? "collapsed" : ""}`}></i>
                    </button>

                    {!collapsed[section.slug] && (
                        <ul className="docs-nav-list">
                            {section.docs.map(doc => (
                                <li key={doc.slug}>
                                    <button
                                        className={`docs-nav-item ${isActive(section, doc) ? "active" : ""}`}
                                        onClick={() => onSelect({ section: section.slug, slug: doc.slug, title: doc.title })}>
                                        {doc.title}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ))}
        </nav>
    );
}

export default DocsNav;
