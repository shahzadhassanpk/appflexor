import React from "react";
import { DOC_MANIFEST } from "./DocsNav";

function RelatedDocs({ activeDoc, onSelect }) {
    if (!activeDoc) return null;

    const section = DOC_MANIFEST.find(s => s.slug === activeDoc.section);
    if (!section) return null;

    const related = section.docs.filter(d => d.slug !== activeDoc.slug);
    if (related.length === 0) return null;

    return (
        <div className="docs-related">
            <div className="docs-related-title">
                <i className="fa-solid fa-book-open me-2"></i>
                More in {section.section}
            </div>
            <div className="docs-related-grid">
                {related.map(doc => (
                    <button
                        key={doc.slug}
                        className="docs-related-card"
                        onClick={() => onSelect({ section: section.slug, slug: doc.slug, title: doc.title })}>
                        <div className="docs-related-card-title">{doc.title}</div>
                        <div className="docs-related-card-excerpt">{doc.excerpt}</div>
                        <span className="docs-related-read">
                            Read guide <i className="fa-solid fa-arrow-right" style={{ fontSize: 11 }}></i>
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}

export default RelatedDocs;
