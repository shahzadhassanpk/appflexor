import React, { useState } from "react";
import { formatDateTimeForUserView } from "../../utils/utils";

/* ════════════════════════════════════════════════════════════════════════════
   SimulationScenarioList
   Left panel — searchable card list of scenarios with rich metadata display.
   Actions: Open (select for BPMN view), Edit, Run (future), Delete.
   ════════════════════════════════════════════════════════════════════════════ */

const TAG_COLORS = {
    "baseline":     { bg: "#dbeafe", color: "#1e40af", border: "#bfdbfe" },
    "stress-test":  { bg: "#fee2e2", color: "#991b1b", border: "#fecaca" },
    "optimistic":   { bg: "#dcfce7", color: "#166534", border: "#bbf7d0" },
    "pessimistic":  { bg: "#ffedd5", color: "#92400e", border: "#fed7aa" },
};

function tagStyle(tag) {
    const t = (tag || "").toLowerCase();
    return TAG_COLORS[t] || { bg: "#f3f4f6", color: "#374151", border: "#e5e7eb" };
}

function shortId(id) {
    if (!id) return "—";
    return id.length > 13 ? id.slice(0, 8) + "…" : id;
}

function fmtDate(val) {
    if (!val) return null;
    try { return formatDateTimeForUserView(val); } catch { return val; }
}

/* ── scenario card ─────────────────────────────────────────────────────── */
function ScenarioCard({ scenario, isSelected, onOpen, onEdit, onDelete, onRun }) {
    const meta        = scenario.metadata    || {};
    const tags        = Array.isArray(meta.tags) ? meta.tags : [];
    const author      = meta.author          || "";
    const lastRun     = meta.last_run        || null;
    const createdAt   = fmtDate(scenario.created_at);
    const lastRunFmt  = lastRun ? fmtDate(lastRun) : null;

    return (
        <div
            className={`psim-card${isSelected ? " psim-card--selected" : ""}`}
            onClick={() => onOpen(scenario)}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === "Enter" && onOpen(scenario)}>

            {/* ── row 1: icon + name + actions ─────────────────────────── */}
            <div className="psim-card-row1">
                <span className="psim-card-icon">
                    <i className="fa-solid fa-flask-vial" aria-hidden="true" />
                </span>
                <span className="psim-card-name" title={scenario.name}>{scenario.name}</span>

                <div className="psim-card-actions" onClick={e => e.stopPropagation()}>
                    <button
                        type="button"
                        className="orch-icon-btn psim-action-open"
                        title="Open in viewer"
                        onClick={() => onOpen(scenario)}>
                        <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        className="orch-icon-btn"
                        title="Edit scenario"
                        onClick={() => onEdit(scenario)}>
                        <i className="fa-regular fa-pen-to-square" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        className="orch-icon-btn psim-action-run"
                        title="Run simulation (coming soon)"
                        disabled
                        onClick={() => onRun(scenario)}>
                        <i className="fa-solid fa-circle-play" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        className="orch-icon-btn danger"
                        title="Delete scenario"
                        onClick={() => onDelete(scenario)}>
                        <i className="fa-regular fa-trash-can" aria-hidden="true" />
                    </button>
                </div>
            </div>

            {/* ── row 2: ID · process model ────────────────────────────── */}
            <div className="psim-card-row2">
                <span className="psim-card-id" title={scenario.id}>
                    <i className="fa-solid fa-fingerprint" aria-hidden="true" />
                    {shortId(scenario.id)}
                </span>
                {scenario.model_ref && (
                    <span className="psim-card-model">
                        <i className="fa-solid fa-diagram-project" aria-hidden="true" />
                        {scenario.model_ref}
                    </span>
                )}
            </div>

            {/* ── row 3: tags ──────────────────────────────────────────── */}
            {tags.length > 0 && (
                <div className="psim-card-tags">
                    {tags.map(tag => {
                        const s = tagStyle(tag);
                        return (
                            <span
                                key={tag}
                                className="psim-tag"
                                style={{ background: s.bg, color: s.color, borderColor: s.border }}>
                                {tag}
                            </span>
                        );
                    })}
                </div>
            )}

            {/* ── row 4: author · created at · last run ────────────────── */}
            <div className="psim-card-footer">
                {author && (
                    <span className="psim-card-footer-item">
                        <i className="fa-regular fa-user" aria-hidden="true" />
                        {author}
                    </span>
                )}
                {createdAt && (
                    <span className="psim-card-footer-item">
                        <i className="fa-regular fa-calendar" aria-hidden="true" />
                        {createdAt}
                    </span>
                )}
                <span className="psim-card-footer-item">
                    <i className="fa-solid fa-circle-play" aria-hidden="true" />
                    {lastRunFmt ? `Last run: ${lastRunFmt}` : "Never run"}
                </span>
            </div>
        </div>
    );
}

/* ── main list ─────────────────────────────────────────────────────────── */
function SimulationScenarioList({
    scenarios,
    selectedScenario,
    onAdd,
    onOpen,
    onEdit,
    onDelete,
    onRun,
}) {
    const [searchTerm, setSearchTerm] = useState("");

    const q = searchTerm.toLowerCase().trim();
    const visible = q
        ? scenarios.filter(s => {
            const meta = s.metadata || {};
            const tags = (meta.tags || []).join(" ");
            return (
                s.name?.toLowerCase().includes(q) ||
                s.model_ref?.toLowerCase().includes(q) ||
                meta.author?.toLowerCase().includes(q) ||
                meta.description?.toLowerCase().includes(q) ||
                tags.toLowerCase().includes(q)
            );
        })
        : scenarios;

    return (
        <div className="psim-panel">

            {/* ── header ───────────────────────────────────────────────── */}
            <div className="orch-panel-header">
                <div className="d-flex align-items-start gap-2 flex-1 min-w-0">
                    <span className="orch-panel-icon">
                        <i className="fa-solid fa-list-check" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                        <div className="orch-panel-title">Simulation Scenarios</div>
                        <div className="orch-panel-desc">
                            Define and manage what-if scenarios for your processes.
                        </div>
                    </div>
                </div>
                <button type="button" className="orch-add-btn" onClick={onAdd}>
                    <i className="fa-solid fa-plus" aria-hidden="true" />
                    New Scenario
                </button>
            </div>

            {/* ── search ───────────────────────────────────────────────── */}
            <div className="psim-search-row px-2 py-2">
                <div className="orch-search" style={{ maxWidth: "100%" }}>
                    <i className="fa-solid ms-2 fa-magnifying-glass orch-search-icon" aria-hidden="true" />
                    <input
                        type="text"
                        className="orch-search-input"
                        placeholder="Search by name, process, tag, author…"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        aria-label="Search scenarios"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            className="orch-search-clear"
                            onClick={() => setSearchTerm("")}
                            aria-label="Clear search">
                            <i className="fa-solid fa-xmark" aria-hidden="true" />
                        </button>
                    )}
                </div>
            </div>

            {/* count strip */}
            {scenarios.length > 0 && (
                <div className="psim-count-strip">
                    <span>{scenarios.length} scenario{scenarios.length !== 1 ? "s" : ""}</span>
                    {q && visible.length !== scenarios.length && (
                        <span className="psim-count-filtered">· {visible.length} matching</span>
                    )}
                </div>
            )}

            {/* ── list ─────────────────────────────────────────────────── */}
            <div className="psim-scenario-list">

                {visible.length === 0 && (
                    <div className="orch-empty-state">
                        <i className="fa-solid fa-flask" aria-hidden="true" />
                        <p>{scenarios.length === 0 ? "No scenarios yet" : "No matching scenarios"}</p>
                        {scenarios.length === 0 && (
                            <button type="button" className="orch-add-btn" onClick={onAdd}>
                                <i className="fa-solid fa-plus" aria-hidden="true" />
                                Create First Scenario
                            </button>
                        )}
                    </div>
                )}

                {visible.map(scenario => (
                    <ScenarioCard
                        key={scenario.id}
                        scenario={scenario}
                        isSelected={selectedScenario?.id === scenario.id}
                        onOpen={onOpen}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onRun={onRun}
                    />
                ))}
            </div>
        </div>
    );
}

export default SimulationScenarioList;
