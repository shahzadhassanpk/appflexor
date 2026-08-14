import axios from "axios";
import React, { useEffect, useState } from "react";
import ReactBpmn from "react-bpmn";
import { SearchableSelect } from "../process-configuration/processes/SearchableSelect";
import { API_URL, FILE_URL } from "../../Config";

/* ════════════════════════════════════════════════════════════════════════════
   ScenarioPanel — right column of Process Simulator
   Three top-level tabs: Process · Meta · Constraints
   Process tab is itself split into three sections:
     Top    10% — scenario name + target process (opens dialog)
     Middle 60% — live BPMN diagram with maximize toggle
     Bottom 30% — sub-tabs: Task Durations · Resource Pools · Gateway Probs
   ════════════════════════════════════════════════════════════════════════════ */

/* ── constants ─────────────────────────────────────────────────────────── */
const BSTATE = {
    idle: "idle", loading: "loading", found: "found",
    noFile: "noFile", notDeployed: "notDeployed", error: "error",
};

const TOP_TABS = [
    { key: "process",     label: "Process",     icon: "fa-diagram-project" },
    { key: "meta",        label: "Meta",        icon: "fa-tag"             },
    { key: "constraints", label: "Constraints", icon: "fa-gauge-high"      },
];

const PARAM_TABS = [
    { key: "taskDurations", label: "Task Durations",        icon: "fa-clock"       },
    { key: "resourcePools", label: "Resource Pools",        icon: "fa-users"       },
    { key: "gatewayProbs",  label: "Gateway Probabilities", icon: "fa-code-branch" },
];

const PRESET_TAGS       = ["baseline", "stress-test", "optimistic", "pessimistic"];
const DURATION_UNITS    = ["minutes", "hours", "days"];
const TIME_HORIZON_UNITS = ["hours", "days", "weeks"];

const TAG_COLORS = {
    "baseline":    { bg: "#dbeafe", color: "#1e40af", border: "#bfdbfe" },
    "stress-test": { bg: "#fee2e2", color: "#991b1b", border: "#fecaca" },
    "optimistic":  { bg: "#dcfce7", color: "#166534", border: "#bbf7d0" },
    "pessimistic": { bg: "#ffedd5", color: "#92400e", border: "#fed7aa" },
};
function tagStyle(t) { return TAG_COLORS[(t || "").toLowerCase()] || { bg: "#f3f4f6", color: "#374151", border: "#e5e7eb" }; }

/* ── form helpers ──────────────────────────────────────────────────────── */
function makeKey() { return `_${Math.random().toString(36).slice(2, 9)}`; }
function addKeys(list) { return (list || []).map(r => r._key ? r : { ...r, _key: makeKey() }); }

const DEFAULT_FORM = {
    id: "", name: "", model_ref: "",
    metadata:    { author: "", description: "", tags: [], processTitle: "" },
    parameters:  { taskDurations: [], resourcePools: [], gatewayProbs: [] },
    constraints: { maxTokens: "", timeHorizonValue: "", timeHorizonUnit: "hours" },
};

function initForm(scenario) {
    if (!scenario) return { ...DEFAULT_FORM };
    return {
        ...DEFAULT_FORM, ...scenario,
        metadata: {
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
}

/* ════════════════════════════════════════════════════════════════════════════
   Sub-components
   ════════════════════════════════════════════════════════════════════════════ */

/* ── generic BPMN status card ──────────────────────────────────────────── */
function StatusCard({ icon, title, hint, warn, err, onRetry }) {
    const mod = warn ? " psim-bpmn-status--warn" : err ? " psim-bpmn-status--error" : "";
    return (
        <div className={`psim-bpmn-status${mod}`}>
            <i className={`fa-solid ${icon}`} aria-hidden="true" />
            {title && <p className="psim-bpmn-status-title">{title}</p>}
            {hint  && <p className="psim-bpmn-status-hint">{hint}</p>}
            {onRetry && (
                <button type="button" className="orch-add-btn mt-2" onClick={onRetry}>
                    <i className="fa-solid fa-rotate-right" aria-hidden="true" />Retry
                </button>
            )}
        </div>
    );
}

/* ── BPMN viewer (middle 60%) ──────────────────────────────────────────── */
function BpmnSection({ processKey, maximized, onToggleMaximize }) {
    const [vState,  setVState]  = useState(BSTATE.idle);
    const [bpmnUrl, setBpmnUrl] = useState("");
    const [bustKey, setBustKey] = useState(0);

    useEffect(() => {
        if (!processKey) { setVState(BSTATE.idle); setBpmnUrl(""); return; }
        setVState(BSTATE.loading); setBpmnUrl("");

        axios.post(`${API_URL}?service.key=masterKey.tenantData`, {
            dataKeys: [{ serviceParams: "", dataKey: "engine", serviceKey: "bpm.list.process", mode: "formData" }],
        })
        .then(res => {
            if (res.data?.C_STATUS !== "SUCCESS") { setVState(BSTATE.error); return; }
            const match = (res.data.C_DATA?.engine || []).find(
                tp => (tp.process_def_key || "").toLowerCase().trim() === processKey.toLowerCase().trim()
            );
            if (!match)              { setVState(BSTATE.notDeployed); return; }
            if (!match.process_file) { setVState(BSTATE.noFile);      return; }
            setBpmnUrl(`${FILE_URL}/process/${encodeURIComponent(match.id)}/${encodeURIComponent(match.process_file)}`);
            setVState(BSTATE.found);
        })
        .catch(() => setVState(BSTATE.error));
    }, [processKey, bustKey]);

    return (
        <div className={`psim-proc-bpmn${maximized ? " psim-proc-bpmn--max" : ""}`}>
            <button
                type="button"
                className="psim-bpmn-max-btn"
                title={maximized ? "Restore diagram" : "Maximize diagram"}
                onClick={onToggleMaximize}>
                <i className={`fa-solid ${maximized ? "fa-compress" : "fa-expand"}`} aria-hidden="true" />
            </button>

            {vState === BSTATE.idle        && <StatusCard icon="fa-diagram-project"      title="No process selected"    hint="Select a target process above to preview its diagram." />}
            {vState === BSTATE.loading     && <StatusCard icon="fa-circle-notch fa-spin" title="Loading diagram…" />}
            {vState === BSTATE.notDeployed && <StatusCard icon="fa-triangle-exclamation" title="Process not deployed"   hint={`No deployed instance found for "${processKey}". Deploy the process first.`} warn />}
            {vState === BSTATE.noFile      && <StatusCard icon="fa-file-circle-question" title="Diagram not available"  hint="The process is deployed but no BPMN file is attached to its definition." warn />}
            {vState === BSTATE.error       && <StatusCard icon="fa-circle-xmark"         title="Could not load diagram" hint="There was a problem fetching the process definition." err onRetry={() => setBustKey(k => k + 1)} />}

            {vState === BSTATE.found && bpmnUrl && (
                <div className="psim-bpmn-container">
                    <ReactBpmn url={`${bpmnUrl}?v=${bustKey}`} />
                </div>
            )}
        </div>
    );
}

/* ── dynamic parameter row table ───────────────────────────────────────── */
function ParamTable({ columns, rows, onChangeRow, onAddRow, onRemoveRow, addLabel }) {
    return (
        <div className="psim-param-block">
            {rows.length > 0 && (
                <div className="psim-param-table">
                    <div className="psim-param-header">
                        {columns.map(c => <span key={c.key} style={{ flex: c.flex || 1 }}>{c.label}</span>)}
                        <span style={{ width: 28 }} />
                    </div>
                    {rows.map(row => (
                        <div key={row._key} className="psim-param-row">
                            {columns.map(c => (
                                <div key={c.key} style={{ flex: c.flex || 1, minWidth: 0 }}>
                                    {c.type === "select" ? (
                                        <select
                                            className="form-select form-select-sm"
                                            value={row[c.key] || ""}
                                            onChange={e => onChangeRow(row._key, c.key, e.target.value)}>
                                            {c.options.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    ) : (
                                        <input
                                            type={c.inputType || "text"}
                                            className="form-control form-control-sm"
                                            placeholder={c.placeholder || ""}
                                            min={c.min} max={c.max}
                                            value={row[c.key] || ""}
                                            onChange={e => onChangeRow(row._key, c.key, e.target.value)}
                                        />
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                className="orch-icon-btn danger"
                                onClick={() => onRemoveRow(row._key)}>
                                <i className="fa-solid fa-xmark" aria-hidden="true" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <button type="button" className="orch-add-btn mt-1" onClick={onAddRow}>
                <i className="fa-solid fa-plus" aria-hidden="true" />{addLabel}
            </button>
        </div>
    );
}

/* ── parameter sub-tab content components ──────────────────────────────── */
function TaskDurationsContent({ form, setForm }) {
    function changeRow(key, col, val) {
        setForm(f => ({ ...f, parameters: { ...f.parameters, taskDurations: f.parameters.taskDurations.map(r => r._key === key ? { ...r, [col]: val } : r) } }));
    }
    function addRow() {
        setForm(f => ({ ...f, parameters: { ...f.parameters, taskDurations: [...f.parameters.taskDurations, { _key: makeKey(), taskName: "", duration: "", unit: "minutes" }] } }));
    }
    function removeRow(key) {
        setForm(f => ({ ...f, parameters: { ...f.parameters, taskDurations: f.parameters.taskDurations.filter(r => r._key !== key) } }));
    }
    return (
        <ParamTable
            columns={[
                { key: "taskName", label: "Task Name", placeholder: "e.g. Review Application", flex: 2 },
                { key: "duration", label: "Duration",  placeholder: "e.g. 30", inputType: "number", min: 0, flex: 1 },
                { key: "unit",     label: "Unit",      type: "select", options: DURATION_UNITS, flex: 1 },
            ]}
            rows={form.parameters.taskDurations}
            onChangeRow={changeRow}
            onAddRow={addRow}
            onRemoveRow={removeRow}
            addLabel="Add Task Duration"
        />
    );
}

function ResourcePoolsContent({ form, setForm }) {
    function changeRow(key, col, val) {
        setForm(f => ({ ...f, parameters: { ...f.parameters, resourcePools: f.parameters.resourcePools.map(r => r._key === key ? { ...r, [col]: val } : r) } }));
    }
    function addRow() {
        setForm(f => ({ ...f, parameters: { ...f.parameters, resourcePools: [...f.parameters.resourcePools, { _key: makeKey(), poolName: "", count: "" }] } }));
    }
    function removeRow(key) {
        setForm(f => ({ ...f, parameters: { ...f.parameters, resourcePools: f.parameters.resourcePools.filter(r => r._key !== key) } }));
    }
    return (
        <ParamTable
            columns={[
                { key: "poolName", label: "Pool / Role",    placeholder: "e.g. Credit Analyst", flex: 2 },
                { key: "count",    label: "Resource Count", placeholder: "e.g. 5", inputType: "number", min: 1, flex: 1 },
            ]}
            rows={form.parameters.resourcePools}
            onChangeRow={changeRow}
            onAddRow={addRow}
            onRemoveRow={removeRow}
            addLabel="Add Resource Pool"
        />
    );
}

function GatewayProbsContent({ form, setForm }) {
    function changeRow(key, col, val) {
        setForm(f => ({ ...f, parameters: { ...f.parameters, gatewayProbs: f.parameters.gatewayProbs.map(r => r._key === key ? { ...r, [col]: val } : r) } }));
    }
    function addRow() {
        setForm(f => ({ ...f, parameters: { ...f.parameters, gatewayProbs: [...f.parameters.gatewayProbs, { _key: makeKey(), gatewayName: "", probability: "" }] } }));
    }
    function removeRow(key) {
        setForm(f => ({ ...f, parameters: { ...f.parameters, gatewayProbs: f.parameters.gatewayProbs.filter(r => r._key !== key) } }));
    }
    return (
        <ParamTable
            columns={[
                { key: "gatewayName",  label: "Gateway / Path",  placeholder: "e.g. Approve",  flex: 2 },
                { key: "probability",  label: "Probability (%)", placeholder: "0–100", inputType: "number", min: 0, max: 100, flex: 1 },
            ]}
            rows={form.parameters.gatewayProbs}
            onChangeRow={changeRow}
            onAddRow={addRow}
            onRemoveRow={removeRow}
            addLabel="Add Gateway Probability"
        />
    );
}

/* ── Meta tab ──────────────────────────────────────────────────────────── */
function MetadataTab({ form, setForm, customTag, setCustomTag }) {
    function setMeta(field, value) { setForm(f => ({ ...f, metadata: { ...f.metadata, [field]: value } })); }
    function toggleTag(tag) {
        setForm(f => {
            const tags = f.metadata.tags || [];
            return { ...f, metadata: { ...f.metadata, tags: tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag] } };
        });
    }
    function addCustomTag() {
        const t = customTag.trim().toLowerCase().replace(/\s+/g, "-");
        if (!t) return;
        setForm(f => {
            const tags = f.metadata.tags || [];
            return tags.includes(t) ? f : { ...f, metadata: { ...f.metadata, tags: [...tags, t] } };
        });
        setCustomTag("");
    }
    function removeTag(tag) { setForm(f => ({ ...f, metadata: { ...f.metadata, tags: (f.metadata.tags || []).filter(t => t !== tag) } })); }

    const tags = form.metadata.tags || [];
    return (
        <div className="psim-tab-body-scroll p-2">
            <div className="mb-2">
                <label className="psim-field-label">Author</label>
                <input type="text" className="form-control form-control-sm mt-1" placeholder="Your name or team"
                    value={form.metadata.author} onChange={e => setMeta("author", e.target.value)} />
            </div>
            <div className="mb-2">
                <label className="psim-field-label">Description</label>
                <textarea className="form-control form-control-sm mt-1" rows={2}
                    placeholder="Describe what this scenario tests or assumes…"
                    value={form.metadata.description} onChange={e => setMeta("description", e.target.value)} />
            </div>
            <div className="mb-1">
                <label className="psim-field-label">Tags</label>
                <div className="psim-tag-picker mt-1">
                    {PRESET_TAGS.map(tag => {
                        const on = tags.includes(tag);
                        return (
                            <button key={tag} type="button"
                                className={`psim-preset-tag${on ? " psim-preset-tag--on" : ""}`}
                                onClick={() => toggleTag(tag)}>
                                {on && <i className="fa-solid fa-check" aria-hidden="true" />}{tag}
                            </button>
                        );
                    })}
                </div>
                {tags.filter(t => !PRESET_TAGS.includes(t)).length > 0 && (
                    <div className="psim-custom-tags mt-1">
                        {tags.filter(t => !PRESET_TAGS.includes(t)).map(tag => (
                            <span key={tag} className="psim-custom-tag">{tag}
                                <button type="button" onClick={() => removeTag(tag)}><i className="fa-solid fa-xmark" /></button>
                            </span>
                        ))}
                    </div>
                )}
                <div className="d-flex gap-2 mt-1">
                    <input type="text" className="form-control form-control-sm" placeholder="Add custom tag…"
                        value={customTag} onChange={e => setCustomTag(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustomTag())}
                        style={{ maxWidth: 160 }} />
                    <button type="button" className="orch-add-btn" onClick={addCustomTag} disabled={!customTag.trim()}>
                        <i className="fa-solid fa-plus" />Add
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Constraints tab ───────────────────────────────────────────────────── */
function ConstraintsTab({ form, setForm }) {
    function setCon(field, value) { setForm(f => ({ ...f, constraints: { ...f.constraints, [field]: value } })); }
    const c = form.constraints;
    return (
        <div className="psim-tab-body-scroll p-2">
            <div className="mb-3">
                <label className="psim-field-label">Maximum Tokens</label>
                <small className="text-muted d-block">Max concurrent process instances to simulate.</small>
                <input type="number" className="form-control form-control-sm mt-1" placeholder="e.g. 100" min={1}
                    value={c.maxTokens} onChange={e => setCon("maxTokens", e.target.value)} style={{ maxWidth: 160 }} />
            </div>
            <div>
                <label className="psim-field-label">Time Horizon</label>
                <small className="text-muted d-block">Maximum simulated time before stopping.</small>
                <div className="d-flex gap-2 align-items-center mt-1">
                    <input type="number" className="form-control form-control-sm" placeholder="e.g. 8" min={1}
                        value={c.timeHorizonValue} onChange={e => setCon("timeHorizonValue", e.target.value)} style={{ maxWidth: 100 }} />
                    <select className="form-select form-select-sm" value={c.timeHorizonUnit}
                        onChange={e => setCon("timeHorizonUnit", e.target.value)} style={{ maxWidth: 110 }}>
                        {TIME_HORIZON_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                </div>
            </div>
        </div>
    );
}

/* ════════════════════════════════════════════════════════════════════════════
   ScenarioPanel — main export
   Props:
     scenario      the scenario being edited (null = new)
     saving        bool — Save button loading state
     formKey       increment to force-reset the form (used by cancel)
     onSave(formData)
     onCancel()
   ════════════════════════════════════════════════════════════════════════════ */
function ScenarioPanel({ scenario, saving, formKey, onSave, onCancel }) {
    /* ── form state ─────────────────────────────────────────────────────── */
    const [form,      setForm]      = useState(() => initForm(scenario));
    const [topTab,    setTopTab]    = useState("process");
    const [paramTab,  setParamTab]  = useState("taskDurations");
    const [customTag, setCustomTag] = useState("");
    const [bpmnMax,   setBpmnMax]   = useState(false);

    /* ── process selector dialog ────────────────────────────────────────── */
    const [showProcDlg,   setShowProcDlg]   = useState(false);
    const [processes,     setProcesses]     = useState([]);
    const [loadingProcs,  setLoadingProcs]  = useState(false);
    const [procsError,    setProcsError]    = useState(false);
    const [procsLoaded,   setProcsLoaded]   = useState(false);

    /* ── reset form when scenario or formKey changes ────────────────────── */
    useEffect(() => {
        setForm(initForm(scenario));
        setTopTab("process");
        setParamTab("taskDurations");
        setCustomTag("");
        setBpmnMax(false);
        setShowProcDlg(false);
    }, [scenario?.id, formKey]); // eslint-disable-line react-hooks/exhaustive-deps

    /* ── load process list once ─────────────────────────────────────────── */
    useEffect(() => {
        if (procsLoaded || loadingProcs) return;
        setLoadingProcs(true);
        axios.post(`${API_URL}?service.key=masterKey.tenantData`, {
            dataKeys: [{ serviceParams: "", dataKey: "processMap", serviceKey: "process.map", mode: "formData" }],
        })
        .then(res => {
            if (res.data?.C_STATUS === "SUCCESS") {
                setProcesses((res.data.C_DATA?.processMap || []).filter(p => p.process_key));
                setProcsLoaded(true);
            } else { setProcsError(true); }
        })
        .catch(() => setProcsError(true))
        .finally(() => setLoadingProcs(false));
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    /* ── derived ────────────────────────────────────────────────────────── */
    const isEdit   = !!(scenario?.id);
    const isValid  = form.name.trim().length > 0 && form.model_ref.trim().length > 0;
    const procOpts = processes.map(p => ({ value: p.process_key, label: p.title ? `${p.title} (${p.process_key})` : p.process_key }));
    const selProc  = processes.find(p => p.process_key === form.model_ref);
    const procLabel = selProc?.title || form.model_ref || "";

    /* ── save ───────────────────────────────────────────────────────────── */
    function handleSave() {
        if (!isValid || saving) return;
        onSave({
            ...form,
            name:      form.name.trim(),
            model_ref: form.model_ref.trim(),
            parameters: {
                taskDurations: form.parameters.taskDurations.map(({ _key, ...r }) => r),
                resourcePools: form.parameters.resourcePools.map(({ _key, ...r }) => r),
                gatewayProbs:  form.parameters.gatewayProbs.map(({ _key, ...r }) => r),
            },
        });
    }

    /* ── process selection from dialog ─────────────────────────────────── */
    function handleProcessSelect(e) {
        const key   = e.target.value;
        const match = processes.find(p => p.process_key === key);
        setForm(f => ({ ...f, model_ref: key, metadata: { ...f.metadata, processTitle: match?.title || "" } }));
        setShowProcDlg(false);
    }

    /* ════════════════════════════════════════════════════════════════════
       Render
       ════════════════════════════════════════════════════════════════════ */
    return (
        <div className="psim-panel psim-right-panel">

            {/* ══ TOP-LEVEL TAB NAV ══════════════════════════════════════════ */}
            <div className="psim-top-tab-nav">
                <div className="psim-top-tab-btns">
                    {TOP_TABS.map(t => (
                        <button
                            key={t.key}
                            type="button"
                            className={`psim-top-tab${topTab === t.key ? " psim-top-tab--active" : ""}`}
                            onClick={() => setTopTab(t.key)}>
                            <i className={`fa-solid ${t.icon}`} aria-hidden="true" />
                            {t.label}
                        </button>
                    ))}
                </div>
                <div className="psim-top-tab-actions">
                    <button
                        type="button"
                        className="btn button-theme btn-sm"
                        onClick={handleSave}
                        disabled={!isValid || saving}>
                        {saving
                            ? <><i className="fa-solid fa-circle-notch fa-spin" />Saving…</>
                            : <><i className="fa-solid fa-floppy-disk" />{isEdit ? "Update" : "Save"}</>}
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm psim-rp-cancel-btn"
                        onClick={onCancel}>
                        <i className="fa-solid fa-xmark" />Cancel
                    </button>
                </div>
            </div>

            {/* ══ TAB CONTENT AREA ══════════════════════════════════════════ */}
            <div className="psim-top-tab-content">

                {/* ── PROCESS TAB ─────────────────────────────────────────── */}
                {topTab === "process" && (
                    <div className="psim-proc-tab">

                        {/* Top 10%: name + process selector */}
                        <div className="psim-proc-top">
                            <span className="psim-rp-top-icon">
                                <i className="fa-solid fa-flask-vial" aria-hidden="true" />
                            </span>

                            <input
                                type="text"
                                className="form-control form-control-sm psim-rp-name-input"
                                placeholder="Scenario name…"
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            />

                            {/* process badge / select button */}
                            {form.model_ref ? (
                                <div className="psim-rp-proc-badge">
                                    <i className="fa-solid fa-diagram-project" aria-hidden="true" />
                                    <span className="psim-rp-proc-label" title={procLabel}>
                                        {procLabel || form.model_ref}
                                    </span>
                                    <button
                                        type="button"
                                        className="psim-selected-proc-clear"
                                        title="Change process"
                                        onClick={() => setShowProcDlg(true)}>
                                        <i className="fa-solid fa-pen" aria-hidden="true" />
                                    </button>
                                    <button
                                        type="button"
                                        className="psim-selected-proc-clear"
                                        title="Clear process"
                                        onClick={() => setForm(f => ({ ...f, model_ref: "", metadata: { ...f.metadata, processTitle: "" } }))}>
                                        <i className="fa-solid fa-xmark" aria-hidden="true" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    className="btn btn-sm psim-proc-select-btn"
                                    onClick={() => setShowProcDlg(true)}>
                                    <i className="fa-solid fa-diagram-project" aria-hidden="true" />
                                    Select Process
                                </button>
                            )}
                        </div>

                        {/* Middle 60%: BPMN viewer */}
                        <BpmnSection
                            processKey={form.model_ref}
                            maximized={bpmnMax}
                            onToggleMaximize={() => setBpmnMax(m => !m)}
                        />

                        {/* Bottom 30%: parameter sub-tabs */}
                        <div className="psim-proc-bottom">
                            <div className="psim-proc-subtab-nav">
                                {PARAM_TABS.map(t => (
                                    <button
                                        key={t.key}
                                        type="button"
                                        className={`psim-form-tab${paramTab === t.key ? " psim-form-tab--active" : ""}`}
                                        onClick={() => setParamTab(t.key)}>
                                        <i className={`fa-solid ${t.icon}`} aria-hidden="true" />
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                            <div className="psim-tab-body-scroll p-2">
                                {paramTab === "taskDurations" && <TaskDurationsContent form={form} setForm={setForm} />}
                                {paramTab === "resourcePools" && <ResourcePoolsContent form={form} setForm={setForm} />}
                                {paramTab === "gatewayProbs"  && <GatewayProbsContent  form={form} setForm={setForm} />}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── META TAB ────────────────────────────────────────────── */}
                {topTab === "meta" && (
                    <MetadataTab
                        form={form} setForm={setForm}
                        customTag={customTag} setCustomTag={setCustomTag}
                    />
                )}

                {/* ── CONSTRAINTS TAB ─────────────────────────────────────── */}
                {topTab === "constraints" && (
                    <ConstraintsTab form={form} setForm={setForm} />
                )}
            </div>

            {/* ══ PROCESS SELECTOR DIALOG ════════════════════════════════════ */}
            {showProcDlg && (
                <div className="psim-proc-dlg-overlay" onClick={() => setShowProcDlg(false)}>
                    <div className="psim-proc-dlg" onClick={e => e.stopPropagation()}>
                        <div className="psim-proc-dlg-header">
                            <span className="psim-proc-dlg-title">
                                <i className="fa-solid fa-diagram-project" aria-hidden="true" />
                                Select Target Process
                            </span>
                            <button
                                type="button"
                                className="orch-icon-btn"
                                title="Close"
                                onClick={() => setShowProcDlg(false)}>
                                <i className="fa-solid fa-xmark" aria-hidden="true" />
                            </button>
                        </div>
                        <div className="psim-proc-dlg-body">
                            {loadingProcs && (
                                <div className="psim-proc-dlg-loading">
                                    <i className="fa-solid fa-circle-notch fa-spin" aria-hidden="true" />
                                    Loading processes…
                                </div>
                            )}
                            {procsError && !loadingProcs && (
                                <div className="text-danger" style={{ fontSize: "0.85rem" }}>
                                    <i className="fa-solid fa-triangle-exclamation me-1" />
                                    Could not load processes.
                                </div>
                            )}
                            {!loadingProcs && !procsError && (
                                <SearchableSelect
                                    options={procOpts}
                                    value={form.model_ref}
                                    onChange={handleProcessSelect}
                                    placeholder="Search processes…"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ScenarioPanel;
