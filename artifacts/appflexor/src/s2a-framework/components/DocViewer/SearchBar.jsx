import React, { useEffect, useRef, useState } from "react";

function SearchBar({ allDocs, onSelect }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);

    // Close on outside click or Esc
    useEffect(() => {
        function handleOut(e) {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
        }
        function handleEsc(e) {
            if (e.key === "Escape") { setOpen(false); setQuery(""); }
        }
        document.addEventListener("mousedown", handleOut);
        document.addEventListener("keydown", handleEsc);
        return () => {
            document.removeEventListener("mousedown", handleOut);
            document.removeEventListener("keydown", handleEsc);
        };
    }, []);

    function handleChange(e) {
        const q = e.target.value;
        setQuery(q);
        if (q.trim().length < 2) {
            setResults([]);
            setOpen(false);
            return;
        }

        const lower = q.toLowerCase();
        const hits = [];

        allDocs.forEach(doc => {
            const titleMatch = doc.title.toLowerCase().includes(lower);
            // Search content — find the line containing the match for an excerpt
            const contentLines = (doc.content || "").split("\n");
            const matchLine = contentLines.find(line =>
                line.toLowerCase().includes(lower) && !line.startsWith("#")
            );
            if (titleMatch || matchLine) {
                hits.push({
                    ...doc,
                    excerpt: matchLine
                        ? matchLine.replace(/[*_`|#]/g, "").trim().slice(0, 90)
                        : doc.excerpt || "",
                    score: titleMatch ? 2 : 1,
                });
            }
        });

        hits.sort((a, b) => b.score - a.score);
        setResults(hits.slice(0, 8));
        setOpen(hits.length > 0);
    }

    function handleSelect(doc) {
        onSelect({ section: doc.section, slug: doc.slug, title: doc.title });
        setQuery("");
        setResults([]);
        setOpen(false);
    }

    return (
        <div className="docs-search-wrap" ref={wrapRef}>
            <div className="docs-search-input-row">
                <i className="fa-solid fa-magnifying-glass docs-search-icon"></i>
                <input
                    type="search"
                    className="docs-search-input"
                    placeholder="Search documentation…"
                    value={query}
                    onChange={handleChange}
                    onFocus={() => results.length > 0 && setOpen(true)}
                    aria-label="Search documentation"
                    autoComplete="off"
                />
                {query && (
                    <button
                        className="docs-search-clear"
                        onClick={() => { setQuery(""); setResults([]); setOpen(false); }}
                        aria-label="Clear search">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                )}
            </div>

            {open && results.length > 0 && (
                <ul className="docs-search-results" role="listbox">
                    {results.map((doc, i) => (
                        <li key={i} role="option">
                            <button
                                className="docs-search-result-item"
                                onClick={() => handleSelect(doc)}>
                                <span className="docs-search-result-section">{doc.sectionLabel}</span>
                                <span className="docs-search-result-title">{doc.title}</span>
                                {doc.excerpt && (
                                    <span className="docs-search-result-excerpt">{doc.excerpt}</span>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default SearchBar;
