import axios from "axios";
import React, { useEffect, useState } from "react";
import { SearchableSelect } from "../process-configuration/processes/SearchableSelect";
import { API_URL, FILE_URL } from "../../Config";
import ProcessModelViewer from "./ProcessModelViewer";
import SimulationControls from "./SimulationControls";

/* ════════════════════════════════════════════════════════════════════════════
   ScenarioPanel — right column of Process Simulator
   Three top-level tabs: Process · Meta · Constraints
   Process tab:
     Top    10% — scenario name + target process (dialog selector)
     Middle 60% — live BPMN diagram with maximize toggle
     Bottom 30% — element tabs parsed from BPMN XML:
                  User Tasks · Service Tasks · Gateways · Variables
                  Each element has a Configure button → dialog with
                  simulation-specific inputs stored in parameters JSON.
   ════════════════════════════════════════════════════════════════════════════ */

/* ── tab / type constants ──────────────────────────────────────────────── */
const BSTATE = {
    idle: "idle", loading: "loading", found: "found",
    noFile: "noFile", notDeployed: "notDeployed", error: "error",
};

const TOP_TABS = [
    { key: "process",     label: "Process",     icon: "fa-diagram-project" },
    { key: "meta",        label: "Meta",        icon: "fa-tag"             },
    { key: "constraints", label: "Constraints", icon: "fa-gauge-high"      },
];

const ELEM_TABS = [
    { key: "userTasks",    label: "User Tasks",    icon: "fa-user-check"  },
    { key: "serviceTasks", label: "Service Tasks", icon: "fa-gear"        },
    { key: "gateways",     label: "Gateways",      icon: "fa-code-branch" },
    { key: "variables",    label: "Variables",     icon: "fa-database"    },
];

const PRESET_TAGS        = ["baseline", "stress-test", "optimistic", "pessimistic"];
const DURATION_UNITS     = ["seconds", "minutes", "hours", "days"];
const TIME_HORIZON_UNITS = ["hours", "days", "weeks"];
const DATA_TYPES         = ["string", "number", "boolean", "date", "object"];

const TAG_COLORS = {
    "baseline":    { bg: "#dbeafe", color: "#1e40af", border: "#bfdbfe" },
    "stress-test": { bg: "#fee2e2", color: "#991b1b", border: "#fecaca" },
    "optimistic":  { bg: "#dcfce7", color: "#166534", border: "#bbf7d0" },
    "pessimistic": { bg: "#ffedd5", color: "#92400e", border: "#fed7aa" },
};
function tagStyle(t) {
    return TAG_COLORS[(t || "").toLowerCase()] || { bg: "#f3f4f6", color: "#374151", border: "#e5e7eb" };
}

/* ── BPMN XML parser (no bpmn-js — pure DOMParser) ────────────────────── */
function parseBpmnXml(xml) {
    const NS = "http://www.omg.org/spec/BPMN/20100524/MODEL";
    const parser = new DOMParser();
    const doc    = parser.parseFromString(xml, "application/xml");

    function byTag(...localNames) {
        const seen   = new Set();
        const result = [];
        for (const ln of localNames) {
            for (const el of [
                ...doc.getElementsByTagNameNS(NS, ln),
                ...doc.getElementsByTagName("bpmn:" + ln),
            ]) {
                const id = el.getAttribute("id");
                if (id && !seen.has(id)) { seen.add(id); result.push(el); }
            }
        }
        return result;
    }

    /* index sequence flows by id → for gateway path-name lookup */
    const flowMap = {};
    for (const el of byTag("sequenceFlow")) {
        const id = el.getAttribute("id");
        if (id) flowMap[id] = { id, name: el.getAttribute("name") || "" };
    }

    const userTasks = byTag("userTask").map(el => ({
        id:   el.getAttribute("id"),
        name: el.getAttribute("name") || el.getAttribute("id"),
    }));

    const serviceTasks = byTag("serviceTask").map(el => ({
        id:   el.getAttribute("id"),
        name: el.getAttribute("name") || el.getAttribute("id"),
    }));

    const GW_DEFS = [
        { tag: "exclusiveGateway",  gwType: "Exclusive",   parallel: false },
        { tag: "inclusiveGateway",  gwType: "Inclusive",   parallel: false },
        { tag: "parallelGateway",   gwType: "Parallel",    parallel: true  },
        { tag: "eventBasedGateway", gwType: "Event-Based", parallel: true  },
        { tag: "complexGateway",    gwType: "Complex",     parallel: false },
    ];
    const gateways = GW_DEFS.flatMap(({ tag, gwType, parallel }) =>
        byTag(tag).map(el => {
            const outIds = [];
            for (const child of el.children) {
                if (child.localName === "outgoing") {
                    const fid = child.textContent.trim();
                    if (fid) outIds.push(fid);
                }
            }
            const paths = outIds.map(fid => ({
                id:   fid,
                name: flowMap[fid]?.name || fid,
            }));
            return {
                id:       el.getAttribute("id"),
                name:     el.getAttribute("name") || el.getAttribute("id"),
                gwType,
                parallel,
                paths,
            };
        })
    );

    const variables = byTag("dataObjectReference").map(el => ({
        id:   el.getAttribute("id"),
        name: el.getAttribute("name") || el.getAttribute("id"),
    }));

    return { userTasks, serviceTasks, gateways, variables };
}

/* ── form helpers ──────────────────────────────────────────────────────── */
const DEFAULT_FORM = {
    id: "", name: "", model_ref: "",
    metadata:    { author: "", description: "", tags: [], processTitle: "" },
    parameters:  { userTasks: {}, serviceTasks: {}, gateways: {}, variables: {} },
    constraints: { maxTokens: "", timeHorizonValue: "", timeHorizonUnit: "hours" },
};

function asParamObj(val, fallback = {}) {
    if (val && typeof val === "object" && !Array.isArray(val)) return val;
    return fallback;
}

function initForm(scenario) {
    if (!scenario) return { ...DEFAULT_FORM };
    const p = scenario.parameters || {};
    return {
        ...DEFAULT_FORM, ...scenario,
        metadata: {
            ...DEFAULT_FORM.metadata,
            ...(scenario.metadata || {}),
            tags: Array.isArray(scenario.metadata?.tags) ? [...scenario.metadata.tags] : [],
        },
        parameters: {
            userTasks:    asParamObj(p.userTasks),
            serviceTasks: asParamObj(p.serviceTasks),
            gateways:     asParamObj(p.gateways),
            variables:    asParamObj(p.variables),
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
/* Fetches the BPMN file URL from the API, resolves the XML text, and hands
   both to the caller:
     • onElementsParsed(elements | null) — DOMParser extraction of BPMN elements
     • onViewerReady(viewer)            — live bpmn-js instance after importXML
     • onViewerReset()                  — fired when the viewer is torn down    */
function BpmnSection({
    processKey,
    onElementsParsed, onViewerReady, onViewerReset,
}) {
    const [vState,  setVState]  = useState(BSTATE.idle);
    const [bpmnXml, setBpmnXml] = useState(null);
    const [bustKey, setBustKey] = useState(0);

    useEffect(() => {
        if (!processKey) {
            setVState(BSTATE.idle);
            setBpmnXml(null);
            onElementsParsed(null);
            onViewerReset?.();
            return;
        }
        setVState(BSTATE.loading);
        setBpmnXml(null);
        onViewerReset?.();

        axios.post(`${API_URL}?service.key=masterKey.tenantData`, {
            dataKeys: [{ serviceParams: "", dataKey: "engine", serviceKey: "bpm.list.process", mode: "formData" }],
        })
        .then(res => {
            if (res.data?.C_STATUS !== "SUCCESS") { setVState(BSTATE.error); return; }
            const match = (res.data.C_DATA?.engine || []).find(
                tp => (tp.process_def_key || "").toLowerCase().trim() === processKey.toLowerCase().trim()
            );
            if (!match)              { setVState(BSTATE.notDeployed); onElementsParsed(null); return; }
            if (!match.process_file) { setVState(BSTATE.noFile);      onElementsParsed(null); return; }

            const url = `${FILE_URL}/process/${encodeURIComponent(match.id)}/${encodeURIComponent(match.process_file)}`;

            /* Single fetch — XML used for both element parsing and viewer import */
            fetch(`${url}?v=${Date.now()}`)
                .then(r => r.text())
                .then(xml => {
                    setBpmnXml(xml);
                    setVState(BSTATE.found);
                    onElementsParsed(parseBpmnXml(xml));
                })
                .catch(err => {
                    console.warn("BPMN XML fetch error:", err);
                    setVState(BSTATE.error);
                    onElementsParsed(null);
                });
        })
        .catch(() => { setVState(BSTATE.error); onElementsParsed(null); });
    }, [processKey, bustKey]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="psim-proc-bpmn">

            {vState === BSTATE.idle        && <StatusCard icon="fa-diagram-project"      title="No process selected"    hint="Select a target process above to preview its diagram." />}
            {vState === BSTATE.loading     && <StatusCard icon="fa-circle-notch fa-spin" title="Loading diagram…" />}
            {vState === BSTATE.notDeployed && <StatusCard icon="fa-triangle-exclamation" title="Process not deployed"   hint={`No deployed instance found for "${processKey}". Deploy the process first.`} warn />}
            {vState === BSTATE.noFile      && <StatusCard icon="fa-file-circle-question" title="Diagram not available"  hint="The process is deployed but no BPMN file is attached to its definition." warn />}
            {vState === BSTATE.error       && <StatusCard icon="fa-circle-xmark"         title="Could not load diagram" hint="There was a problem fetching the process definition." err onRetry={() => setBustKey(k => k + 1)} />}

            {vState === BSTATE.found && bpmnXml && (
                <div className="psim-bpmn-container">
                    <ProcessModelViewer
                        xml={bpmnXml}
                        xmlKey={bustKey}
                        onViewerReady={onViewerReady}
                        onViewerReset={onViewerReset}
                    />
                </div>
            )}
        </div>
    );
}

/* ── ConfigDialog — type-specific simulation config dialog ─────────────── */
function ConfigDialog({ type, element, config, onSave, onClose }) {
    const [local, setLocal] = useState(() => {
        if (type === "gateways") {
            /* initialise probabilities map from existing config or default 0 */
            const probs = {};
            (element.paths || []).forEach(p => {
                probs[p.id] = (config?.paths || []).find(cp => cp.id === p.id)?.probability ?? "";
            });
            return { probs };
        }
        if (type === "userTasks")    return { minDuration: "", maxDuration: "", durationUnit: "minutes", resources: "1", ...config };
        if (type === "serviceTasks") return { minDuration: "", maxDuration: "", durationUnit: "seconds",              ...config };
        if (type === "variables")    return { initialValue: "", dataType: "string",                                  ...config };
        return { ...config };
    });

    function set(k, v) { setLocal(s => ({ ...s, [k]: v })); }
    function setProb(pathId, v) { setLocal(s => ({ ...s, probs: { ...s.probs, [pathId]: v } })); }

    /* gateway probability total for validation hint */
    const totalProb = element.paths
        ? element.paths.reduce((acc, p) => acc + (parseFloat(local.probs?.[p.id]) || 0), 0)
        : 0;

    function handleSave() {
        if (type === "gateways") {
            const paths = (element.paths || []).map(p => ({
                id:          p.id,
                name:        p.name,
                probability: parseFloat(local.probs[p.id]) || 0,
            }));
            onSave({ paths });
        } else {
            onSave({ ...local });
        }
    }

    const title = element.name || element.id;

    return (
        <div className="psim-proc-dlg-overlay" onClick={onClose}>
            <div className="psim-cfg-dlg" onClick={e => e.stopPropagation()}>
                {/* header */}
                <div className="psim-proc-dlg-header">
                    <span className="psim-proc-dlg-title">
                        <i className={`fa-solid ${ELEM_TABS.find(t => t.key === type)?.icon}`} aria-hidden="true" />
                        Configure: {title}
                    </span>
                    <button type="button" className="orch-icon-btn" onClick={onClose}>
                        <i className="fa-solid fa-xmark" aria-hidden="true" />
                    </button>
                </div>

                {/* body */}
                <div className="psim-cfg-dlg-body">

                    {/* ── User Task ── */}
                    {type === "userTasks" && (
                        <>
                            <div className="psim-cfg-field-group">
                                <label className="psim-field-label">Min Duration</label>
                                <div className="psim-cfg-duration-row">
                                    <input type="number" className="form-control form-control-sm" placeholder="e.g. 5"
                                        min={0} value={local.minDuration}
                                        onChange={e => set("minDuration", e.target.value)} />
                                    <select className="form-select form-select-sm" value={local.durationUnit}
                                        onChange={e => set("durationUnit", e.target.value)}>
                                        {DURATION_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="psim-cfg-field-group">
                                <label className="psim-field-label">Max Duration</label>
                                <div className="psim-cfg-duration-row">
                                    <input type="number" className="form-control form-control-sm" placeholder="e.g. 30"
                                        min={0} value={local.maxDuration}
                                        onChange={e => set("maxDuration", e.target.value)} />
                                    <span className="psim-cfg-unit-label">{local.durationUnit}</span>
                                </div>
                            </div>
                            <div className="psim-cfg-field-group">
                                <label className="psim-field-label">Resource Count</label>
                                <input type="number" className="form-control form-control-sm" placeholder="e.g. 1"
                                    min={1} value={local.resources} style={{ maxWidth: 100 }}
                                    onChange={e => set("resources", e.target.value)} />
                                <small className="text-muted">Concurrent workers that can process this task.</small>
                            </div>
                        </>
                    )}

                    {/* ── Service Task ── */}
                    {type === "serviceTasks" && (
                        <>
                            <div className="psim-cfg-field-group">
                                <label className="psim-field-label">Min Response Time</label>
                                <div className="psim-cfg-duration-row">
                                    <input type="number" className="form-control form-control-sm" placeholder="e.g. 1"
                                        min={0} value={local.minDuration}
                                        onChange={e => set("minDuration", e.target.value)} />
                                    <select className="form-select form-select-sm" value={local.durationUnit}
                                        onChange={e => set("durationUnit", e.target.value)}>
                                        {DURATION_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="psim-cfg-field-group">
                                <label className="psim-field-label">Max Response Time</label>
                                <div className="psim-cfg-duration-row">
                                    <input type="number" className="form-control form-control-sm" placeholder="e.g. 10"
                                        min={0} value={local.maxDuration}
                                        onChange={e => set("maxDuration", e.target.value)} />
                                    <span className="psim-cfg-unit-label">{local.durationUnit}</span>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ── Gateway ── */}
                    {type === "gateways" && (
                        <>
                            {element.parallel ? (
                                <div className="psim-cfg-parallel-info">
                                    <i className="fa-solid fa-circle-info" aria-hidden="true" />
                                    <div>
                                        <strong>{element.gwType} Gateway</strong> — all outgoing paths are activated
                                        simultaneously. No probability configuration is needed.
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p className="psim-cfg-help-text">
                                        Set the probability (%) for each outgoing path. Probabilities should sum to 100.
                                    </p>
                                    {element.paths && element.paths.length > 0 ? (
                                        <div className="psim-cfg-gw-paths">
                                            {element.paths.map(p => (
                                                <div key={p.id} className="psim-cfg-gw-row">
                                                    <span className="psim-cfg-gw-path-name" title={p.id}>
                                                        <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                                                        {p.name || p.id}
                                                    </span>
                                                    <div className="psim-cfg-gw-prob">
                                                        <input
                                                            type="number"
                                                            className="form-control form-control-sm"
                                                            placeholder="0–100"
                                                            min={0} max={100}
                                                            value={local.probs?.[p.id] ?? ""}
                                                            onChange={e => setProb(p.id, e.target.value)}
                                                        />
                                                        <span className="psim-cfg-pct-label">%</span>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className={`psim-cfg-gw-total${Math.abs(totalProb - 100) < 0.01 ? " ok" : totalProb > 0 ? " warn" : ""}`}>
                                                Total: {totalProb.toFixed(totalProb % 1 === 0 ? 0 : 1)}%
                                                {Math.abs(totalProb - 100) < 0.01 && <i className="fa-solid fa-check ms-1" />}
                                                {totalProb > 0 && Math.abs(totalProb - 100) >= 0.01 &&
                                                    <span className="ms-1">(should equal 100%)</span>}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-muted" style={{ fontSize: "0.82rem" }}>
                                            No outgoing paths found for this gateway in the BPMN diagram.
                                        </p>
                                    )}
                                </>
                            )}
                        </>
                    )}

                    {/* ── Variable ── */}
                    {type === "variables" && (
                        <>
                            <div className="psim-cfg-field-group">
                                <label className="psim-field-label">Data Type</label>
                                <select className="form-select form-select-sm" value={local.dataType}
                                    onChange={e => set("dataType", e.target.value)} style={{ maxWidth: 160 }}>
                                    {DATA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="psim-cfg-field-group">
                                <label className="psim-field-label">Initial Value</label>
                                <input type="text" className="form-control form-control-sm"
                                    placeholder="Leave blank for empty/null…"
                                    value={local.initialValue}
                                    onChange={e => set("initialValue", e.target.value)} />
                            </div>
                        </>
                    )}
                </div>

                {/* footer */}
                <div className="psim-cfg-dlg-footer">
                    <button type="button" className="btn btn-sm psim-rp-cancel-btn" onClick={onClose}>
                        <i className="fa-solid fa-xmark" />Cancel
                    </button>
                    {!element.parallel && (
                        <button type="button" className="btn button-theme btn-sm" onClick={handleSave}>
                            <i className="fa-solid fa-floppy-disk" />Apply
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ── summary badge helpers ──────────────────────────────────────────────── */
function UserTaskSummary({ cfg }) {
    if (!cfg) return <span className="psim-elem-badge psim-elem-badge--empty">Not configured</span>;
    const parts = [];
    if (cfg.minDuration || cfg.maxDuration) {
        const min = cfg.minDuration || "?";
        const max = cfg.maxDuration || "?";
        parts.push(`${min}–${max} ${cfg.durationUnit || "min"}`);
    }
    if (cfg.resources && cfg.resources !== "1") parts.push(`${cfg.resources} resources`);
    if (parts.length === 0) return <span className="psim-elem-badge psim-elem-badge--empty">Not configured</span>;
    return <span className="psim-elem-badge psim-elem-badge--set">{parts.join(" · ")}</span>;
}

function ServiceTaskSummary({ cfg }) {
    if (!cfg) return <span className="psim-elem-badge psim-elem-badge--empty">Not configured</span>;
    if (!cfg.minDuration && !cfg.maxDuration) return <span className="psim-elem-badge psim-elem-badge--empty">Not configured</span>;
    const min = cfg.minDuration || "?";
    const max = cfg.maxDuration || "?";
    return <span className="psim-elem-badge psim-elem-badge--set">{min}–{max} {cfg.durationUnit || "sec"}</span>;
}

function GatewaySummary({ element, cfg }) {
    if (element.parallel) return <span className="psim-elem-badge psim-elem-badge--info">{element.gwType}</span>;
    if (!cfg?.paths?.length) return <span className="psim-elem-badge psim-elem-badge--empty">Not configured</span>;
    const total = cfg.paths.reduce((a, p) => a + (parseFloat(p.probability) || 0), 0);
    const ok = Math.abs(total - 100) < 0.01;
    return (
        <span className={`psim-elem-badge${ok ? " psim-elem-badge--set" : " psim-elem-badge--warn"}`}>
            {cfg.paths.length} paths · {total.toFixed(0)}%{!ok ? " ⚠" : ""}
        </span>
    );
}

function VariableSummary({ cfg }) {
    if (!cfg) return <span className="psim-elem-badge psim-elem-badge--empty">Not configured</span>;
    const parts = [];
    if (cfg.dataType) parts.push(cfg.dataType);
    if (cfg.initialValue) parts.push(`= ${cfg.initialValue}`);
    if (parts.length === 0) return <span className="psim-elem-badge psim-elem-badge--empty">Not configured</span>;
    return <span className="psim-elem-badge psim-elem-badge--set">{parts.join(", ")}</span>;
}

/* ── Element list for each tab ─────────────────────────────────────────── */
function ElementList({ type, elements, params, onConfigure, bpmnReady }) {
    if (!bpmnReady) {
        return (
            <div className="psim-elem-empty">
                <i className="fa-solid fa-diagram-project" aria-hidden="true" />
                Select a target process above to load its elements.
            </div>
        );
    }
    if (!elements || elements.length === 0) {
        const label = ELEM_TABS.find(t => t.key === type)?.label.toLowerCase() || "elements";
        return (
            <div className="psim-elem-empty">
                <i className="fa-solid fa-circle-info" aria-hidden="true" />
                No {label} found in this BPMN diagram.
            </div>
        );
    }
    return (
        <div className="psim-elem-list">
            {elements.map(elem => (
                <div key={elem.id} className="psim-elem-row">
                    <div className="psim-elem-info">
                        <span className="psim-elem-name" title={elem.id}>{elem.name}</span>
                        {type === "userTasks"    && <UserTaskSummary    cfg={params[elem.id]} />}
                        {type === "serviceTasks" && <ServiceTaskSummary cfg={params[elem.id]} />}
                        {type === "gateways"     && <GatewaySummary     element={elem} cfg={params[elem.id]} />}
                        {type === "variables"    && <VariableSummary    cfg={params[elem.id]} />}
                    </div>
                    <button
                        type="button"
                        className="btn btn-sm psim-elem-cfg-btn"
                        onClick={() => onConfigure(elem)}>
                        <i className="fa-solid fa-sliders" aria-hidden="true" />
                        Configure
                    </button>
                </div>
            ))}
        </div>
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
     scenario   scenario being edited (null = new)
     saving     bool
     formKey    increment to force-reset the form
     onSave(formData)
     onCancel()
   ════════════════════════════════════════════════════════════════════════════ */
function ScenarioPanel({ scenario, saving, formKey, onSave, onCancel }) {
    /* ── form state ─────────────────────────────────────────────────────── */
    const [form,      setForm]      = useState(() => initForm(scenario));
    const [topTab,    setTopTab]    = useState("process");
    const [elemTab,   setElemTab]   = useState("userTasks");
    const [customTag, setCustomTag] = useState("");
    const [bpmnMax,   setBpmnMax]   = useState(false);

    /* ── BPMN elements (parsed from XML by BpmnSection) ─────────────────── */
    const [bpmnElements, setBpmnElements] = useState(null); // null = not loaded

    /* ── live bpmn-js viewer instance (set by ProcessModelViewer) ─────────── */
    const [viewer, setViewer] = useState(null);

    /* ── configure dialog ───────────────────────────────────────────────── */
    const [configTarget, setConfigTarget] = useState(null); // { type, element }

    /* ── process selector dialog ────────────────────────────────────────── */
    const [showProcDlg,  setShowProcDlg]  = useState(false);
    const [processes,    setProcesses]    = useState([]);
    const [loadingProcs, setLoadingProcs] = useState(false);
    const [procsError,   setProcsError]   = useState(false);
    const [procsLoaded,  setProcsLoaded]  = useState(false);

    /* ── reset form when scenario / formKey changes ─────────────────────── */
    useEffect(() => {
        setForm(initForm(scenario));
        setTopTab("process");
        setElemTab("userTasks");
        setCustomTag("");
        setBpmnMax(false);
        setShowProcDlg(false);
        setConfigTarget(null);
        setBpmnElements(null);
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
    const isEdit    = !!(scenario?.id);
    const isValid   = form.name.trim().length > 0 && form.model_ref.trim().length > 0;
    const procOpts  = processes.map(p => ({ value: p.process_key, label: p.title ? `${p.title} (${p.process_key})` : p.process_key }));
    const selProc   = processes.find(p => p.process_key === form.model_ref);
    const procLabel = selProc?.title || form.model_ref || "";

    /* ── save ───────────────────────────────────────────────────────────── */
    function handleSave() {
        if (!isValid || saving) return;
        onSave({ ...form, name: form.name.trim(), model_ref: form.model_ref.trim() });
    }

    /* ── process selection ──────────────────────────────────────────────── */
    function handleProcessSelect(e) {
        const key   = e.target.value;
        const match = processes.find(p => p.process_key === key);
        setForm(f => ({ ...f, model_ref: key, metadata: { ...f.metadata, processTitle: match?.title || "" } }));
        setBpmnElements(null);
        setShowProcDlg(false);
    }

    /* ── configure dialog handlers ──────────────────────────────────────── */
    function openConfigure(type, element) {
        setConfigTarget({ type, element });
    }
    function closeConfigure() { setConfigTarget(null); }
    function applyConfig(newConfig) {
        const { type, element } = configTarget;
        setForm(f => ({
            ...f,
            parameters: {
                ...f.parameters,
                [type]: { ...f.parameters[type], [element.id]: newConfig },
            },
        }));
        setConfigTarget(null);
    }

    /* ── element count badge helper ─────────────────────────────────────── */
    function elemCount(key) {
        if (!bpmnElements) return "";
        const n = (bpmnElements[key] || []).length;
        return n > 0 ? ` (${n})` : "";
    }

    /* ════════════════════════════════════════════════════════════════════
       Render
       ════════════════════════════════════════════════════════════════════ */
    return (
        <div className={`psim-panel psim-right-panel${bpmnMax ? " psim-right-panel--max" : ""}`}>

            {/* ══ TOP-LEVEL TAB NAV ══════════════════════════════════════════ */}
            <div className="psim-top-tab-nav">
                <div className="psim-top-tab-btns">
                    {TOP_TABS.map(t => (
                        <button key={t.key} type="button"
                            className={`psim-top-tab${topTab === t.key ? " psim-top-tab--active" : ""}`}
                            onClick={() => setTopTab(t.key)}>
                            <i className={`fa-solid ${t.icon}`} aria-hidden="true" />
                            {t.label}
                        </button>
                    ))}
                </div>
                <div className="psim-top-tab-actions">
                    <button type="button" className="btn button-theme btn-sm"
                        onClick={handleSave} disabled={!isValid || saving}>
                        {saving
                            ? <><i className="fa-solid fa-circle-notch fa-spin" />Saving…</>
                            : <><i className="fa-solid fa-floppy-disk" />{isEdit ? "Update" : "Save"}</>}
                    </button>
                    <button type="button" className="btn btn-sm psim-rp-cancel-btn" onClick={onCancel}>
                        <i className="fa-solid fa-xmark" />Cancel
                    </button>
                    <button
                        type="button"
                        className="psim-top-maximize-btn"
                        title={bpmnMax ? "Restore panel" : "Maximize panel"}
                        onClick={() => setBpmnMax(m => !m)}>
                        <i className={`fa-solid ${bpmnMax ? "fa-compress" : "fa-expand"}`} aria-hidden="true" />
                    </button>
                </div>
            </div>

            {/* ══ TAB CONTENT ════════════════════════════════════════════════ */}
            <div className="psim-top-tab-content">

                {/* ── PROCESS TAB ─────────────────────────────────────────── */}
                {topTab === "process" && (
                    <div className={`psim-proc-tab${bpmnMax ? " psim-proc-tab--max" : ""}`}>

                        {/* Top 10%: name + process selector */}
                        <div className="psim-proc-top">
                            <span className="psim-rp-top-icon">
                                <i className="fa-solid fa-flask-vial" aria-hidden="true" />
                            </span>
                            <input type="text" className="form-control form-control-sm psim-rp-name-input"
                                placeholder="Scenario name…"
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                            {form.model_ref ? (
                                <div className="psim-rp-proc-badge">
                                    <i className="fa-solid fa-diagram-project" aria-hidden="true" />
                                    <span className="psim-rp-proc-label" title={procLabel}>{procLabel || form.model_ref}</span>
                                    <button type="button" className="psim-selected-proc-clear" title="Change process"
                                        onClick={() => setShowProcDlg(true)}>
                                        <i className="fa-solid fa-pen" aria-hidden="true" />
                                    </button>
                                    <button type="button" className="psim-selected-proc-clear" title="Clear process"
                                        onClick={() => { setForm(f => ({ ...f, model_ref: "", metadata: { ...f.metadata, processTitle: "" } })); setBpmnElements(null); }}>
                                        <i className="fa-solid fa-xmark" aria-hidden="true" />
                                    </button>
                                </div>
                            ) : (
                                <button type="button" className="btn btn-sm psim-proc-select-btn"
                                    onClick={() => setShowProcDlg(true)}>
                                    <i className="fa-solid fa-diagram-project" aria-hidden="true" />
                                    Select Process
                                </button>
                            )}
                        </div>

                        {/* Simulation controls bar */}
                        <SimulationControls
                            viewer={viewer}
                            scenario={form}
                        />

                        {/* Middle ~55%: BPMN viewer (with built-in token-simulation UI) */}
                        <BpmnSection
                            processKey={form.model_ref}
                            onElementsParsed={setBpmnElements}
                            onViewerReady={setViewer}
                            onViewerReset={() => setViewer(null)}
                        />

                        {/* Bottom 30%: BPMN element tabs */}
                        <div className="psim-proc-bottom">
                            <div className="psim-proc-subtab-nav">
                                {ELEM_TABS.map(t => (
                                    <button key={t.key} type="button"
                                        className={`psim-form-tab${elemTab === t.key ? " psim-form-tab--active" : ""}`}
                                        onClick={() => setElemTab(t.key)}>
                                        <i className={`fa-solid ${t.icon}`} aria-hidden="true" />
                                        {t.label}{elemCount(t.key)}
                                    </button>
                                ))}
                            </div>
                            <div className="psim-tab-body-scroll">
                                <ElementList
                                    type={elemTab}
                                    elements={bpmnElements?.[elemTab]}
                                    params={form.parameters[elemTab] || {}}
                                    onConfigure={elem => openConfigure(elemTab, elem)}
                                    bpmnReady={!!bpmnElements}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── META TAB ────────────────────────────────────────────── */}
                {topTab === "meta" && (
                    <MetadataTab form={form} setForm={setForm} customTag={customTag} setCustomTag={setCustomTag} />
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
                            <button type="button" className="orch-icon-btn" onClick={() => setShowProcDlg(false)}>
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

            {/* ══ CONFIGURE ELEMENT DIALOG ════════════════════════════════════ */}
            {configTarget && (
                <ConfigDialog
                    type={configTarget.type}
                    element={configTarget.element}
                    config={form.parameters[configTarget.type]?.[configTarget.element.id]}
                    onSave={applyConfig}
                    onClose={closeConfigure}
                />
            )}
        </div>
    );
}

export default ScenarioPanel;
