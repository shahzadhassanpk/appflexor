import axios from "axios";
import React, { useEffect, useState } from "react";
import ModuleFormViewer from "../../components/ModuleFormViewer/ModuleFormViewer";
import { SearchableSelect } from "../process-configuration/processes/SearchableSelect";
import { API_URL } from "../../Config";

/* ════════════════════════════════════════════════════════════════════════════
   SimulationScenarioForm
   Add / edit a simulation scenario.
   "Target Process" is a searchable dropdown populated from the live
   process.map API — selecting a process auto-fills the title.
   ════════════════════════════════════════════════════════════════════════════ */
const SCENARIO_INIT = {
    id: "",
    name: "",
    processKey: "",
    processTitle: "",
    description: "",
    notes: "",
};

function SimulationScenarioForm({ scenario, onSave, onCancel }) {
    const isEdit = !!(scenario?.id);
    const [form, setForm] = useState(
        scenario
            ? { ...SCENARIO_INIT, ...scenario }
            : { ...SCENARIO_INIT }
    );

    /* ── process list from API ─────────────────────────────────────────── */
    const [processes, setProcesses] = useState([]);
    const [loadingProcs, setLoadingProcs] = useState(true);
    const [procsError, setProcsError] = useState(false);

    useEffect(() => {
        setLoadingProcs(true);
        setProcsError(false);
        axios
            .post(`${API_URL}?service.key=masterKey.tenantData`, {
                dataKeys: [
                    {
                        serviceParams: "",
                        dataKey: "processMap",
                        serviceKey: "process.map",
                        mode: "formData",
                    },
                ],
            })
            .then(res => {
                if (res.data?.C_STATUS === "SUCCESS") {
                    const list = (res.data.C_DATA?.processMap || [])
                        .filter(p => p.process_key);
                    setProcesses(list);
                } else {
                    setProcsError(true);
                }
            })
            .catch(() => setProcsError(true))
            .finally(() => setLoadingProcs(false));
    }, []);

    /* ── select options ────────────────────────────────────────────────── */
    const procOptions = processes.map(p => ({
        value: p.process_key,
        label: p.title ? `${p.title}  (${p.process_key})` : p.process_key,
    }));

    /* ── handlers ──────────────────────────────────────────────────────── */
    function set(field, value) {
        setForm(prev => ({ ...prev, [field]: value }));
    }

    function handleProcessSelect(e) {
        const key = e.target.value;
        const match = processes.find(p => p.process_key === key);
        setForm(prev => ({
            ...prev,
            processKey: key,
            processTitle: match?.title || prev.processTitle,
        }));
    }

    function handleClearProcess() {
        setForm(prev => ({ ...prev, processKey: "", processTitle: "" }));
    }

    function handleSave() {
        if (!form.name.trim()) return;
        onSave({ ...form, name: form.name.trim() });
    }

    const isValid = form.name.trim().length > 0;

    /* ── derive display label for currently selected process ───────────── */
    const selectedProc = processes.find(p => p.process_key === form.processKey);
    const selectedLabel = selectedProc?.title || form.processKey;

    return (
        <ModuleFormViewer
            showModal={true}
            handleClose={onCancel}
            modalTitle={isEdit ? "Edit Scenario" : "New Simulation Scenario"}
            size="lg">

            <div className="col-12 form-background pt-2 pb-3 px-3">

                {/* ── Scenario Name ─────────────────────────────────────── */}
                <div className="mb-3">
                    <label className="fw-semibold mt-1">
                        Scenario Name <span className="text-danger">*</span>
                    </label>
                    <input
                        type="text"
                        className="form-control mt-1"
                        placeholder="e.g. Happy path — new customer onboarding"
                        value={form.name}
                        onChange={e => set("name", e.target.value)}
                    />
                </div>

                {/* ── Target Process ────────────────────────────────────── */}
                <div className="mb-3">
                    <label className="fw-semibold mt-1">Target Process</label>

                    {/* selected process badge */}
                    {form.processKey && (
                        <div className="psim-selected-proc-badge mt-1">
                            <i className="fa-solid fa-diagram-project" aria-hidden="true" />
                            <span className="psim-selected-proc-title">{selectedLabel}</span>
                            <code className="psim-selected-proc-key">{form.processKey}</code>
                            <button
                                type="button"
                                className="psim-selected-proc-clear"
                                onClick={handleClearProcess}
                                title="Clear selection"
                                aria-label="Clear process selection">
                                <i className="fa-solid fa-xmark" aria-hidden="true" />
                            </button>
                        </div>
                    )}

                    {/* process picker */}
                    {!form.processKey && (
                        <div className="mt-1">
                            {loadingProcs && (
                                <div className="psim-proc-loading">
                                    <i className="fa-solid fa-circle-notch fa-spin" aria-hidden="true" />
                                    <span>Loading processes…</span>
                                </div>
                            )}

                            {!loadingProcs && procsError && (
                                <div className="psim-proc-error">
                                    <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
                                    <span>Could not load processes. Enter the key manually:</span>
                                    <input
                                        type="text"
                                        className="form-control form-control-sm mt-1"
                                        placeholder="e.g. customer-onboarding"
                                        value={form.processKey}
                                        onChange={e => set("processKey", e.target.value)}
                                    />
                                </div>
                            )}

                            {!loadingProcs && !procsError && procOptions.length === 0 && (
                                <div className="psim-proc-empty">
                                    <i className="fa-solid fa-inbox" aria-hidden="true" />
                                    <span>No processes found. Deploy a process first.</span>
                                </div>
                            )}

                            {!loadingProcs && !procsError && procOptions.length > 0 && (
                                <SearchableSelect
                                    options={procOptions}
                                    value={form.processKey}
                                    onChange={handleProcessSelect}
                                    placeholder="Search processes…"
                                />
                            )}
                        </div>
                    )}

                    <small className="text-muted">
                        Select the deployed business process this scenario targets.
                    </small>
                </div>

                {/* ── Description ───────────────────────────────────────── */}
                <div className="mb-3">
                    <label className="fw-semibold mt-1">Description</label>
                    <textarea
                        className="form-control mt-1"
                        rows={3}
                        placeholder="Describe what this scenario tests…"
                        value={form.description}
                        onChange={e => set("description", e.target.value)}
                    />
                </div>

                {/* ── Notes ─────────────────────────────────────────────── */}
                <div className="mb-1">
                    <label className="fw-semibold mt-1">Notes</label>
                    <textarea
                        className="form-control mt-1"
                        rows={2}
                        placeholder="Internal notes or assumptions…"
                        value={form.notes}
                        onChange={e => set("notes", e.target.value)}
                    />
                </div>
            </div>

            {/* footer */}
            <div className="modal-footer pe-0">
                <button
                    type="button"
                    className="btn button-theme btn-sm me-2"
                    onClick={handleSave}
                    disabled={!isValid}>
                    <i className="fa-solid fa-floppy-disk pe-1" />
                    {isEdit ? "Update" : "Save"}
                </button>
                <button
                    type="button"
                    className="btn button-theme btn-sm"
                    onClick={onCancel}>
                    <i className="fa-solid fa-xmark pe-1" />
                    Cancel
                </button>
            </div>
        </ModuleFormViewer>
    );
}

export default SimulationScenarioForm;
