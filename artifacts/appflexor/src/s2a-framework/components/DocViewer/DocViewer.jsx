import React, { useEffect, useMemo, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import DocsNav, { DOC_MANIFEST } from "./DocsNav";
import SearchBar from "./SearchBar";
import RelatedDocs from "./RelatedDocs";
import "./doc-viewer.css";

// Load all markdown files at build time
// DocViewer.jsx lives at src/s2a-framework/components/DocViewer/
// content/docs lives at (project-root)/content/docs/ → 4 levels up
const RAW_DOCS = import.meta.glob(
    "../../../../content/docs/**/*.md",
    { query: "?raw", import: "default", eager: true }
);

// Build flat doc list with content attached
function buildAllDocs() {
    const list = [];
    DOC_MANIFEST.forEach(section => {
        section.docs.forEach(doc => {
            const key = `../../../../content/docs/${section.slug}/${doc.slug}.md`;
            list.push({
                section: section.slug,
                sectionLabel: section.section,
                slug: doc.slug,
                title: doc.title,
                excerpt: doc.excerpt,
                content: RAW_DOCS[key] || "",
            });
        });
    });
    return list;
}

const ALL_DOCS = buildAllDocs();

function getContent(section, slug) {
    const key = `../../../../content/docs/${section}/${slug}.md`;
    return RAW_DOCS[key] || "# Content not found\n\nThis guide could not be loaded.";
}

// ── Main DocViewer ───────────────────────────────────────────

function DocViewer() {
    const [activeDoc, setActiveDoc] = useState(null); // null = overview

    function handleSelect(doc) {
        setActiveDoc(doc);
        // scroll content panel back to top
        const panel = document.getElementById("docContentPanel");
        if (panel) panel.scrollTop = 0;
    }

    return (
        <div
            className="offcanvas offcanvas-end"
            tabIndex="-1"
            id="docViewerOffcanvas"
            aria-labelledby="docViewerLabel">

            {/* Header */}
            <div className="offcanvas-header">
                <div className="docs-header-title" id="docViewerLabel">
                    <i className="fa-regular fa-circle-question"></i>
                    Help &amp; Documentation
                </div>
                <SearchBar allDocs={ALL_DOCS} onSelect={doc => {
                    handleSelect(doc);
                }} />
                <button
                    type="button"
                    className="docs-close-btn"
                    data-bs-dismiss="offcanvas"
                    aria-label="Close documentation">
                    <i className="fa-solid fa-xmark"></i>
                </button>
            </div>

            {/* Body: nav + content */}
            <div className="offcanvas-body">
                <DocsNav activeDoc={activeDoc} onSelect={handleSelect} />

                <div className="docs-content-panel" id="docContentPanel">
                    {activeDoc
                        ? <DocPage doc={activeDoc} onSelect={handleSelect} />
                        : <DocsOverview onSelect={handleSelect} />
                    }
                </div>
            </div>
        </div>
    );
}

// ── Overview (home) ──────────────────────────────────────────

function DocsOverview({ onSelect }) {
    return (
        <div>
            <div className="docs-overview-title">Appflexor Documentation</div>
            <div className="docs-overview-sub">
                Browse guides for building, configuring, and administrating your Appflexor platform.
            </div>

            {DOC_MANIFEST.map(section => (
                <div key={section.slug} className="docs-section-group">
                    <div className="docs-section-group-title">
                        <i className={section.icon}></i>
                        {section.section}
                    </div>
                    <div className="docs-card-grid">
                        {section.docs.map(doc => (
                            <button
                                key={doc.slug}
                                className="docs-overview-card"
                                onClick={() => onSelect({
                                    section: section.slug,
                                    slug: doc.slug,
                                    title: doc.title,
                                })}>
                                <div className="docs-overview-card-title">{doc.title}</div>
                                <div className="docs-overview-card-excerpt">{doc.excerpt}</div>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Single doc page ──────────────────────────────────────────

function DocPage({ doc, onSelect }) {
    const content = useMemo(
        () => getContent(doc.section, doc.slug),
        [doc.section, doc.slug]
    );

    return (
        <div>
            <article className="docs-md">
                <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
            </article>
            <RelatedDocs activeDoc={doc} onSelect={onSelect} />
        </div>
    );
}

export default DocViewer;
