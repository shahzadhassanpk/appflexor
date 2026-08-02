import React, { useEffect, useRef, useState } from "react";
import { API_URL } from "../../../Config";
import { getData, handleSave, handleDelete } from "../../../components/CrudApiCall";
import { toastEmitter } from "../../../components/Toastify/Toastify";
import { filterArrayByTerms } from "../../../utils/utils";

const EMPTY_VQ = { collection: "", search_text: "", top_k: 5 };

const EMPTY_TASK = {
    id: "new",
    agent_key: "",
    task_key: "",
    user_prompt: "",
    sql_query: "",
    vector_query: JSON.stringify(EMPTY_VQ),
};

function parseVQ(raw) {
    try { return JSON.parse(raw) || EMPTY_VQ; } catch { return { ...EMPTY_VQ }; }
}

function AiTasks({ selectedAgent, onChangeAgent }) {
    const [agents, setAgents]     = useState([]);
    const [tasks, setTasks]       = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [form, setForm]         = useState(EMPTY_TASK);
    const [vq, setVq]             = useState(EMPTY_VQ);
    const [showForm, setShowForm] = useState(false);
    const [showJson, setShowJson] = useState(null);
    const [errors, setErrors]     = useState({});
    const [saving, setSaving]     = useState(false);
    const searchRef = useRef();

    // Load agent list on mount
    useEffect(() => {
        getData({
            keys: [{ params: "", dataKey: "agents", serviceKey: "ai.agent.list", mode: "formData" }],
        }).then(res => {
            setAgents(res?.data?.C_DATA?.agents || []);
        }).catch(console.error);
    }, []);

    // Load tasks when selected agent changes
    useEffect(() => {
        if (selectedAgent?.agent_key) {
            loadTasks(selectedAgent.agent_key);
        } else {
            setTasks([]);
            setFiltered([]);
        }
    }, [selectedAgent]);

    function loadTasks(agent_key) {
        getData({
            keys: [{ params: agent_key, dataKey: "tasks", serviceKey: "ai.task.by.agent", mode: "formData" }],
        }).then(res => {
            const data = res?.data?.C_DATA?.tasks || [];
            setTasks(data);
            setFiltered(data);
        }).catch(console.error);
    }

    function handleAgentSelect(e) {
        const key   = e.target.value;
        const agent = agents.find(a => a.agent_key === key) || null;
        if (onChangeAgent) onChangeAgent(agent);
    }

    function handleSearch(e) {
        const term = e.target.value.toLowerCase();
        if (!term) { setFiltered(tasks); return; }
        setFiltered(filterArrayByTerms(tasks, term, ["task_key", "user_prompt"]));
    }

    function openAdd() {
        setForm({ ...EMPTY_TASK, agent_key: selectedAgent?.agent_key || "" });
        setVq({ ...EMPTY_VQ });
        setErrors({});
        setShowForm(true);
    }

    function openEdit(t) {
        setForm({ ...t });
        setVq(parseVQ(t.vector_query));
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
        setVq(prev => ({ ...prev, [name]: name === "top_k" ? Number(value) : value }));
    }

    function validate() {
        const errs = {};
        if (!form.agent_key?.trim())   errs.agent_key   = "Agent key is required";
        if (!form.task_key?.trim())    errs.task_key    = "Task key is required";
        if (!form.user_prompt?.trim()) errs.user_prompt = "User prompt is required";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    function save() {
        if (!validate()) return;
        setSaving(true);
        const payload = { ...form, vector_query: JSON.stringify(vq) };
        handleSave({ entity: "ai_task", formData: payload })
            .then(res => {
                if (res?.data?.C_STATUS === "SUCCESS") {
                    toastEmitter(form.id === "new" ? "Task created" : "Task updated", true);
                    setShowForm(false);
                    if (selectedAgent?.agent_key) loadTasks(selectedAgent.agent_key);
                } else {
                    toastEmitter(res?.data?.C_MESSAGE || "Save failed", true, "warning");
                }
            })
            .finally(() => setSaving(false));
    }

    function remove(t) {
        if (!window.confirm(`Delete task "${t.task_key}"?`)) return;
        handleDelete({ entity: "ai_task", url: API_URL + "?service.key=update.formData", arr: [t.id] })
            .then(res => {
                if (res?.data?.C_STATUS === "SUCCESS") {
                    toastEmitter("Task deleted", true);
                    if (selectedAgent?.agent_key) loadTasks(selectedAgent.agent_key);
                } else {
                    toastEmitter(res?.data?.C_MESSAGE || "Delete failed", true, "warning");
                }
            });
    }

    function exportJson(t) {
        const blob = new Blob([JSON.stringify(t, null, 2)], { type: "application/json" });
        const url  = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href     = url;
        link.download = `${t.task_key}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="ai-tab-pane">
            {/* Agent selector */}
            <div className="ai-agent-selector">
                <label>
                    <i className="fa-solid fa-robot me-1" /> Agent
                </label>
                <select
                    className="form-control form-select"
                    value={selectedAgent?.agent_key || ""}
                    onChange={handleAgentSelect}>
                    <option value="">— Select an agent to view tasks —</option>
                    {agents.map(a => (
                        <option key={a.id} value={a.agent_key}>{a.agent_key}</option>
                    ))}
                </select>
                {selectedAgent && (
                    <span className="text-muted" style={{ fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                        <i className="fa-solid fa-plug-circle-bolt me-1" />
                        {selectedAgent.ai_provider}
                    </span>
                )}
            </div>

            {/* No agent selected */}
            {!selectedAgent && (
                <div className="ai-empty">
                    <i className="fa-solid fa-list-check" />
                    Select an agent above to view and manage its tasks,
                    or open tasks from the <strong>AI Agents</strong> tab.
                </div>
            )}

            {/* Toolbar — only shown when agent is selected */}
            {selectedAgent && (
                <>
                    <div className="ai-toolbar">
                        <input
                            ref={searchRef}
                            className="form-control ai-search"
                            placeholder="Search tasks…"
                            onChange={handleSearch}
                        />
                        <button className="btn btn-primary btn-sm" onClick={openAdd}>
                            <i className="fa-solid fa-plus me-1" /> Add Task
                        </button>
                    </div>

                    {/* Table */}
                    <div className="table-responsive">
                        <table className="table s2a-table ai-table table-hover mb-0">
                            <thead className="thead">
                                <tr>
                                    <th>Task Key</th>
                                    <th>User Prompt</th>
                                    <th>SQL Query</th>
                                    <th>Vector Query</th>
                                    <th style={{ width: 120 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={5}>
                                            <div className="ai-empty">
                                                <i className="fa-solid fa-list-check" />
                                                No tasks for <strong>{selectedAgent.agent_key}</strong>.
                                                Add one to define a workflow step.
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {filtered.map(t => (
                                    <tr key={t.id}>
                                        <td><code className="ai-code-badge">{t.task_key}</code></td>
                                        <td>
                                            <span className="ai-truncate" title={t.user_prompt}>
                                                {t.user_prompt}
                                            </span>
                                        </td>
                                        <td>
                                            {t.sql_query
                                                ? <code className="ai-truncate" style={{ maxWidth: 140, fontSize: "0.75rem" }} title={t.sql_query}>{t.sql_query}</code>
                                                : <span className="text-muted">—</span>}
                                        </td>
                                        <td>
                                            {t.vector_query && t.vector_query !== "{}"
                                                ? <span className="ai-truncate" style={{ maxWidth: 140 }} title={t.vector_query}>{t.vector_query}</span>
                                                : <span className="text-muted">—</span>}
                                        </td>
                                        <td>
                                            <button className="btn btn-sm ai-action-btn me-1" title="Preview JSON" onClick={() => setShowJson(t)}>
                                                <i className="fa-solid fa-code" />
                                            </button>
                                            <button className="btn btn-sm ai-action-btn me-1" title="Edit task" onClick={() => openEdit(t)}>
                                                <i className="fa-solid fa-pen" />
                                            </button>
                                            <button className="btn btn-sm ai-action-btn ai-action-danger" title="Delete task" onClick={() => remove(t)}>
                                                <i className="fa-solid fa-trash" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Add / Edit Modal */}
            {showForm && (
                <div className="ai-modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
                    <div className="ai-modal ai-modal-lg">
                        <div className="ai-modal-header">
                            <h5>
                                <i className="fa-solid fa-list-check me-2" />
                                {form.id === "new" ? "Add AI Task" : "Edit AI Task"}
                            </h5>
                            <button className="ai-modal-close" onClick={() => setShowForm(false)}>
                                <i className="fa-solid fa-xmark" />
                            </button>
                        </div>

                        <div className="ai-modal-body">
                            {/* Agent Key (read-only if coming from agent context) */}
                            <div className="mb-3">
                                <label className="ai-label">
                                    Agent Key <span className="text-danger">*</span>
                                    <span className="ai-tooltip ms-1" title="The agent this task belongs to. Matches the agent_key consumed by N8N webhooks.">
                                        <i className="fa-solid fa-circle-info" />
                                    </span>
                                </label>
                                {selectedAgent
                                    ? <input className="form-control" value={selectedAgent.agent_key} disabled />
                                    : (
                                        <select
                                            className={`form-control form-select ${errors.agent_key ? "is-invalid" : ""}`}
                                            name="agent_key"
                                            value={form.agent_key}
                                            onChange={handleInput}>
                                            <option value="">— Select agent —</option>
                                            {agents.map(a => (
                                                <option key={a.id} value={a.agent_key}>{a.agent_key}</option>
                                            ))}
                                        </select>
                                    )
                                }
                                {errors.agent_key && <div className="invalid-feedback d-block">{errors.agent_key}</div>}
                            </div>

                            {/* Task Key */}
                            <div className="mb-3">
                                <label className="ai-label">
                                    Task Key <span className="text-danger">*</span>
                                    <span className="ai-tooltip ms-1" title="Unique identifier for this task within the agent. Used by N8N to select the right prompt/query (e.g. classify-intent, extract-entities).">
                                        <i className="fa-solid fa-circle-info" />
                                    </span>
                                </label>
                                <input
                                    className={`form-control ${errors.task_key ? "is-invalid" : ""}`}
                                    name="task_key"
                                    value={form.task_key}
                                    onChange={handleInput}
                                    placeholder="e.g. classify-intent"
                                />
                                {errors.task_key && <div className="invalid-feedback">{errors.task_key}</div>}
                            </div>

                            {/* User Prompt */}
                            <div className="mb-3">
                                <label className="ai-label">
                                    User Prompt <span className="text-danger">*</span>
                                    <span className="ai-tooltip ms-1" title="The prompt template appended after the system prompt. Use {{variables}} for N8N-injected values.">
                                        <i className="fa-solid fa-circle-info" />
                                    </span>
                                </label>
                                <textarea
                                    className={`form-control ${errors.user_prompt ? "is-invalid" : ""}`}
                                    name="user_prompt"
                                    value={form.user_prompt}
                                    onChange={handleInput}
                                    rows={4}
                                    placeholder="Classify the intent of: {{userMessage}}"
                                />
                                {errors.user_prompt && <div className="invalid-feedback">{errors.user_prompt}</div>}
                            </div>

                            {/* SQL Query */}
                            <div className="ai-section-divider">
                                SQL Query
                                <span className="ms-2 text-muted" style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>optional</span>
                            </div>
                            <div className="mb-3">
                                <label className="ai-label">
                                    SQL Query
                                    <span className="ai-tooltip ms-1" title="SQL executed before the prompt to inject structured data as context. Results are serialised and appended to the prompt.">
                                        <i className="fa-solid fa-circle-info" />
                                    </span>
                                </label>
                                <textarea
                                    className="ai-sql-editor w-100"
                                    name="sql_query"
                                    value={form.sql_query}
                                    onChange={handleInput}
                                    rows={6}
                                    placeholder={"SELECT id, name, description\nFROM products\nWHERE active = true\nLIMIT 20"}
                                    spellCheck={false}
                                />
                                <small className="text-muted">
                                    <i className="fa-solid fa-circle-info me-1" />
                                    Results are serialised as JSON and injected into the prompt context.
                                </small>
                            </div>

                            {/* Vector Query */}
                            <div className="ai-section-divider">
                                Vector Query
                                <span className="ms-2 text-muted" style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>optional — overrides agent default</span>
                            </div>
                            <div className="ai-vector-grid mb-3">
                                <div>
                                    <label className="ai-label">
                                        Collection
                                        <span className="ai-tooltip ms-1" title="Vector store collection or index to search">
                                            <i className="fa-solid fa-circle-info" />
                                        </span>
                                    </label>
                                    <input
                                        className="form-control"
                                        name="collection"
                                        value={vq.collection}
                                        onChange={handleVqInput}
                                        placeholder="e.g. product_docs"
                                    />
                                </div>
                                <div>
                                    <label className="ai-label">
                                        Search Text
                                        <span className="ai-tooltip ms-1" title="Search text or template variable injected at runtime (e.g. {{userMessage}})">
                                            <i className="fa-solid fa-circle-info" />
                                        </span>
                                    </label>
                                    <input
                                        className="form-control"
                                        name="search_text"
                                        value={vq.search_text}
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
                                        name="top_k"
                                        type="number"
                                        min={1}
                                        max={50}
                                        value={vq.top_k}
                                        onChange={handleVqInput}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="ai-modal-footer">
                            <button className="btn btn-outline-secondary btn-sm" onClick={() => exportJson({ ...form, vector_query: JSON.stringify(vq) })}>
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
                            <h5><i className="fa-solid fa-code me-2" />Task Definition — {showJson.task_key}</h5>
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

export default AiTasks;
