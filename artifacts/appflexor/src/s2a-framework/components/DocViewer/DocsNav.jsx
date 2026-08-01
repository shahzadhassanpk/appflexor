import React, { useState } from "react";

export const DOC_MANIFEST = [
    {
        section: "Capture",
        slug: "capture",
        icon: "fa-solid fa-table-list",
        docs: [
            { title: "AppFlexor Forms", slug: "forms", excerpt: "Design data-capture forms for pages and process steps" },
            { title: "AppFlexor APIs", slug: "apis", excerpt: "Build SQL-backed REST endpoints and connect external systems" },
        ],
    },
    {
        section: "Orchestrate",
        slug: "orchestrate",
        icon: "fa-solid fa-diagram-project",
        docs: [
            { title: "Business Areas", slug: "business-areas", excerpt: "Define top-level organisational domains for processes" },
            { title: "Process Categories", slug: "process-categories", excerpt: "Organise processes into structured sub-groups" },
        ],
    },
    {
        section: "Integrate",
        slug: "integrate",
        icon: "fa-solid fa-plug",
        docs: [
            { title: "Connector", slug: "connector", excerpt: "Integrate external systems as External Workers in process flows" },
        ],
    },
    {
        section: "Administrate",
        slug: "administrate",
        icon: "fa-solid fa-gear",
        docs: [
            { title: "Users, Groups & Organisations", slug: "users", excerpt: "Manage accounts, groups, and organisational structures" },
            { title: "Web Sites", slug: "websites", excerpt: "Configure sites, pages, styles, and access authorisation" },
            { title: "Web Content & Data", slug: "content", excerpt: "Create content, forms, data lists, and SQL APIs" },
            { title: "Reports & Analytics", slug: "reports", excerpt: "Deploy reports, design analytic cubes, and run queries" },
            { title: "Subscription", slug: "subscription", excerpt: "Manage billing, packages, and user limits" },
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
