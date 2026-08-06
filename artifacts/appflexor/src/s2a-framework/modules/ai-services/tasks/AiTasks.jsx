import React, { useEffect, useRef, useState } from "react";
import { API_URL } from "../../../Config";
import { getData, handleSave, handleDelete } from "../../../components/CrudApiCall";
import { toastEmitter } from "../../../components/Toastify/Toastify";
import { filterArrayByTerms } from "../../../utils/utils";

const EMPTY_VQ = { collection: "", search_text: "", top_k: 5 };
const EMPTY_TASK = {
    id: "new",
    agent: "",
    task_name: "",
    task_key: "",
    user_prompt: "",
    sql_query: "",
    vector_query: JSON.stringify(EMPTY_VQ),
};

function parseVQ(raw) {
    try { return JSON.parse(raw) || EMPTY_VQ; } catch { return { ...EMPTY_VQ }; }
}

function formatTaskRequest(task, agentKey) {
    return {
        agentKey,
        taskKey: task.task_key,
        payload: {
            business_key: "<Your business key to retrieve data context>",
            message: "<Your message to the AI>",
        },
    };
}

function copyTextFallback(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);

    try {
        textarea.select();
        return document.execCommand("copy");
    } finally {
        document.body.removeChild(textarea);
    }
}

/* ════════════════════════════════════════════════════════════════════════
   Compact embedded tasks panel — mounted inside AiAgents accordion row.
   Props:
     agentKey  – string (required)
     agentName – string (optional, for display)
   ════════════════════════════════════════════════════════════════════════ */
function AiTasks({ agentId, agentKey, agentName, onTaskCountChanged }) {
    const [tasks,    setTasks]    = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [form,     setForm]     = useState(EMPTY_TASK);
    const [vq,       setVq]       = useState(EMPTY_VQ);
    const [showForm, setShowForm] = useState(false);
    const [showJson, setShowJson] = useState(null);
    const [errors,   setErrors]   = useState({});
    const [saving,   setSaving]   = useState(false);
    const searchRef = useRef();

    /* load tasks when agent key is available (component mounts fresh each open) */
    useEffect(() => {
        if (agentId) loadTasks(agentId);
    }, [agentId]);

    function loadTasks(key) {
        getData({
            keys: [{ params: key, dataKey: "tasks", serviceKey: "ai.task.by.agent", mode: "formData" }],
        }).then(res => {
            const data = res?.data?.C_DATA?.tasks || [];
            setTasks(data);
            setFiltered(data);
            if (onTaskCountChanged) onTaskCountChanged(data.length);
        }).catch(console.error);
    }

    function handleSearch(e) {
        const term = e.target.value.toLowerCase();
        if (!term) { setFiltered(tasks); return; }
        setFiltered(filterArrayByTerms(tasks, term, ["task_name", "task_key", "user_prompt"]));
    }

    function openAdd() {
        setForm({ ...EMPTY_TASK, agent: agentId });
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
        if (!form.task_name?.trim())   errs.task_name   = "Task name is required";
        if (!form.task_key?.trim())    errs.task_key    = "Task key is required";
        if (!form.user_prompt?.trim()) errs.user_prompt = "User prompt is required";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    function save() {
        if (!validate()) return;
        setSaving(true);
        const taskForm = { ...form };
        delete taskForm.agent_key;
        handleSave({ entity: "ai_agent_task", formData: { ...taskForm, agent: agentId, vector_query: JSON.stringify(vq) } })
            .then(res => {
                if (res?.data?.C_STATUS === "SUCCESS") {
                    toastEmitter(form.id === "new" ? "Task created" : "Task updated", true);
                    setShowForm(false);
                    loadTasks(agentId);
                } else {
                    toastEmitter(res?.data?.C_MESSAGE || "Save failed", true, "warning");
                }
            })
            .finally(() => setSaving(false));
    }

    function remove(t) {
        if (!window.confirm(`Delete task "${t.task_key}"?`)) return;
        handleDelete({ entity: "ai_agent_task", url: API_URL + "?service.key=update.formData", arr: [t.id] })
            .then(res => {
                if (res?.data?.C_STATUS === "SUCCESS") {
                    toastEmitter("Task deleted", true);
                    loadTasks(agentId);
                } else {
                    toastEmitter(res?.data?.C_MESSAGE || "Delete failed", true, "warning");
                }
            });
    }

    function exportJson(t) {
        const request = formatTaskRequest(t, agentKey);
        const blob = new Blob([JSON.stringify(request, null, 2)], { type: "application/json" });
        const url  = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href     = url;
        link.download = `${t.task_key}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    async function copyJson(t) {
        const json = JSON.stringify(formatTaskRequest(t, agentKey), null, 2);

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(json);
            } else if (!copyTextFallback(json)) {
                throw new Error("Copy command was rejected");
            }
            toastEmitter("API request JSON copied", true);
        } catch {
            try {
                if (!copyTextFallback(json)) throw new Error("Copy command was rejected");
                toastEmitter("API request JSON copied", true);
            } catch {
                toastEmitter("Could not copy JSON. Select the JSON and copy it manually.", true, "warning");
            }
        }
    }

    return (
        <>
            {/* toolbar */}
            <div className="ais-tasks-toolbar">
                <span className="ais-tasks-label">
                    <i className="fa-solid fa-list-check" aria-hidden="true" />
                    Tasks
                    <span className="ais-tasks-count">{tasks.length}</span>
                </span>
                <div className="ais-tasks-search-wrap">
                    <input
                        ref={searchRef}
                        className="ais-tasks-search"
                        placeholder="Search tasks…"
                        onChange={handleSearch}
                        aria-label="Search tasks"
                    />
                </div>
                <button type="button" className="ais-add-btn" onClick={openAdd}>
                    <i className="fa-solid fa-plus" aria-hidden="true" /> Add Task
                </button>
            </div>

            {/* task rows */}
            {filtered.length === 0 ? (
                <div className="ais-tasks-empty">
                    <i className="fa-solid fa-list-check" aria-hidden="true" />
                    No tasks for <strong>{agentName || agentKey}</strong>. Add one to define a workflow step.
                </div>
            ) : (
                <div className="ais-tasks-list">
                    {filtered.map(t => (
                        <div key={t.id} className="ais-task-row">
                            <i className="fa-solid fa-list-check ais-task-icon" aria-hidden="true" />
                            <span className="ais-task-name">{t.task_name || t.task_key}</span>
                            <code className="ais-key-badge">{t.task_key}</code>
                            <span className="ais-task-prompt" title={t.user_prompt}>{t.user_prompt}</span>
                            <div className="ais-task-actions">
                                <button type="button" className="ais-icon-btn" title="Preview JSON" onClick={() => setShowJson(t)}>
                                    <i className="fa-solid fa-code" aria-hidden="true" />
                                </button>
                                <button type="button" className="ais-icon-btn" title="Edit task" onClick={() => openEdit(t)}>
                                    <i className="fa-regular fa-pen-to-square" aria-hidden="true" />
                                </button>
                                <button type="button" className="ais-icon-btn danger" title="Delete task" onClick={() => remove(t)}>
                                    <i className="fa-regular fa-trash-can" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Add / Edit Task modal ─────────────────────────────── */}
            {showForm && (
                <div className="ai-modal-overlay">
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
                            {/* Agent (read-only context) */}
                            <div className="mb-3">
                                <label className="ai-label">Agent</label>
                                <input
                                    className="form-control"
                                    value={agentName ? `${agentName} (${agentKey})` : agentKey}
                                    disabled
                                />
                            </div>
                            {/* Task Name */}
                            <div className="mb-3">
                                <label className="ai-label">
                                    Task Name <span className="text-danger">*</span>
                                    <span className="ai-tooltip ms-1" title="Human-readable name for this task.">
                                        <i className="fa-solid fa-circle-info" />
                                    </span>
                                </label>
                                <input
                                    className={`form-control ${errors.task_name ? "is-invalid" : ""}`}
                                    name="task_name" value={form.task_name} onChange={handleInput}
                                    placeholder="e.g. Classify Intent"
                                />
                                {errors.task_name && <div className="invalid-feedback">{errors.task_name}</div>}
                            </div>
                            {/* Task Key */}
                            <div className="mb-3">
                                <label className="ai-label">
                                    Task Key <span className="text-danger">*</span>
                                    <span className="ai-tooltip ms-1" title="Unique identifier used by webhook integrations to select this task (e.g. classify-intent).">
                                        <i className="fa-solid fa-circle-info" />
                                    </span>
                                </label>
                                <input
                                    className={`form-control ${errors.task_key ? "is-invalid" : ""}`}
                                    name="task_key" value={form.task_key} onChange={handleInput}
                                    placeholder="e.g. classify-intent"
                                />
                                {errors.task_key && <div className="invalid-feedback">{errors.task_key}</div>}
                            </div>
                            {/* User Prompt */}
                            <div className="mb-3">
                                <label className="ai-label">
                                    User Prompt <span className="text-danger">*</span>
                                    <span className="ai-tooltip ms-1" title="Prompt template appended after the system prompt. Use {{variables}} for webhook-injected values.">
                                        <i className="fa-solid fa-circle-info" />
                                    </span>
                                </label>
                                <textarea
                                    className={`form-control ${errors.user_prompt ? "is-invalid" : ""}`}
                                    name="user_prompt" value={form.user_prompt} onChange={handleInput}
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
                                <textarea
                                    className="ai-sql-editor w-100"
                                    name="sql_query" value={form.sql_query} onChange={handleInput}
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
                                    <label className="ai-label">Collection<span className="ai-tooltip ms-1" title="Vector store collection"><i className="fa-solid fa-circle-info" /></span></label>
                                    <input className="form-control" name="collection" value={vq.collection} onChange={handleVqInput} placeholder="e.g. product_docs" />
                                </div>
                                <div>
                                    <label className="ai-label">Search Text<span className="ai-tooltip ms-1" title="Search text or template variable"><i className="fa-solid fa-circle-info" /></span></label>
                                    <input className="form-control" name="search_text" value={vq.search_text} onChange={handleVqInput} placeholder="{{userMessage}}" />
                                </div>
                                <div>
                                    <label className="ai-label">Top K<span className="ai-tooltip ms-1" title="Number of results to retrieve"><i className="fa-solid fa-circle-info" /></span></label>
                                    <input className="form-control" name="top_k" type="number" min={1} max={50} value={vq.top_k} onChange={handleVqInput} />
                                </div>
                            </div>
                        </div>
                        <div className="ai-modal-footer">
                            <button className="btn btn-outline-secondary btn-sm"
                                onClick={() => exportJson({ ...form, vector_query: JSON.stringify(vq) })}>
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

            {/* ── JSON Preview modal ────────────────────────────────── */}
            {showJson && (
                <div className="ai-modal-overlay" onClick={e => e.target === e.currentTarget && setShowJson(null)}>
                    <div className="ai-modal ai-modal-lg">
                        <div className="ai-modal-header">
                            <h5><i className="fa-solid fa-code me-2" />Task API Request — {showJson.task_key}</h5>
                            <button className="ai-modal-close" onClick={() => setShowJson(null)}>
                                <i className="fa-solid fa-xmark" />
                            </button>
                        </div>
                        <div className="ai-modal-body">
                            <pre className="ai-json-preview">{JSON.stringify(formatTaskRequest(showJson, agentKey), null, 2)}</pre>
                        </div>
                        <div className="ai-modal-footer">
                            <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => copyJson(showJson)}>
                                <i className="fa-regular fa-copy me-1" aria-hidden="true" /> Copy JSON
                            </button>
                            <button className="btn btn-outline-secondary btn-sm" onClick={() => exportJson(showJson)}>
                                <i className="fa-solid fa-download me-1" /> Download JSON
                            </button>
                            <button className="btn btn-secondary btn-sm ms-auto" onClick={() => setShowJson(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default AiTasks;
