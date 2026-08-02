import React, { useEffect, useRef, useState } from "react";
import { API_URL } from "../../../Config";
import { getData, handleSave, handleDelete } from "../../../components/CrudApiCall";
import { toastEmitter } from "../../../components/Toastify/Toastify";
import { filterArrayByTerms } from "../../../utils/utils";

const EMPTY_VQ = { collection: "", searchText: "", topK: 5 };
const EMPTY = {
    id: "new",
    agentName: "",
    agentKey: "",
    systemPrompt: "",
    aiProvider: "",
    defaultVectorQuery: JSON.stringify(EMPTY_VQ),
};

function parseVQ(raw) {
    try { return JSON.parse(raw) || EMPTY_VQ; } catch { return { ...EMPTY_VQ }; }
}

function AiAgents({ onOpenTasks }) {
    const [agents, setAgents]     = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [providers, setProviders] = useState([]);
    const [form, setForm]         = useState(EMPTY);
    const [vq, setVq]             = useState(EMPTY_VQ);   // parsed defaultVectorQuery
    const [showForm, setShowForm] = useState(false);
    const [showJson, setShowJson] = useState(null);        // agent to preview as JSON
    const [errors, setErrors]     = useState({});
    const [saving, setSaving]     = useState(false);
    const searchRef = useRef();

    useEffect(() => { load(); }, []);

    function load() {
        getData({
            keys: [
                { params: "", dataKey: "agents",    serviceKey: "ai.agent.list",    mode: "formData" },
                { params: "", dataKey: "providers", serviceKey: "ai.provider.list", mode: "formData" },
            ],
        }).then(res => {
            const agts = res?.data?.C_DATA?.agents    || [];
            const prvs = res?.data?.C_DATA?.providers || [];
            setAgents(agts);
            setFiltered(agts);
            setProviders(prvs);
        }).catch(console.error);
    }

    function handleSearch(e) {
        const term = e.target.value.toLowerCase();
        if (!term) { setFiltered(agents); return; }
        setFiltered(filterArrayByTerms(agents, term, ["agentName", "agentKey", "aiProvider"]));
    }

    function openAdd() {
        setForm({ ...EMPTY });
        setVq({ ...EMPTY_VQ });
        setErrors({});
        setShowForm(true);
    }

    function openEdit(a) {
        setForm({ ...a });
        setVq(parseVQ(a.defaultVectorQuery));
        setErrors({});
        setShowForm(true);
    }

    function handleInput(e) {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    }

    function handleVqInput(e) {
        const { name, value } = e.target;
        setVq(prev => ({ ...prev, [name]: name === "topK" ? Number(value) : value }));
    }

    function validate() {
        const errs = {};
        if (!form.agentName?.trim())    errs.agentName    = "Agent name is required";
        if (!form.agentKey?.trim())     errs.agentKey     = "Agent key is required";
        if (!form.systemPrompt?.trim()) errs.systemPrompt = "System prompt is required";
        if (!form.aiProvider?.trim())   errs.aiProvider   = "AI provider is required";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    function save() {
        if (!validate()) return;
        setSaving(true);
        const payload = { ...form, defaultVectorQuery: JSON.stringify(vq) };
        handleSave({ entity: "ai_agent", formData: payload })
            .then(res => {
                if (res?.data?.C_STATUS === "SUCCESS") {
                    toastEmitter(form.id === "new" ? "Agent created" : "Agent updated", true);
                    setShowForm(false);
                    load();
                } else {
                    toastEmitter(res?.data?.C_MESSAGE || "Save failed", true, "warning");
                }
            })
            .finally(() => setSaving(false));
    }

    function remove(a) {
        if (!window.confirm(`Delete agent "${a.agentKey}"? All associated tasks will also be removed.`)) return;
        handleDelete({ entity: "ai_agent", url: API_URL + "?service.key=update.formData", arr: [a.id] })
            .then(res => {
                if (res?.data?.C_STATUS === "SUCCESS") {
                    toastEmitter("Agent deleted", true);
                    load();
                } else {
                    toastEmitter(res?.data?.C_MESSAGE || "Delete failed", true, "warning");
                }
            });
    }

    function exportJson(a) {
        const blob = new Blob([JSON.stringify(a, null, 2)], { type: "application/json" });
        const url  = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href     = url;
        link.download = `${a.agentKey}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="ai-tab-pane">
            {/* Toolbar */}
            <div className="ai-toolbar">
                <input
                    ref={searchRef}
                    className="form-control ai-search"
                    placeholder="Search agents…"
                    onChange={handleSearch}
                />
                <button className="btn btn-primary btn-sm" onClick={openAdd}>
                    <i className="fa-solid fa-plus me-1" /> Add Agent
                </button>
            </div>

            {/* Table */}
            <div className="table-responsive">
                <table className="table s2a-table ai-table table-hover mb-0">
                    <thead className="thead">
                        <tr>
                            <th>Name</th>
                            <th>Agent Key</th>
                            <th>System Prompt</th>
                            <th>AI Provider</th>
                            <th style={{ width: 130 }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={5}>
                                    <div className="ai-empty">
                                        <i className="fa-solid fa-robot" />
                                        No agents found. Create one to define AI behaviour.
                                    </div>
                                </td>
                            </tr>
                        )}
                        {filtered.map(a => (
                            <tr key={a.id}>
                                <td><strong>{a.agentName}</strong></td>
                                <td><code className="ai-code-badge">{a.agentKey}</code></td>
                                <td>
                                    <span className="ai-truncate" title={a.systemPrompt}>
                                        {a.systemPrompt}
                                    </span>
                                </td>
                                <td>
                                    <span className="ai-code-badge">{a.aiProvider}</span>
                                </td>
                                <td>
                                    <button
                                        className="btn btn-sm ai-action-btn me-1"
                                        title="Open tasks for this agent"
                                        onClick={() => onOpenTasks && onOpenTasks(a)}>
                                        <i className="fa-solid fa-list-check" />
                                    </button>
                                    <button
                                        className="btn btn-sm ai-action-btn me-1"
                                        title="Preview JSON definition"
                                        onClick={() => setShowJson(a)}>
                                        <i className="fa-solid fa-code" />
                                    </button>
                                    <button
                                        className="btn btn-sm ai-action-btn me-1"
                                        title="Edit agent"
                                        onClick={() => openEdit(a)}>
                                        <i className="fa-solid fa-pen" />
                                    </button>
                                    <button
                                        className="btn btn-sm ai-action-btn ai-action-danger"
                                        title="Delete agent"
                                        onClick={() => remove(a)}>
                                        <i className="fa-solid fa-trash" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add / Edit Modal */}
            {showForm && (
                <div className="ai-modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
                    <div className="ai-modal ai-modal-lg">
                        <div className="ai-modal-header">
                            <h5>
                                <i className="fa-solid fa-robot me-2" />
                                {form.id === "new" ? "Add AI Agent" : "Edit AI Agent"}
                            </h5>
                            <button className="ai-modal-close" onClick={() => setShowForm(false)}>
                                <i className="fa-solid fa-xmark" />
                            </button>
                        </div>

                        <div className="ai-modal-body">
                            {/* Agent Name */}
                            <div className="mb-3">
                                <label className="ai-label">
                                    Name <span className="text-danger">*</span>
                                    <span className="ai-tooltip ms-1" title="Human-readable display name for this agent (e.g. Customer Support, Invoice Classifier).">
                                        <i className="fa-solid fa-circle-info" />
                                    </span>
                                </label>
                                <input
                                    className={`form-control ${errors.agentName ? "is-invalid" : ""}`}
                                    name="agentName"
                                    value={form.agentName}
                                    onChange={handleInput}
                                    placeholder="e.g. Customer Support"
                                />
                                {errors.agentName && <div className="invalid-feedback">{errors.agentName}</div>}
                            </div>

                            {/* Agent Key */}
                            <div className="mb-3">
                                <label className="ai-label">
                                    Agent Key <span className="text-danger">*</span>
                                    <span className="ai-tooltip ms-1" title="Unique identifier for this agent. Used by N8N webhooks to look up the agent config (e.g. customer-support, invoice-classifier).">
                                        <i className="fa-solid fa-circle-info" />
                                    </span>
                                </label>
                                <input
                                    className={`form-control ${errors.agentKey ? "is-invalid" : ""}`}
                                    name="agentKey"
                                    value={form.agentKey}
                                    onChange={handleInput}
                                    placeholder="e.g. customer-support"
                                />
                                {errors.agentKey && <div className="invalid-feedback">{errors.agentKey}</div>}
                            </div>

                            {/* AI Provider */}
                            <div className="mb-3">
                                <label className="ai-label">
                                    AI Provider <span className="text-danger">*</span>
                                    <span className="ai-tooltip ms-1" title="The AI provider this agent will use. Must match a configured Provider Key.">
                                        <i className="fa-solid fa-circle-info" />
                                    </span>
                                </label>
                                <select
                                    className={`form-control form-select ${errors.aiProvider ? "is-invalid" : ""}`}
                                    name="aiProvider"
                                    value={form.aiProvider}
                                    onChange={handleInput}>
                                    <option value="">— Select provider —</option>
                                    {providers.map(p => (
                                        <option key={p.id} value={p.providerKey}>{p.providerName} ({p.providerKey})</option>
                                    ))}
                                </select>
                                {errors.aiProvider && <div className="invalid-feedback">{errors.aiProvider}</div>}
                            </div>

                            {/* System Prompt */}
                            <div className="mb-3">
                                <label className="ai-label">
                                    System Prompt <span className="text-danger">*</span>
                                    <span className="ai-tooltip ms-1" title="The base instruction given to the AI model for every request processed by this agent. Defines its persona, scope, and behaviour.">
                                        <i className="fa-solid fa-circle-info" />
                                    </span>
                                </label>
                                <textarea
                                    className={`form-control ${errors.systemPrompt ? "is-invalid" : ""}`}
                                    name="systemPrompt"
                                    value={form.systemPrompt}
                                    onChange={handleInput}
                                    rows={5}
                                    placeholder="You are a helpful assistant that…"
                                />
                                {errors.systemPrompt && <div className="invalid-feedback">{errors.systemPrompt}</div>}
                            </div>

                            {/* Default Vector Query */}
                            <div className="ai-section-divider">Default Vector Query</div>
                            <p className="text-muted" style={{ fontSize: "0.75rem", marginBottom: "0.75rem" }}>
                                Applied when a task does not define its own vector query. Used for semantic search context retrieval.
                            </p>
                            <div className="ai-vector-grid mb-3">
                                <div>
                                    <label className="ai-label">
                                        Collection
                                        <span className="ai-tooltip ms-1" title="Vector store collection / index name">
                                            <i className="fa-solid fa-circle-info" />
                                        </span>
                                    </label>
                                    <input
                                        className="form-control"
                                        name="collection"
                                        value={vq.collection}
                                        onChange={handleVqInput}
                                        placeholder="e.g. knowledge_base"
                                    />
                                </div>
                                <div>
                                    <label className="ai-label">
                                        Search Text
                                        <span className="ai-tooltip ms-1" title="Default search text or template variable (e.g. {{userMessage}})">
                                            <i className="fa-solid fa-circle-info" />
                                        </span>
                                    </label>
                                    <input
                                        className="form-control"
                                        name="searchText"
                                        value={vq.searchText}
                                        onChange={handleVqInput}
                                        placeholder="{{userMessage}}"
                                    />
                                </div>
                                <div>
                                    <label className="ai-label">
                                        Top K
                                        <span className="ai-tooltip ms-1" title="Number of top results to retrieve from the vector store">
                                            <i className="fa-solid fa-circle-info" />
                                        </span>
                                    </label>
                                    <input
                                        className="form-control"
                                        name="topK"
                                        type="number"
                                        min={1}
                                        max={50}
                                        value={vq.topK}
                                        onChange={handleVqInput}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="ai-modal-footer">
                            <button className="btn btn-outline-secondary btn-sm" onClick={() => exportJson({ ...form, defaultVectorQuery: JSON.stringify(vq) })}>
                                <i className="fa-solid fa-download me-1" /> Export JSON
                            </button>
                            <button className="btn btn-secondary btn-sm ms-auto" onClick={() => setShowForm(false)}>Cancel</button>
                            <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
                                {saving
                                    ? <><i className="fa-solid fa-spinner fa-spin me-1" />Saving…</>
                                    : <><i className="fa-solid fa-floppy-disk me-1" />Save</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* JSON Preview Modal */}
            {showJson && (
                <div className="ai-modal-overlay" onClick={e => e.target === e.currentTarget && setShowJson(null)}>
                    <div className="ai-modal ai-modal-lg">
                        <div className="ai-modal-header">
                            <h5><i className="fa-solid fa-code me-2" />Agent Definition — {showJson.agentKey}</h5>
                            <button className="ai-modal-close" onClick={() => setShowJson(null)}>
                                <i className="fa-solid fa-xmark" />
                            </button>
                        </div>
                        <div className="ai-modal-body">
                            <pre className="ai-json-preview">{JSON.stringify(showJson, null, 2)}</pre>
                        </div>
                        <div className="ai-modal-footer">
                            <button className="btn btn-outline-secondary btn-sm" onClick={() => exportJson(showJson)}>
                                <i className="fa-solid fa-download me-1" /> Download JSON
                            </button>
                            <button className="btn btn-secondary btn-sm ms-auto" onClick={() => setShowJson(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AiAgents;
