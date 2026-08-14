import axios from "axios";
import React, { useEffect, useState } from "react";
import ReactBpmn from "react-bpmn";
import { API_URL, FILE_URL } from "../../Config";

/* ════════════════════════════════════════════════════════════════════════════
   ProcessModelViewer
   Right panel — renders the live BPMN diagram for the selected scenario's
   process.  Fetches sys.tenant.process on demand, resolves the file URL,
   and hands it to ReactBpmn.  Token simulation stays disabled (Task #26+).
   ════════════════════════════════════════════════════════════════════════════ */

/* Viewer states */
const STATE = {
    idle:       "idle",        // no scenario / no processKey
    loading:    "loading",     // fetching tenant process records
    found:      "found",       // tenant record + BPMN file located → render
    noFile:     "noFile",      // tenant record found but process_file is blank
    notDeployed:"notDeployed", // no matching tenant record for this key
    error:      "error",       // network / API failure
};

function ProcessModelViewer({ scenario, initialProcess }) {
    const processTitle = scenario?.processTitle || scenario?.processKey || initialProcess?.title;
    const processKey   = scenario?.processKey   || initialProcess?.process_key || "";

    /* ── resolved BPMN state ───────────────────────────────────────────── */
    const [viewState, setViewState] = useState(STATE.idle);
    const [bpmnUrl,   setBpmnUrl]   = useState("");
    /* cache-bust key: incremented on explicit refresh (future use) */
    const [bustKey,   setBustKey]   = useState(0);

    /* ── fetch tenant process and resolve BPMN file URL ───────────────── */
    useEffect(() => {
        if (!processKey) {
            setViewState(STATE.idle);
            setBpmnUrl("");
            return;
        }

        setViewState(STATE.loading);
        setBpmnUrl("");

        axios
            .post(`${API_URL}?service.key=masterKey.tenantData`, {
                dataKeys: [
                    {
                        serviceParams: "",
                        dataKey: "tenantProcess",
                        serviceKey: "sys.tenant.process",
                        mode: "formData",
                    },
                ],
            })
            .then(res => {
                if (res.data?.C_STATUS !== "SUCCESS") {
                    setViewState(STATE.error);
                    return;
                }

                const list = res.data.C_DATA?.tenantProcess || [];
                const match = list.find(
                    tp => (tp.process_def_key || "").toLowerCase().trim()
                       === processKey.toLowerCase().trim()
                );

                if (!match) {
                    setViewState(STATE.notDeployed);
                    return;
                }

                if (!match.process_file) {
                    setViewState(STATE.noFile);
                    return;
                }

                const url =
                    FILE_URL +
                    "/process/" +
                    encodeURIComponent(match.id) +
                    "/" +
                    encodeURIComponent(match.process_file);

                setBpmnUrl(url);
                setViewState(STATE.found);
            })
            .catch(() => setViewState(STATE.error));
    }, [processKey, bustKey]);

    /* ── no scenario selected ────────────────────────────────────────────── */
    if (!scenario) {
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

            {/* ── panel header ─────────────────────────────────────────── */}
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

                {/* Run Simulation — disabled until token simulation is implemented */}
                <button
                    type="button"
                    className="orch-add-btn"
                    disabled
                    title="Token simulation coming in the next release">
                    <i className="fa-solid fa-circle-play" aria-hidden="true" />
                    Run Simulation
                </button>
            </div>

            {/* ── scenario meta strip ──────────────────────────────────── */}
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

            {/* ── BPMN area ────────────────────────────────────────────── */}
            <div className="psim-bpmn-area">

                {/* loading */}
                {viewState === STATE.loading && (
                    <div className="psim-bpmn-status">
                        <i className="fa-solid fa-circle-notch fa-spin" aria-hidden="true" />
                        <span>Loading diagram…</span>
                    </div>
                )}

                {/* no processKey on the scenario */}
                {viewState === STATE.idle && (
                    <div className="psim-bpmn-status">
                        <i className="fa-solid fa-diagram-project" aria-hidden="true" />
                        <p className="psim-bpmn-status-title">No process selected</p>
                        <p className="psim-bpmn-status-hint">
                            Edit this scenario and pick a target process to view its diagram.
                        </p>
                    </div>
                )}

                {/* not deployed in the engine */}
                {viewState === STATE.notDeployed && (
                    <div className="psim-bpmn-status psim-bpmn-status--warn">
                        <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
                        <p className="psim-bpmn-status-title">Process not deployed</p>
                        <p className="psim-bpmn-status-hint">
                            No deployed instance found for key{" "}
                            <code className="psim-code">{processKey}</code>.
                            Deploy the process first from the Orchestrate page.
                        </p>
                    </div>
                )}

                {/* deployed but BPMN file missing */}
                {viewState === STATE.noFile && (
                    <div className="psim-bpmn-status psim-bpmn-status--warn">
                        <i className="fa-solid fa-file-circle-question" aria-hidden="true" />
                        <p className="psim-bpmn-status-title">Diagram not available</p>
                        <p className="psim-bpmn-status-hint">
                            The process is deployed but no BPMN file is attached to its definition.
                        </p>
                    </div>
                )}

                {/* API / network error */}
                {viewState === STATE.error && (
                    <div className="psim-bpmn-status psim-bpmn-status--error">
                        <i className="fa-solid fa-circle-xmark" aria-hidden="true" />
                        <p className="psim-bpmn-status-title">Could not load diagram</p>
                        <p className="psim-bpmn-status-hint">
                            There was a problem fetching the process definition. Check your connection and try again.
                        </p>
                        <button
                            type="button"
                            className="orch-add-btn mt-2"
                            onClick={() => setBustKey(k => k + 1)}>
                            <i className="fa-solid fa-rotate-right" aria-hidden="true" />
                            Retry
                        </button>
                    </div>
                )}

                {/* BPMN diagram */}
                {viewState === STATE.found && bpmnUrl && (
                    <div className="psim-bpmn-container">
                        <ReactBpmn
                            url={`${bpmnUrl}?v=${bustKey}&t=${Date.now()}`}
                        />
                    </div>
                )}
            </div>

            {/* ── notes strip ──────────────────────────────────────────── */}
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
