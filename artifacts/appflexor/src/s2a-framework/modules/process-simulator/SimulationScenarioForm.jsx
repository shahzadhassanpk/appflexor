import axios from "axios";
import React, { useEffect, useState } from "react";
import ModuleFormViewer from "../../components/ModuleFormViewer/ModuleFormViewer";
import { SearchableSelect } from "../process-configuration/processes/SearchableSelect";
import { API_URL } from "../../Config";

/* ════════════════════════════════════════════════════════════════════════════
   SimulationScenarioForm
   Multi-section form: Basic → Metadata → Parameters → Constraints.
   All JSONB fields are edited through structured UI — no raw JSON editing.
   ════════════════════════════════════════════════════════════════════════════ */

const PRESET_TAGS = ["baseline", "stress-test", "optimistic", "pessimistic"];
const DURATION_UNITS = ["minutes", "hours", "days"];
const TIME_HORIZON_UNITS = ["hours", "days", "weeks"];
const TABS = [
    { key: "basic",       label: "Basic",       icon: "fa-circle-info" },
    { key: "metadata",    label: "Metadata",    icon: "fa-tag" },
    { key: "parameters",  label: "Parameters",  icon: "fa-sliders" },
    { key: "constraints", label: "Constraints", icon: "fa-gauge-high" },
];

function makeKey() { return `_${Math.random().toString(36).slice(2, 9)}`; }

function addKeys(list) {
    return (list || []).map(r => r._key ? r : { ...r, _key: makeKey() });
}

const DEFAULT_FORM = {
    id:         "",
    name:       "",
    model_ref:  "",
    metadata:    { author: "", description: "", tags: [], processTitle: "" },
    parameters:  { taskDurations: [], resourcePools: [], gatewayProbs: [] },
    constraints: { maxTokens: "", timeHorizonValue: "", timeHorizonUnit: "hours" },
};

/* ════════════════════════════════════════════════════════════════════════════
   Helpers — dynamic row tables
   ════════════════════════════════════════════════════════════════════════════ */
function ParamTable({ columns, rows, onChangeRow, onAddRow, onRemoveRow, addLabel }) {
    return (
        <div className="psim-param-block">
            {rows.length > 0 && (
                <div className="psim-param-table">
                    {/* header */}
                    <div className="psim-param-header">
                        {columns.map(c => (
                            <span key={c.key} style={{ flex: c.flex || 1 }}>{c.label}</span>
                        ))}
                        <span style={{ width: 28 }} />
                    </div>
                    {/* rows */}
                    {rows.map(row => (
                        <div key={row._key} className="psim-param-row">
                            {columns.map(c => (
                                <div key={c.key} style={{ flex: c.flex || 1, minWidth: 0 }}>
                                    {c.type === "select" ? (
                                        <select
                                            className="form-select form-select-sm"
                                            value={row[c.key] || ""}
                                            onChange={e => onChangeRow(row._key, c.key, e.target.value)}>
                                            {c.options.map(o => (
                                                <option key={o} value={o}>{o}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type={c.inputType || "text"}
                                            className="form-control form-control-sm"
                                            placeholder={c.placeholder || ""}
                                            min={c.min}
                                            max={c.max}
                                            value={row[c.key] || ""}
                                            onChange={e => onChangeRow(row._key, c.key, e.target.value)}
                                        />
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                className="orch-icon-btn danger"
                                title="Remove row"
                                onClick={() => onRemoveRow(row._key)}>
                                <i className="fa-solid fa-xmark" aria-hidden="true" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <button type="button" className="orch-add-btn mt-1" onClick={onAddRow}>
                <i className="fa-solid fa-plus" aria-hidden="true" />
                {addLabel}
            </button>
        </div>
    );
}

/* ════════════════════════════════════════════════════════════════════════════
   Main form component
   ════════════════════════════════════════════════════════════════════════════ */
function SimulationScenarioForm({ scenario, saving, onSave, onCancel }) {
    const isEdit = !!(scenario?.id);
    const [activeTab, setActiveTab] = useState("basic");

    /* ── form state ─────────────────────────────────────────────────────── */
    const [form, setForm] = useState(() => {
        if (!scenario) return { ...DEFAULT_FORM };
        return {
            ...DEFAULT_FORM,
            ...scenario,
            metadata:   {
                ...DEFAULT_FORM.metadata,
                ...(scenario.metadata || {}),
                tags: Array.isArray(scenario.metadata?.tags) ? [...scenario.metadata.tags] : [],
            },
            parameters: {
                taskDurations: addKeys(scenario.parameters?.taskDurations),
                resourcePools: addKeys(scenario.parameters?.resourcePools),
                gatewayProbs:  addKeys(scenario.parameters?.gatewayProbs),
            },
            constraints: { ...DEFAULT_FORM.constraints, ...(scenario.constraints || {}) },
        };
    });

    /* ── custom tag input ───────────────────────────────────────────────── */
    const [customTag, setCustomTag] = useState("");

    /* ── process list from API ──────────────────────────────────────────── */
    const [processes,    setProcesses]    = useState([]);
    const [loadingProcs, setLoadingProcs] = useState(true);
    const [procsError,   setProcsError]   = useState(false);

    useEffect(() => {
        setLoadingProcs(true);
        axios
            .post(`${API_URL}?service.key=masterKey.tenantData`, {
                dataKeys: [{ serviceParams: "", dataKey: "processMap", serviceKey: "process.map", mode: "formData" }],
            })
            .then(res => {
                if (res.data?.C_STATUS === "SUCCESS") {
                    setProcesses((res.data.C_DATA?.processMap || []).filter(p => p.process_key));
                } else {
                    setProcsError(true);
                }
            })
            .catch(() => setProcsError(true))
            .finally(() => setLoadingProcs(false));
    }, []);

    /* ── helpers ────────────────────────────────────────────────────────── */
    function setMeta(field, value)        { setForm(f => ({ ...f, metadata:    { ...f.metadata,    [field]: value } })); }
    function setConstraint(field, value)  { setForm(f => ({ ...f, constraints: { ...f.constraints, [field]: value } })); }

    function handleProcessSelect(e) {
        const key   = e.target.value;
        const match = processes.find(p => p.process_key === key);
        setForm(f => ({
            ...f,
            model_ref: key,
            metadata:  { ...f.metadata, processTitle: match?.title || f.metadata.processTitle },
        }));
    }

    function clearProcess() {
        setForm(f => ({ ...f, model_ref: "", metadata: { ...f.metadata, processTitle: "" } }));
    }

    /* ── tag helpers ────────────────────────────────────────────────────── */
    function toggleTag(tag) {
        setForm(f => {
            const tags = f.metadata.tags || [];
            const next = tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag];
            return { ...f, metadata: { ...f.metadata, tags: next } };
        });
    }
    function addCustomTag() {
        const t = customTag.trim().toLowerCase().replace(/\s+/g, "-");
        if (!t) return;
        setForm(f => {
            const tags = f.metadata.tags || [];
            if (tags.includes(t)) return f;
            return { ...f, metadata: { ...f.metadata, tags: [...tags, t] } };
        });
        setCustomTag("");
    }
    function removeTag(tag) {
        setForm(f => ({ ...f, metadata: { ...f.metadata, tags: (f.metadata.tags || []).filter(t => t !== tag) } }));
    }

    /* ── parameter row helpers ──────────────────────────────────────────── */
    function paramHelper(field) {
        return {
            rows:         form.parameters[field],
            onChangeRow:  (key, col, val) => setForm(f => ({
                ...f,
                parameters: {
                    ...f.parameters,
                    [field]: f.parameters[field].map(r => r._key === key ? { ...r, [col]: val } : r),
                },
            })),
            onAddRow:     (defaults) => setForm(f => ({
                ...f,
                parameters: { ...f.parameters, [field]: [...f.parameters[field], { _key: makeKey(), ...defaults }] },
            })),
            onRemoveRow:  (key) => setForm(f => ({
                ...f,
                parameters: { ...f.parameters, [field]: f.parameters[field].filter(r => r._key !== key) },
            })),
        };
    }

    const td = paramHelper("taskDurations");
    const rp = paramHelper("resourcePools");
    const gp = paramHelper("gatewayProbs");

    /* ── validation ─────────────────────────────────────────────────────── */
    const isValid = form.name.trim().length > 0 && form.model_ref.trim().length > 0;

    /* ── save ───────────────────────────────────────────────────────────── */
    function handleSave() {
        if (!isValid || saving) return;
        const clean = {
            ...form,
            name:      form.name.trim(),
            model_ref: form.model_ref.trim(),
            parameters: {
                taskDurations: form.parameters.taskDurations.map(({ _key, ...r }) => r),
                resourcePools: form.parameters.resourcePools.map(({ _key, ...r }) => r),
                gatewayProbs:  form.parameters.gatewayProbs.map(({ _key, ...r }) => r),
            },
        };
        onSave(clean);
    }

    /* ── process picker display ─────────────────────────────────────────── */
    const procOptions  = processes.map(p => ({
        value: p.process_key,
        label: p.title ? `${p.title}  (${p.process_key})` : p.process_key,
    }));
    const selectedProc = processes.find(p => p.process_key === form.model_ref);
    const procLabel    = selectedProc?.title || form.model_ref;

    /* ── render ─────────────────────────────────────────────────────────── */
    return (
        <ModuleFormViewer
            showModal={true}
            handleClose={onCancel}
            modalTitle={isEdit ? "Edit Simulation Scenario" : "New Simulation Scenario"}
            size="xl">

            {/* ── tab nav ───────────────────────────────────────────────── */}
            <div className="psim-form-tabs px-3 pt-2 pb-0">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        type="button"
                        className={`psim-form-tab${activeTab === tab.key ? " psim-form-tab--active" : ""}`}
                        onClick={() => setActiveTab(tab.key)}>
                        <i className={`fa-solid ${tab.icon}`} aria-hidden="true" />
                        {tab.label}
                        {tab.key === "basic" && (!form.name.trim() || !form.model_ref.trim()) && (
                            <span className="psim-tab-dot" title="Required fields missing" />
                        )}
                    </button>
                ))}
            </div>

            {/* ── form body ─────────────────────────────────────────────── */}
            <div className="col-12 form-background pt-3 pb-3 px-3" style={{ minHeight: 320 }}>

                {/* ══ BASIC ══════════════════════════════════════════════ */}
                {activeTab === "basic" && (
                    <div>
                        {/* Scenario Name */}
                        <div className="mb-3">
                            <label className="fw-semibold">
                                Scenario Name <span className="text-danger">*</span>
                            </label>
                            <input
                                type="text"
                                className="form-control mt-1"
                                placeholder="e.g. Optimistic — new customer onboarding"
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            />
                        </div>

                        {/* Target Process */}
                        <div className="mb-2">
                            <label className="fw-semibold">
                                Target Process <span className="text-danger">*</span>
                            </label>

                            {form.model_ref ? (
                                <div className="psim-selected-proc-badge mt-1">
                                    <i className="fa-solid fa-diagram-project" aria-hidden="true" />
                                    <span className="psim-selected-proc-title">{procLabel}</span>
                                    <code className="psim-selected-proc-key">{form.model_ref}</code>
                                    <button type="button" className="psim-selected-proc-clear" onClick={clearProcess} title="Clear">
                                        <i className="fa-solid fa-xmark" aria-hidden="true" />
                                    </button>
                                </div>
                            ) : (
                                <div className="mt-1">
                                    {loadingProcs && (
                                        <div className="psim-proc-loading">
                                            <i className="fa-solid fa-circle-notch fa-spin" /><span>Loading processes…</span>
                                        </div>
                                    )}
                                    {!loadingProcs && procsError && (
                                        <div className="psim-proc-error">
                                            <i className="fa-solid fa-triangle-exclamation" />
                                            <span>Could not load processes. Enter key manually:</span>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm mt-1"
                                                placeholder="e.g. customer-onboarding"
                                                value={form.model_ref}
                                                onChange={e => setForm(f => ({ ...f, model_ref: e.target.value }))}
                                            />
                                        </div>
                                    )}
                                    {!loadingProcs && !procsError && procOptions.length === 0 && (
                                        <div className="psim-proc-empty">
                                            <i className="fa-solid fa-inbox" /><span>No processes found. Deploy one first.</span>
                                        </div>
                                    )}
                                    {!loadingProcs && !procsError && procOptions.length > 0 && (
                                        <SearchableSelect
                                            options={procOptions}
                                            value={form.model_ref}
                                            onChange={handleProcessSelect}
                                            placeholder="Search processes…"
                                        />
                                    )}
                                </div>
                            )}
                            <small className="text-muted">The BPMN process model this scenario targets.</small>
                        </div>
                    </div>
                )}

                {/* ══ METADATA ═══════════════════════════════════════════ */}
                {activeTab === "metadata" && (
                    <div>
                        {/* Author */}
                        <div className="mb-3">
                            <label className="fw-semibold">Author</label>
                            <input
                                type="text"
                                className="form-control mt-1"
                                placeholder="Your name or team"
                                value={form.metadata.author}
                                onChange={e => setMeta("author", e.target.value)}
                            />
                        </div>

                        {/* Description */}
                        <div className="mb-3">
                            <label className="fw-semibold">Description</label>
                            <textarea
                                className="form-control mt-1"
                                rows={3}
                                placeholder="Describe what this scenario tests or assumes…"
                                value={form.metadata.description}
                                onChange={e => setMeta("description", e.target.value)}
                            />
                        </div>

                        {/* Tags */}
                        <div className="mb-1">
                            <label className="fw-semibold">Tags</label>
                            <div className="psim-tag-picker mt-1">
                                {PRESET_TAGS.map(tag => {
                                    const active = (form.metadata.tags || []).includes(tag);
                                    return (
                                        <button
                                            key={tag}
                                            type="button"
                                            className={`psim-preset-tag${active ? " psim-preset-tag--on" : ""}`}
                                            onClick={() => toggleTag(tag)}>
                                            {active && <i className="fa-solid fa-check" aria-hidden="true" />}
                                            {tag}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* custom tags */}
                            {(form.metadata.tags || []).filter(t => !PRESET_TAGS.includes(t)).length > 0 && (
                                <div className="psim-custom-tags mt-2">
                                    {(form.metadata.tags || []).filter(t => !PRESET_TAGS.includes(t)).map(tag => (
                                        <span key={tag} className="psim-custom-tag">
                                            {tag}
                                            <button type="button" onClick={() => removeTag(tag)}>
                                                <i className="fa-solid fa-xmark" aria-hidden="true" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* add custom tag */}
                            <div className="d-flex gap-2 mt-2">
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="Add custom tag…"
                                    value={customTag}
                                    onChange={e => setCustomTag(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustomTag())}
                                    style={{ maxWidth: 200 }}
                                />
                                <button
                                    type="button"
                                    className="orch-add-btn"
                                    onClick={addCustomTag}
                                    disabled={!customTag.trim()}>
                                    <i className="fa-solid fa-plus" />Add
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══ PARAMETERS ═════════════════════════════════════════ */}
                {activeTab === "parameters" && (
                    <div>
                        {/* Task Durations */}
                        <div className="mb-4">
                            <div className="psim-section-label">
                                <i className="fa-solid fa-clock" aria-hidden="true" />
                                Task Durations
                            </div>
                            <small className="text-muted d-block mb-2">Override expected duration for specific tasks.</small>
                            <ParamTable
                                columns={[
                                    { key: "taskName",  label: "Task Name",  placeholder: "e.g. Review Application", flex: 2 },
                                    { key: "duration",  label: "Duration",   placeholder: "e.g. 30", inputType: "number", min: 0, flex: 1 },
                                    { key: "unit",      label: "Unit",       type: "select", options: DURATION_UNITS, flex: 1 },
                                ]}
                                rows={td.rows}
                                onChangeRow={td.onChangeRow}
                                onAddRow={() => td.onAddRow({ taskName: "", duration: "", unit: "minutes" })}
                                onRemoveRow={td.onRemoveRow}
                                addLabel="Add Task Duration"
                            />
                        </div>

                        {/* Resource Pools */}
                        <div className="mb-4">
                            <div className="psim-section-label">
                                <i className="fa-solid fa-users" aria-hidden="true" />
                                Resource Pools
                            </div>
                            <small className="text-muted d-block mb-2">Define the number of resources available per pool.</small>
                            <ParamTable
                                columns={[
                                    { key: "poolName", label: "Pool / Role",    placeholder: "e.g. Credit Analyst", flex: 2 },
                                    { key: "count",    label: "Resource Count", placeholder: "e.g. 5", inputType: "number", min: 1, flex: 1 },
                                ]}
                                rows={rp.rows}
                                onChangeRow={rp.onChangeRow}
                                onAddRow={() => rp.onAddRow({ poolName: "", count: "" })}
                                onRemoveRow={rp.onRemoveRow}
                                addLabel="Add Resource Pool"
                            />
                        </div>

                        {/* Gateway Probabilities */}
                        <div className="mb-1">
                            <div className="psim-section-label">
                                <i className="fa-solid fa-code-branch" aria-hidden="true" />
                                Gateway Probabilities
                            </div>
                            <small className="text-muted d-block mb-2">Set the likelihood (%) of each gateway path being taken.</small>
                            <ParamTable
                                columns={[
                                    { key: "gatewayName",  label: "Gateway / Path",    placeholder: "e.g. Approve",  flex: 2 },
                                    { key: "probability",  label: "Probability (%)",    placeholder: "0–100", inputType: "number", min: 0, max: 100, flex: 1 },
                                ]}
                                rows={gp.rows}
                                onChangeRow={gp.onChangeRow}
                                onAddRow={() => gp.onAddRow({ gatewayName: "", probability: "" })}
                                onRemoveRow={gp.onRemoveRow}
                                addLabel="Add Gateway Probability"
                            />
                        </div>
                    </div>
                )}

                {/* ══ CONSTRAINTS ════════════════════════════════════════ */}
                {activeTab === "constraints" && (
                    <div>
                        {/* Max Tokens */}
                        <div className="mb-4">
                            <label className="fw-semibold">Maximum Tokens</label>
                            <small className="text-muted d-block mb-1">Maximum number of process instances to simulate concurrently.</small>
                            <input
                                type="number"
                                className="form-control mt-1"
                                placeholder="e.g. 100"
                                min={1}
                                value={form.constraints.maxTokens}
                                onChange={e => setConstraint("maxTokens", e.target.value)}
                                style={{ maxWidth: 200 }}
                            />
                        </div>

                        {/* Time Horizon */}
                        <div className="mb-1">
                            <label className="fw-semibold">Time Horizon</label>
                            <small className="text-muted d-block mb-1">Maximum simulated time to run before stopping.</small>
                            <div className="d-flex gap-2 align-items-center mt-1">
                                <input
                                    type="number"
                                    className="form-control"
                                    placeholder="e.g. 8"
                                    min={1}
                                    value={form.constraints.timeHorizonValue}
                                    onChange={e => setConstraint("timeHorizonValue", e.target.value)}
                                    style={{ maxWidth: 120 }}
                                />
                                <select
                                    className="form-select"
                                    value={form.constraints.timeHorizonUnit}
                                    onChange={e => setConstraint("timeHorizonUnit", e.target.value)}
                                    style={{ maxWidth: 130 }}>
                                    {TIME_HORIZON_UNITS.map(u => (
                                        <option key={u} value={u}>{u}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── footer ────────────────────────────────────────────────── */}
            <div className="modal-footer pe-0 d-flex align-items-center gap-2">
                {!isValid && activeTab !== "basic" && (
                    <small className="text-danger me-auto">
                        <i className="fa-solid fa-circle-exclamation pe-1" />
                        Name and process are required (Basic tab).
                    </small>
                )}
                <button
                    type="button"
                    className="btn button-theme btn-sm me-2"
                    onClick={handleSave}
                    disabled={!isValid || saving}>
                    {saving
                        ? <><i className="fa-solid fa-circle-notch fa-spin pe-1" />Saving…</>
                        : <><i className="fa-solid fa-floppy-disk pe-1" />{isEdit ? "Update" : "Save"}</>
                    }
                </button>
                <button type="button" className="btn button-theme btn-sm" onClick={onCancel}>
                    <i className="fa-solid fa-xmark pe-1" />Cancel
                </button>
            </div>
        </ModuleFormViewer>
    );
}

export default SimulationScenarioForm;
