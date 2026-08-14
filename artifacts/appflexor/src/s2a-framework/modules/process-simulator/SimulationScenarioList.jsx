import React, { useState } from "react";

/* ════════════════════════════════════════════════════════════════════════════
   SimulationScenarioList
   Left panel — lists, searches, selects, adds, edits, deletes scenarios.
   ════════════════════════════════════════════════════════════════════════════ */
function SimulationScenarioList({
    scenarios,
    selectedScenario,
    onSelect,
    onAdd,
    onEdit,
    onDelete,
}) {
    const [searchTerm, setSearchTerm] = useState("");

    const q = searchTerm.toLowerCase().trim();
    const visible = q
        ? scenarios.filter(s =>
            s.name?.toLowerCase().includes(q) ||
            s.description?.toLowerCase().includes(q) ||
            s.processTitle?.toLowerCase().includes(q)
        )
        : scenarios;

    return (
        <div className="psim-panel">

            {/* ── panel header ─────────────────────────────────────────── */}
            <div className="orch-panel-header">
                <div className="d-flex align-items-start gap-2 flex-1 min-w-0">
                    <span className="orch-panel-icon">
                        <i className="fa-solid fa-list-check" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                        <div className="orch-panel-title">Simulation Scenarios</div>
                        <div className="orch-panel-desc">
                            Define and manage test scenarios for your processes.
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
                        placeholder="Search scenarios…"
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

            {/* ── list ─────────────────────────────────────────────────── */}
            <div className="psim-scenario-list">

                {/* empty state */}
                {visible.length === 0 && (
                    <div className="orch-empty-state">
                        <i className="fa-solid fa-flask" aria-hidden="true" />
                        <p>{scenarios.length === 0
                            ? "No scenarios yet"
                            : "No matching scenarios"}
                        </p>
                        {scenarios.length === 0 && (
                            <button type="button" className="orch-add-btn" onClick={onAdd}>
                                <i className="fa-solid fa-plus" aria-hidden="true" />
                                Create First Scenario
                            </button>
                        )}
                    </div>
                )}

                {/* scenario rows */}
                {visible.map(scenario => {
                    const isSelected = selectedScenario?.id === scenario.id;
                    return (
                        <div
                            key={scenario.id}
                            className={`psim-scenario-item${isSelected ? " psim-scenario-item--selected" : ""}`}
                            onClick={() => onSelect(scenario)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={e => e.key === "Enter" && onSelect(scenario)}>

                            {/* icon */}
                            <span className="psim-scenario-icon-wrap">
                                <i className="fa-solid fa-flask-vial" aria-hidden="true" />
                            </span>

                            {/* text */}
                            <div className="psim-scenario-text">
                                <div className="psim-scenario-name">{scenario.name}</div>
                                {scenario.processTitle && (
                                    <div className="psim-scenario-proc">
                                        <i className="fa-solid fa-diagram-project" aria-hidden="true" />
                                        {scenario.processTitle}
                                    </div>
                                )}
                                {scenario.description && (
                                    <div className="psim-scenario-desc">{scenario.description}</div>
                                )}
                            </div>

                            {/* actions */}
                            <div className="psim-scenario-actions">
                                <button
                                    type="button"
                                    className="orch-icon-btn"
                                    title="Edit scenario"
                                    onClick={e => { e.stopPropagation(); onEdit(scenario); }}>
                                    <i className="fa-regular fa-pen-to-square" aria-hidden="true" />
                                </button>
                                <button
                                    type="button"
                                    className="orch-icon-btn danger"
                                    title="Delete scenario"
                                    onClick={e => { e.stopPropagation(); onDelete(scenario); }}>
                                    <i className="fa-regular fa-trash-can" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default SimulationScenarioList;
