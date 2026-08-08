import React, { useState } from "react";

/**
 * A filterable list-box selector.
 * Passes a standard DOM change event to onChange, so callers can use e.target.value.
 */
export function SearchableSelect({ options = [], value, onChange, placeholder = "Search…" }) {
    const [filter, setFilter] = useState("");
    const filtered = options.filter(o =>
        (o.label || "").toLowerCase().includes(filter.toLowerCase()),
    );
    return (
        <div>
            <div className="input-group input-group-sm mb-1">
                <span className="input-group-text">
                    <i className="fa fa-search" />
                </span>
                <input
                    className="form-control"
                    placeholder={placeholder}
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                />
                {filter && (
                    <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => setFilter("")}>
                        <i className="fa fa-times" />
                    </button>
                )}
            </div>
            {filtered.length === 0 ? (
                <div className="text-muted small py-1 px-2">No results found.</div>
            ) : (
                <select
                    className="form-control proc-search-select"
                    value={value}
                    onChange={onChange}
                    size={Math.min(Math.max(filtered.length, 1), 6)}>
                    {filtered.map(o => (
                        <option className="p-1" key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
            )}
        </div>
    );
}
