import React from "react";

/* ════════════════════════════════════════════════════════════════════════════
   ProcessModelViewer
   Right panel — shows the BPMN diagram for the selected scenario's process.
   BPMN token simulation is NOT implemented in this shell (planned next step).
   ════════════════════════════════════════════════════════════════════════════ */
function ProcessModelViewer({ scenario, initialProcess }) {
    const hasScenario = !!scenario;
    const processTitle = scenario?.processTitle || scenario?.processKey || initialProcess?.title;
    const processKey   = scenario?.processKey   || initialProcess?.process_key;

    /* ── no scenario selected ────────────────────────────────────────────── */
    if (!hasScenario) {
        return (
            <div className="psim-panel psim-viewer-panel">
                <div className="orch-panel-header">
                    <div className="d-flex align-items-start gap-2 flex-1 min-w-0">
                        <span className="orch-panel-icon">
                            <i className="fa-solid fa-diagram-project" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                            <div className="orch-panel-title">Process Model</div>
                            <div className="orch-panel-desc">
                                Select a scenario on the left to view its process model here.
                            </div>
                        </div>
                    </div>
                </div>

                <div className="psim-viewer-empty">
                    <i className="fa-solid fa-diagram-project" aria-hidden="true" />
                    <p className="psim-viewer-empty-title">No scenario selected</p>
                    <p className="psim-viewer-empty-hint">
                        Choose a simulation scenario from the list, or create a new one to get started.
                    </p>
                </div>
            </div>
        );
    }

    /* ── scenario selected ───────────────────────────────────────────────── */
    return (
        <div className="psim-panel psim-viewer-panel">

            {/* header */}
            <div className="orch-panel-header">
                <div className="d-flex align-items-start gap-2 flex-1 min-w-0">
                    <span className="orch-panel-icon">
                        <i className="fa-solid fa-diagram-project" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                        <div className="orch-panel-title">
                            {processTitle || "Process Model"}
                        </div>
                        {processKey && (
                            <div className="orch-panel-desc">
                                Process key: <code className="psim-code">{processKey}</code>
                            </div>
                        )}
                    </div>
                </div>

                {/* placeholder run button — simulation not yet wired */}
                <button
                    type="button"
                    className="orch-add-btn"
                    disabled
                    title="Token simulation coming in the next release">
                    <i className="fa-solid fa-circle-play" aria-hidden="true" />
                    Run Simulation
                </button>
            </div>

            {/* scenario meta strip */}
            <div className="psim-scenario-meta">
                <div className="psim-meta-item">
                    <i className="fa-solid fa-flask-vial" aria-hidden="true" />
                    <span>{scenario.name}</span>
                </div>
                {scenario.description && (
                    <div className="psim-meta-item psim-meta-desc">
                        {scenario.description}
                    </div>
                )}
            </div>

            {/* BPMN canvas placeholder */}
            <div className="psim-bpmn-placeholder">
                <div className="psim-bpmn-placeholder-inner">
                    <i className="fa-solid fa-map" aria-hidden="true" />
                    <p className="psim-bpmn-placeholder-title">BPMN Diagram</p>
                    <p className="psim-bpmn-placeholder-hint">
                        Process model viewer with token-level simulation will be rendered here.
                    </p>
                    {processKey ? (
                        <span className="psim-bpmn-proc-badge">
                            <i className="fa-solid fa-key" aria-hidden="true" />
                            {processKey}
                        </span>
                    ) : (
                        <span className="psim-bpmn-no-key">
                            No process key set — edit the scenario to add one.
                        </span>
                    )}
                </div>
            </div>

            {/* notes (if any) */}
            {scenario.notes && (
                <div className="psim-notes">
                    <i className="fa-solid fa-note-sticky" aria-hidden="true" />
                    <span>{scenario.notes}</span>
                </div>
            )}
        </div>
    );
}

export default ProcessModelViewer;
