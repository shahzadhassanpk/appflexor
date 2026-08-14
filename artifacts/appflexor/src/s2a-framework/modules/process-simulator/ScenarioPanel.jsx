import axios from "axios";
import React, { useEffect, useState } from "react";
import ReactBpmn from "react-bpmn";
import { SearchableSelect } from "../process-configuration/processes/SearchableSelect";
import { API_URL, FILE_URL } from "../../Config";

/* ════════════════════════════════════════════════════════════════════════════
   ScenarioPanel — right column of Process Simulator
   Three-section layout:
     Top    10% — scenario name + target process (editable in form mode)
     Middle 60% — live BPMN diagram with maximize toggle
     Bottom 30% — tabs: Metadata · Parameters · Constraints
   ════════════════════════════════════════════════════════════════════════════ */

/* ── constants ─────────────────────────────────────────────────────────── */
const BSTATE = {
    idle: "idle", loading: "loading", found: "found",
    noFile: "noFile", notDeployed: "notDeployed", error: "error",
};

const BOTTOM_TABS = [
    { key: "metadata",    label: "Metadata",    icon: "fa-tag"        },
    { key: "parameters",  label: "Parameters",  icon: "fa-sliders"    },
    { key: "constraints", label: "Constraints", icon: "fa-gauge-high" },
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

/* ── BPMN viewer section (middle 60%) ──────────────────────────────────── */
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
        <div className={`psim-rp-bpmn${maximized ? " psim-rp-bpmn--max" : ""}`}>
            {/* maximize / restore button */}
            <button
                type="button"
                className="psim-bpmn-max-btn"
                title={maximized ? "Restore diagram" : "Maximize diagram"}
                onClick={onToggleMaximize}>
                <i className={`fa-solid ${maximized ? "fa-compress" : "fa-expand"}`} aria-hidden="true" />
            </button>

            {vState === BSTATE.idle        && <StatusCard icon="fa-diagram-project"       title="No process selected"    hint="Select a target process above to preview its diagram." />}
            {vState === BSTATE.loading     && <StatusCard icon="fa-circle-notch fa-spin"  title="Loading diagram…" />}
            {vState === BSTATE.notDeployed && <StatusCard icon="fa-triangle-exclamation"  title="Process not deployed"   hint={`No deployed instance found for "${processKey}". Deploy the process first.`} warn />}
            {vState === BSTATE.noFile      && <StatusCard icon="fa-file-circle-question"  title="Diagram not available"  hint="The process is deployed but no BPMN file is attached to its definition." warn />}
            {vState === BSTATE.error       && <StatusCard icon="fa-circle-xmark"          title="Could not load diagram" hint="There was a problem fetching the process definition." err onRetry={() => setBustKey(k => k + 1)} />}

            {vState === BSTATE.found && bpmnUrl && (
                <div className="psim-bpmn-container">
                    <ReactBpmn url={`${bpmnUrl}?v=${bustKey}`} />
                </div>
            )}
        </div>
    );
}

/* ── dynamic parameter row table ───────────────────────────────────────── */
function ParamTable({ columns, rows, onChangeRow, onAddRow, onRemoveRow, addLabel, readOnly }) {
    return (
        <div className="psim-param-block">
            {rows.length > 0 && (
                <div className="psim-param-table">
                    <div className="psim-param-header">
                        {columns.map(c => <span key={c.key} style={{ flex: c.flex || 1 }}>{c.label}</span>)}
                        {!readOnly && <span style={{ width: 28 }} />}
                    </div>
                    {rows.map(row => (
                        <div key={row._key || row.taskName || row.poolName || row.gatewayName} className="psim-param-row">
                            {columns.map(c => (
                                <div key={c.key} style={{ flex: c.flex || 1, minWidth: 0 }}>
                                    {readOnly ? (
                                        <span className="psim-param-readonly">{row[c.key] || "—"}</span>
                                    ) : c.type === "select" ? (
                                        <select className="form-select form-select-sm" value={row[c.key] || ""} onChange={e => onChangeRow(row._key, c.key, e.target.value)}>
                                            {c.options.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    ) : (
                                        <input type={c.inputType || "text"} className="form-control form-control-sm" placeholder={c.placeholder || ""} min={c.min} max={c.max} value={row[c.key] || ""} onChange={e => onChangeRow(row._key, c.key, e.target.value)} />
                                    )}
                                </div>
                            ))}
                            {!readOnly && (
                                <button type="button" className="orch-icon-btn danger" onClick={() => onRemoveRow(row._key)}>
                                    <i className="fa-solid fa-xmark" aria-hidden="true" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
            {!readOnly && (
                <button type="button" className="orch-add-btn mt-1" onClick={onAddRow}>
                    <i className="fa-solid fa-plus" aria-hidden="true" />{addLabel}
                </button>
            )}
            {readOnly && rows.length === 0 && <span className="text-muted" style={{ fontSize: "0.78rem" }}>None configured.</span>}
        </div>
    );
}

/* ── bottom tab: Metadata ──────────────────────────────────────────────── */
function MetadataTab({ form, setForm, customTag, setCustomTag, readOnly }) {
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

    if (readOnly) return (
        <div className="psim-tab-body-scroll p-2">
            {form.metadata.author && <div className="psim-ro-row"><span className="psim-ro-label"><i className="fa-regular fa-user" />Author</span><span>{form.metadata.author}</span></div>}
            {form.metadata.description && <div className="psim-ro-row"><span className="psim-ro-label"><i className="fa-solid fa-align-left" />Description</span><span>{form.metadata.description}</span></div>}
            {tags.length > 0 && (
                <div className="psim-ro-row align-items-start">
                    <span className="psim-ro-label"><i className="fa-solid fa-tags" />Tags</span>
                    <div className="d-flex flex-wrap gap-1">
                        {tags.map(tag => { const s = tagStyle(tag); return <span key={tag} className="psim-tag" style={{ background: s.bg, color: s.color, borderColor: s.border }}>{tag}</span>; })}
                    </div>
                </div>
            )}
            {!form.metadata.author && !form.metadata.description && tags.length === 0 && <span className="text-muted" style={{ fontSize: "0.78rem" }}>No metadata.</span>}
        </div>
    );

    return (
        <div className="psim-tab-body-scroll p-2">
            <div className="mb-2">
                <label className="psim-field-label">Author</label>
                <input type="text" className="form-control form-control-sm mt-1" placeholder="Your name or team" value={form.metadata.author} onChange={e => setMeta("author", e.target.value)} />
            </div>
            <div className="mb-2">
                <label className="psim-field-label">Description</label>
                <textarea className="form-control form-control-sm mt-1" rows={2} placeholder="Describe what this scenario tests or assumes…" value={form.metadata.description} onChange={e => setMeta("description", e.target.value)} />
            </div>
            <div className="mb-1">
                <label className="psim-field-label">Tags</label>
                <div className="psim-tag-picker mt-1">
                    {PRESET_TAGS.map(tag => {
                        const on = tags.includes(tag);
                        return (
                            <button key={tag} type="button" className={`psim-preset-tag${on ? " psim-preset-tag--on" : ""}`} onClick={() => toggleTag(tag)}>
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
                    <input type="text" className="form-control form-control-sm" placeholder="Add custom tag…" value={customTag} onChange={e => setCustomTag(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustomTag())} style={{ maxWidth: 160 }} />
                    <button type="button" className="orch-add-btn" onClick={addCustomTag} disabled={!customTag.trim()}><i className="fa-solid fa-plus" />Add</button>
                </div>
            </div>
        </div>
    );
}

/* ── bottom tab: Parameters ────────────────────────────────────────────── */
function ParametersTab({ form, setForm, readOnly }) {
    function paramHelper(field) {
        return {
            rows:        form.parameters[field],
            onChangeRow: (key, col, val) => setForm(f => ({ ...f, parameters: { ...f.parameters, [field]: f.parameters[field].map(r => r._key === key ? { ...r, [col]: val } : r) } })),
            onAddRow:    (def) => setForm(f => ({ ...f, parameters: { ...f.parameters, [field]: [...f.parameters[field], { _key: makeKey(), ...def }] } })),
            onRemoveRow: (key) => setForm(f => ({ ...f, parameters: { ...f.parameters, [field]: f.parameters[field].filter(r => r._key !== key) } })),
        };
    }
    const td = paramHelper("taskDurations");
    const rp = paramHelper("resourcePools");
    const gp = paramHelper("gatewayProbs");

    return (
        <div className="psim-tab-body-scroll p-2">
            <div className="psim-section-label mb-1"><i className="fa-solid fa-clock" />Task Durations</div>
            <ParamTable readOnly={readOnly} columns={[
                { key: "taskName", label: "Task Name", placeholder: "e.g. Review Application", flex: 2 },
                { key: "duration", label: "Duration",  placeholder: "e.g. 30", inputType: "number", min: 0, flex: 1 },
                { key: "unit",     label: "Unit",      type: "select", options: DURATION_UNITS, flex: 1 },
            ]} rows={td.rows} onChangeRow={td.onChangeRow} onAddRow={() => td.onAddRow({ taskName: "", duration: "", unit: "minutes" })} onRemoveRow={td.onRemoveRow} addLabel="Add Task Duration" />

            <div className="psim-section-label mb-1 mt-3"><i className="fa-solid fa-users" />Resource Pools</div>
            <ParamTable readOnly={readOnly} columns={[
                { key: "poolName", label: "Pool / Role",    placeholder: "e.g. Credit Analyst", flex: 2 },
                { key: "count",    label: "Resource Count", placeholder: "e.g. 5", inputType: "number", min: 1, flex: 1 },
            ]} rows={rp.rows} onChangeRow={rp.onChangeRow} onAddRow={() => rp.onAddRow({ poolName: "", count: "" })} onRemoveRow={rp.onRemoveRow} addLabel="Add Resource Pool" />

            <div className="psim-section-label mb-1 mt-3"><i className="fa-solid fa-code-branch" />Gateway Probabilities</div>
            <ParamTable readOnly={readOnly} columns={[
                { key: "gatewayName",  label: "Gateway / Path",  placeholder: "e.g. Approve",  flex: 2 },
                { key: "probability",  label: "Probability (%)", placeholder: "0–100", inputType: "number", min: 0, max: 100, flex: 1 },
            ]} rows={gp.rows} onChangeRow={gp.onChangeRow} onAddRow={() => gp.onAddRow({ gatewayName: "", probability: "" })} onRemoveRow={gp.onRemoveRow} addLabel="Add Gateway Probability" />
        </div>
    );
}

/* ── bottom tab: Constraints ───────────────────────────────────────────── */
function ConstraintsTab({ form, setForm, readOnly }) {
    function setCon(field, value) { setForm(f => ({ ...f, constraints: { ...f.constraints, [field]: value } })); }
    const c = form.constraints;

    if (readOnly) return (
        <div className="psim-tab-body-scroll p-2">
            {c.maxTokens && <div className="psim-ro-row"><span className="psim-ro-label"><i className="fa-solid fa-hashtag" />Max Tokens</span><span>{c.maxTokens}</span></div>}
            {c.timeHorizonValue && <div className="psim-ro-row"><span className="psim-ro-label"><i className="fa-regular fa-clock" />Time Horizon</span><span>{c.timeHorizonValue} {c.timeHorizonUnit}</span></div>}
            {!c.maxTokens && !c.timeHorizonValue && <span className="text-muted" style={{ fontSize: "0.78rem" }}>No constraints configured.</span>}
        </div>
    );

    return (
        <div className="psim-tab-body-scroll p-2">
            <div className="mb-3">
                <label className="psim-field-label">Maximum Tokens</label>
                <small className="text-muted d-block">Max concurrent process instances to simulate.</small>
                <input type="number" className="form-control form-control-sm mt-1" placeholder="e.g. 100" min={1} value={c.maxTokens} onChange={e => setCon("maxTokens", e.target.value)} style={{ maxWidth: 160 }} />
            </div>
            <div>
                <label className="psim-field-label">Time Horizon</label>
                <small className="text-muted d-block">Maximum simulated time before stopping.</small>
                <div className="d-flex gap-2 align-items-center mt-1">
                    <input type="number" className="form-control form-control-sm" placeholder="e.g. 8" min={1} value={c.timeHorizonValue} onChange={e => setCon("timeHorizonValue", e.target.value)} style={{ maxWidth: 100 }} />
                    <select className="form-select form-select-sm" value={c.timeHorizonUnit} onChange={e => setCon("timeHorizonUnit", e.target.value)} style={{ maxWidth: 110 }}>
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
     mode       "idle" | "view" | "form"
     scenario   the scenario being viewed/edited (null for new)
     saving     bool — Save button loading state
     onSave(formData)
     onCancel()
     onEdit(scenario)
     onRun(scenario)
     initialProcess   optional {process_key, title}
   ════════════════════════════════════════════════════════════════════════════ */
function ScenarioPanel({ mode, scenario, saving, onSave, onCancel, onEdit, onRun, initialProcess }) {
    /* ── form state ─────────────────────────────────────────────────────── */
    const [form,      setForm]      = useState(() => initForm(scenario));
    const [activeTab, setActiveTab] = useState("metadata");
    const [customTag, setCustomTag] = useState("");
    const [bpmnMax,   setBpmnMax]   = useState(false);

    /* ── process list (for picker, loaded once when form mode) ─────────── */
    const [processes,    setProcesses]    = useState([]);
    const [loadingProcs, setLoadingProcs] = useState(false);
    const [procsError,   setProcsError]   = useState(false);
    const [procsLoaded,  setProcsLoaded]  = useState(false);

    /* ── reset form when mode/scenario changes ──────────────────────────── */
    useEffect(() => {
        setForm(initForm(mode === "form" ? scenario : null));
        setActiveTab("metadata");
        setCustomTag("");
        setBpmnMax(false);
    }, [mode, scenario?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    /* ── load process list when entering form mode ──────────────────────── */
    useEffect(() => {
        if (mode !== "form" || procsLoaded || loadingProcs) return;
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
    }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

    /* ── derived values ─────────────────────────────────────────────────── */
    const isEdit     = !!(scenario?.id);
    const readOnly   = mode === "view";
    const processKey = mode === "form"
        ? (form.model_ref || initialProcess?.process_key || "")
        : (scenario?.model_ref || initialProcess?.process_key || "");

    const procOptions  = processes.map(p => ({ value: p.process_key, label: p.title ? `${p.title} (${p.process_key})` : p.process_key }));
    const selectedProc = processes.find(p => p.process_key === form.model_ref);
    const procLabel    = selectedProc?.title || form.model_ref || "";

    const isValid = form.name.trim().length > 0 && form.model_ref.trim().length > 0;

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

    function handleProcessSelect(e) {
        const key   = e.target.value;
        const match = processes.find(p => p.process_key === key);
        setForm(f => ({ ...f, model_ref: key, metadata: { ...f.metadata, processTitle: match?.title || "" } }));
    }

    /* ════════════════════════════════════════════════════════════════════
       Idle state
       ════════════════════════════════════════════════════════════════════ */
    if (mode === "idle") {
        return (
            <div className="psim-panel psim-right-panel">
                <div className="psim-viewer-empty" style={{ height: "100%" }}>
                    <i className="fa-solid fa-diagram-project" aria-hidden="true" />
                    <p className="psim-viewer-empty-title">No scenario selected</p>
                    <p className="psim-viewer-empty-hint">
                        Select a scenario from the list to view its process diagram, or create a new one to get started.
                    </p>
                </div>
            </div>
        );
    }

    /* ════════════════════════════════════════════════════════════════════
       View / Form layout
       ════════════════════════════════════════════════════════════════════ */
    return (
        <div className="psim-panel psim-right-panel">

            {/* ══ TOP (10%): name + process ══════════════════════════════ */}
            <div className="psim-rp-top">
                <span className="psim-rp-top-icon">
                    <i className="fa-solid fa-flask-vial" aria-hidden="true" />
                </span>

                {mode === "form" ? (
                    /* ── form mode: editable name + process picker ──────── */
                    <>
                        <input
                            type="text"
                            className="form-control form-control-sm psim-rp-name-input"
                            placeholder="Scenario name…"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        />

                        <div className="psim-rp-proc-wrap">
                            {form.model_ref ? (
                                <div className="psim-rp-proc-badge">
                                    <i className="fa-solid fa-diagram-project" aria-hidden="true" />
                                    <span className="psim-rp-proc-label" title={procLabel}>{procLabel || form.model_ref}</span>
                                    <button type="button" className="psim-selected-proc-clear" title="Change process"
                                        onClick={() => setForm(f => ({ ...f, model_ref: "", metadata: { ...f.metadata, processTitle: "" } }))}>
                                        <i className="fa-solid fa-xmark" aria-hidden="true" />
                                    </button>
                                </div>
                            ) : loadingProcs ? (
                                <span className="psim-rp-proc-loading"><i className="fa-solid fa-circle-notch fa-spin" />Loading…</span>
                            ) : procsError ? (
                                <input type="text" className="form-control form-control-sm" placeholder="Process key…" value={form.model_ref}
                                    onChange={e => setForm(f => ({ ...f, model_ref: e.target.value }))} style={{ maxWidth: 180 }} />
                            ) : (
                                <SearchableSelect
                                    options={procOptions}
                                    value={form.model_ref}
                                    onChange={handleProcessSelect}
                                    placeholder="Select process…"
                                />
                            )}
                        </div>

                        <div className="psim-rp-actions">
                            <button type="button" className="btn button-theme btn-sm" onClick={handleSave} disabled={!isValid || saving}>
                                {saving
                                    ? <><i className="fa-solid fa-circle-notch fa-spin" />Saving…</>
                                    : <><i className="fa-solid fa-floppy-disk" />{isEdit ? "Update" : "Save"}</>}
                            </button>
                            <button type="button" className="btn btn-sm psim-rp-cancel-btn" onClick={onCancel}>
                                <i className="fa-solid fa-xmark" />Cancel
                            </button>
                        </div>
                    </>
                ) : (
                    /* ── view mode: read-only name + process + actions ──── */
                    <>
                        <div className="psim-rp-view-name" title={scenario?.name}>{scenario?.name}</div>
                        {scenario?.model_ref && (
                            <span className="psim-rp-view-proc">
                                <i className="fa-solid fa-diagram-project" aria-hidden="true" />
                                {scenario.model_ref}
                            </span>
                        )}
                        <div className="psim-rp-actions ms-auto">
                            <button type="button" className="orch-icon-btn" title="Edit scenario" onClick={() => onEdit(scenario)}>
                                <i className="fa-regular fa-pen-to-square" aria-hidden="true" />
                            </button>
                            <button type="button" className="orch-icon-btn psim-action-run" title="Run simulation (coming soon)" disabled onClick={() => onRun && onRun(scenario)}>
                                <i className="fa-solid fa-circle-play" aria-hidden="true" />
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* ══ MIDDLE (60%): BPMN viewer ══════════════════════════════ */}
            <BpmnSection processKey={processKey} maximized={bpmnMax} onToggleMaximize={() => setBpmnMax(m => !m)} />

            {/* ══ BOTTOM (30%): tabs ══════════════════════════════════════ */}
            <div className="psim-rp-bottom">
                {/* tab nav */}
                <div className="psim-rp-tab-nav">
                    {BOTTOM_TABS.map(tab => (
                        <button
                            key={tab.key}
                            type="button"
                            className={`psim-form-tab${activeTab === tab.key ? " psim-form-tab--active" : ""}`}
                            onClick={() => setActiveTab(tab.key)}>
                            <i className={`fa-solid ${tab.icon}`} aria-hidden="true" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* tab content */}
                {activeTab === "metadata"    && <MetadataTab    form={form} setForm={setForm} customTag={customTag} setCustomTag={setCustomTag} readOnly={readOnly} />}
                {activeTab === "parameters"  && <ParametersTab  form={form} setForm={setForm} readOnly={readOnly} />}
                {activeTab === "constraints" && <ConstraintsTab form={form} setForm={setForm} readOnly={readOnly} />}
            </div>
        </div>
    );
}

export default ScenarioPanel;
