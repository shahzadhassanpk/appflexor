/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { API_URL } from "../../../Config";
import { getData, handleSave, handleDelete } from "../../../components/CrudApiCall";
import { toastEmitter } from "../../../components/Toastify/Toastify";
import AiTasks from "../tasks/AiTasks";

/* ── colour palette ─────────────────────────────────────────────────────── */
const PALETTE = [
    "#4f46e5", "#16a34a", "#9333ea", "#ea580c",
    "#0891b2", "#d97706", "#dc2626", "#7c3aed",
    "#0f766e", "#be185d",
];
const getColor = i => PALETTE[i % PALETTE.length];

/* ── initial states ─────────────────────────────────────────────────────── */
const EMPTY_VQ = { collection: "", search_text: "", top_k: 5 };
const EMPTY = {
    id: "new",
    agent_name: "",
    agent_key: "",
    system_prompt: "",
    provider: "",
    category: "",
    default_vector_query: JSON.stringify(EMPTY_VQ),
};
const EMPTY_AGENT_TEST = {
    agent: null,
    businessKey: "",
    taskKey: "",
    message: "",
    response: null,
    error: "",
};
const AI_AGENT_WEBHOOK_URL = "/webhook/ai-agent";

function parseVQ(raw) {
    try { return JSON.parse(raw) || EMPTY_VQ; } catch { return { ...EMPTY_VQ }; }
}

/* ════════════════════════════════════════════════════════════════════════ */
/**
 * Props:
 *   agents          – array from parent
 *   providers       – array from parent (for tags + form dropdown)
 *   categories      – array from parent (for tags + form dropdown)
 *   onAgentsChanged – callback after save/delete to reload parent data
 */
function AiAgents({ agents = [], providers = [], categories = [], onAgentsChanged }) {
    const [expandedAgents, setExpandedAgents] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState("");
    const [taskCounts, setTaskCounts] = useState({});

    /* form */
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [vq, setVq] = useState(EMPTY_VQ);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [showJson, setShowJson] = useState(null);
    const [testAgent, setTestAgent] = useState(EMPTY_AGENT_TEST);
    const [testTasks, setTestTasks] = useState([]);
    const [testLoadingTasks, setTestLoadingTasks] = useState(false);
    const [testingAgent, setTestingAgent] = useState(false);
    const [testErrors, setTestErrors] = useState({});

    /* ── filtered agents ────────────────────────────────────────────────── */
    const q = searchTerm.toLowerCase().trim();
    const filtered = q
        ? agents.filter(a =>
            a.agent_name?.toLowerCase().includes(q) ||
            a.agent_key?.toLowerCase().includes(q) ||
            providers.find(p => p.id === a.provider)?.provider_name?.toLowerCase().includes(q))
        : agents;

    useEffect(() => {
        if (agents.length === 0) {
            setTaskCounts({});
            return;
        }

        const keys = agents.map((agent, index) => ({
            params: agent.id,
            dataKey: `agentTasks${index}`,
            serviceKey: "ai.task.by.agent",
            mode: "formData",
        }));

        getData({ keys })
            .then(res => {
                const data = res?.data?.C_DATA || {};
                setTaskCounts(Object.fromEntries(
                    agents.map((agent, index) => [agent.id, (data[`agentTasks${index}`] || []).length])
                ));
            })
            .catch(console.error);
    }, [agents]);

    /* ── collapse / expand ──────────────────────────────────────────────── */
    function toggleExpand(agentId) {
        setExpandedAgents(prev => {
            const n = new Set(prev);
            n.has(agentId) ? n.delete(agentId) : n.add(agentId);
            return n;
        });
    }

    /* ── lookup helpers ─────────────────────────────────────────────────── */
    function getCategoryForAgent(a) {
        return categories.find(c => c.id === a.category) || null;
    }
    function getProviderForAgent(a) {
        return providers.find(p => p.id === a.provider) || null;
    }

    /* ── form open ──────────────────────────────────────────────────────── */
    function openAdd() {
        setForm({ ...EMPTY });
        setVq({ ...EMPTY_VQ });
        setErrors({});
        setShowForm(true);
    }
    function openEdit(a) {
        setForm({ ...a, provider: a.provider || "", category: a.category || "" });
        setVq(parseVQ(a.default_vector_query));
        setErrors({});
        setShowForm(true);
    }

    function openAgentTest(a) {
        setTestAgent({
            ...EMPTY_AGENT_TEST,
            agent: a,
        });
        setTestTasks([]);
        setTestErrors({});
        setTestLoadingTasks(true);

        getData({
            keys: [{ params: a.id, dataKey: "tasks", serviceKey: "ai.task.by.agent", mode: "formData" }],
        }).then(res => {
            const tasks = res?.data?.C_DATA?.tasks || [];
            setTestTasks(tasks);
        }).catch(error => {
            console.error(error);
            setTestAgent(prev => ({
                ...prev,
                error: "Could not load tasks for this agent.",
            }));
        }).finally(() => setTestLoadingTasks(false));
    }

    function closeAgentTest() {
        if (testingAgent) return;
        setTestAgent(EMPTY_AGENT_TEST);
        setTestTasks([]);
        setTestErrors({});
    }

    /* ── field handlers ─────────────────────────────────────────────────── */
    function handleInput(e) {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    }
    function handleVqInput(e) {
        const { name, value } = e.target;
        setVq(prev => ({ ...prev, [name]: name === "top_k" ? Number(value) : value }));
    }

    /* ── validate + save ────────────────────────────────────────────────── */
    function validate() {
        const errs = {};
        if (!form.agent_name?.trim()) errs.agent_name = "Agent name is required";
        if (!form.agent_key?.trim()) errs.agent_key = "Agent key is required";
        if (!form.system_prompt?.trim()) errs.system_prompt = "System prompt is required";
        if (!form.provider?.trim()) errs.provider = "AI provider is required";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    function save() {
        if (!validate()) return;
        setSaving(true);
        const agentForm = { ...form };
        delete agentForm.ai_provider;
        handleSave({ entity: "ai_agent", formData: { ...agentForm, default_vector_query: JSON.stringify(vq) } })
            .then(res => {
                if (res?.data?.C_STATUS === "SUCCESS") {
                    toastEmitter(form.id === "new" ? "Agent created" : "Agent updated", true);
                    setShowForm(false);
                    if (onAgentsChanged) onAgentsChanged();
                } else {
                    toastEmitter(res?.data?.C_MESSAGE || "Save failed", true, "warning");
                }
            })
            .finally(() => setSaving(false));
    }

    function remove(a) {
        if (!window.confirm(`Delete agent "${a.agent_key}"? All associated tasks will also be removed.`)) return;
        handleDelete({ entity: "ai_agent", url: API_URL + "?service.key=update.formData", arr: [a.id] })
            .then(res => {
                if (res?.data?.C_STATUS === "SUCCESS") {
                    toastEmitter("Agent deleted", true);
                    if (onAgentsChanged) onAgentsChanged();
                } else {
                    toastEmitter(res?.data?.C_MESSAGE || "Delete failed", true, "warning");
                }
            });
    }

    function exportJson(a) {
        const blob = new Blob([JSON.stringify(a, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${a.agent_key}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    function buildAgentTestRequest() {
        return {
            agentKey: testAgent.agent?.agent_key || "",
            taskKey: testAgent.taskKey,
            payload: {
                businessKey: testAgent.businessKey,
                message: testAgent.message,
            },
        };
    }

    function formatAgentTestTranscript() {
        if (!testAgent.message && !testAgent.response && !testAgent.error) return "";
        const responseText = typeof testAgent.response === "string"
            ? testAgent.response
            : JSON.stringify(testAgent.response, null, 2);

        return [
            testAgent.message ? `User Prompt:\n${testAgent.message}` : "",
            testAgent.response ? `Agent Response:\n${responseText}` : "",
            testAgent.error ? `Error:\n${testAgent.error}` : "",
        ].filter(Boolean).join("\n\n");
    }

    function validateAgentTest() {
        const errs = {};
        if (!testAgent.taskKey) errs.taskKey = "Task is required";
        if (!testAgent.message?.trim()) errs.message = "User prompt is required";
        setTestErrors(errs);
        return Object.keys(errs).length === 0;
    }

    async function submitAgentTest() {
        if (!validateAgentTest()) return;

        const request = buildAgentTestRequest();
        setTestingAgent(true);
        setTestAgent(prev => ({ ...prev, response: null, error: "" }));

        try {
            const response = await fetch(AI_AGENT_WEBHOOK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(request),
            });
            const contentType = response.headers.get("content-type") || "";
            const responseBody = contentType.includes("application/json")
                ? await response.json()
                : await response.text();

            if (!response.ok) {
                throw new Error(
                    typeof responseBody === "string"
                        ? responseBody
                        : JSON.stringify(responseBody, null, 2),
                );
            }

            setTestAgent(prev => ({ ...prev, response: responseBody, error: "" }));
            toastEmitter("Agent test completed", true);
        } catch (error) {
            setTestAgent(prev => ({
                ...prev,
                error: error?.message || "Agent test failed.",
            }));
            toastEmitter("Agent test failed", true, "warning");
        } finally {
            setTestingAgent(false);
        }
    }

    function exportAgentTestChat() {
        const payload = {
            request: buildAgentTestRequest(),
            response: testAgent.response,
            error: testAgent.error,
            exportedAt: new Date().toISOString(),
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${testAgent.agent?.agent_key || "ai-agent"}-test-chat.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    /* ── render ─────────────────────────────────────────────────────────── */
    return (
        <div className="ais-panel">

            {/* panel header */}
            <div className="ais-panel-header">
                <div className="d-flex align-items-start gap-2 flex-1 min-w-0">
                    <span className="ais-panel-icon">
                        <i className="fa-solid fa-robot" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                        <div className="ais-panel-title">AI Agents</div>
                        <div className="ais-panel-desc">Agents with their task definitions, expand to view tasks inline</div>
                    </div>
                </div>
                <button type="button" className="ais-add-btn" onClick={openAdd}>
                    <i className="fa-solid fa-plus" aria-hidden="true" /> Add Agent
                </button>
                <div className="ais-search">
                    <i className="fa-solid fa-magnifying-glass ais-search-icon" aria-hidden="true" />
                    <input
                        type="text"
                        className="ais-search-input"
                        placeholder="Search agents…"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        aria-label="Search agents"
                    />
                    {searchTerm && (
                        <button type="button" className="ais-search-clear" onClick={() => setSearchTerm("")} aria-label="Clear">
                            <i className="fa-solid fa-xmark" aria-hidden="true" />
                        </button>
                    )}
                </div>
            </div>

            {/* accordion */}
            <div className="ais-accordion">

                {agents.length === 0 && (
                    <div className="ais-empty-state">
                        <i className="fa-solid fa-robot" aria-hidden="true" />
                        <p>No agents configured yet</p>
                        <button type="button" className="ais-add-btn" onClick={openAdd}>
                            <i className="fa-solid fa-plus" /> Add Agent
                        </button>
                    </div>
                )}

                {filtered.map((a, idx) => {
                    const cat = getCategoryForAgent(a);
                    const prov = getProviderForAgent(a);
                    const color = getColor(idx);
                    const catIdx = cat ? categories.indexOf(cat) : -1;
                    const provIdx = prov ? providers.indexOf(prov) : -1;
                    const catColor = catIdx >= 0 ? getColor(catIdx + 2) : "#6b7280";
                    const provColor = provIdx >= 0 ? getColor(provIdx) : "#6b7280";
                    const expanded = expandedAgents.has(a.id);

                    return (
                        <div key={a.id} className="ais-agent-group">

                            {/* agent header row */}
                            <div className="ais-agent-header">
                                <div className="ais-agent-header-content d-flex align-items-center gap-2 flex-1 min-w-0">
                                    <button
                                        type="button"
                                        className="ais-chevron"
                                        onClick={() => toggleExpand(a.id)}
                                        aria-label={expanded ? "Collapse tasks" : "Expand tasks"}>
                                        <i className={`fa-solid ${expanded ? "fa-chevron-down" : "fa-chevron-right"}`} aria-hidden="true" />
                                    </button>
                                    <span className="ais-agent-icon" style={{ background: `${color}22`, color }}>
                                        <i className="fa-solid fa-robot" aria-hidden="true" />
                                    </span>
                                    <span className="ais-agent-name">{a.agent_name}</span>

                                    <code className="ais-key-badge">{a.agent_key}</code>

                                    {prov && (
                                        <span className="ais-tag" style={{ background: `${provColor}18`, color: provColor, border: `1px solid ${provColor}30` }}>
                                            <i className="fa-solid fa-brain me-1" style={{ fontSize: "0.6rem" }} aria-hidden="true" />
                                            {prov.provider_name} ({prov.model})
                                        </span>
                                    )}
                                    {cat && (
                                        <span className="ais-tag" style={{ background: `${catColor}18`, color: catColor, border: `1px solid ${catColor}30` }}>
                                            <i className="fa-solid fa-tag me-1" style={{ fontSize: "0.6rem" }} aria-hidden="true" />
                                            {cat.title}
                                        </span>
                                    )}
                                    <div className="ais-agent-actions ms-auto">
                                        {/* <button type="button" className="ais-icon-btn" title="Preview JSON definition" onClick={() => setShowJson(a)}>
                                            <i className="fa-solid fa-code" aria-hidden="true" />
                                        </button> */}
                                        <button type="button" className="ais-icon-btn" title="Test agent" onClick={() => openAgentTest(a)}>
                                            <i className="fa-solid fa-vial" aria-hidden="true" />
                                        </button>
                                        <button type="button" className="ais-icon-btn" title="Edit agent" onClick={() => openEdit(a)}>
                                            <i className="fa-regular fa-pen-to-square" aria-hidden="true" />
                                        </button>
                                        <button type="button" className="ais-icon-btn danger" title="Delete agent" onClick={() => remove(a)}>
                                            <i className="fa-regular fa-trash-can" aria-hidden="true" />
                                        </button>
                                    </div>
                                    <span className="ais-count-badge" title={`${taskCounts[a.id] ?? 0} tasks`} style={{ background: `${color}22`, color }}>
                                        <i className="fa-solid fa-list-check me-1" aria-hidden="true" />
                                        Tasks  {taskCounts[a.id] ?? 0}
                                        <span className="visually-hidden"> tasks</span>
                                    </span>
                                </div>
                                <div className="ais-agent-prompt-container p-2">
                                    <span className="ais-system-prompt">{a.system_prompt}</span>
                                </div>
                            </div>



                            {/* tasks panel — conditionally mounted so it fetches fresh on each open */}
                            {expanded && (
                                <div className="ais-tasks-panel">
                                    <AiTasks
                                        agentId={a.id}
                                        agentKey={a.agent_key}
                                        agentName={a.agent_name}
                                        onTaskCountChanged={count => setTaskCounts(prev => ({ ...prev, [a.id]: count }))}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}

                {filtered.length === 0 && agents.length > 0 && (
                    <div className="ais-tree-empty">No agents match your search</div>
                )}
            </div>

            {/* ── Add / Edit Agent modal ──────────────────────────────── */}
            {showForm && (
                <div className="ai-modal-overlay">
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
                            {/* Name */}
                            <div className="mb-3">
                                <label className="ai-label">
                                    Name <span className="text-danger">*</span>
                                    <span className="ai-tooltip ms-1" title="Human-readable display name (e.g. Customer Support, Invoice Classifier).">
                                        <i className="fa-solid fa-circle-info" />
                                    </span>
                                </label>
                                <input
                                    className={`form-control ${errors.agent_name ? "is-invalid" : ""}`}
                                    name="agent_name" value={form.agent_name} onChange={handleInput}
                                    placeholder="e.g. Customer Support"
                                />
                                {errors.agent_name && <div className="invalid-feedback">{errors.agent_name}</div>}
                            </div>
                            {/* Agent Key */}
                            <div className="mb-3">
                                <label className="ai-label">
                                    Agent Key <span className="text-danger">*</span>
                                    <span className="ai-tooltip ms-1" title="Unique identifier used by webhook integrations to look up this agent (e.g. customer-support).">
                                        <i className="fa-solid fa-circle-info" />
                                    </span>
                                </label>
                                <input
                                    className={`form-control ${errors.agent_key ? "is-invalid" : ""}`}
                                    name="agent_key" value={form.agent_key} onChange={handleInput}
                                    placeholder="e.g. customer-support"
                                />
                                {errors.agent_key && <div className="invalid-feedback">{errors.agent_key}</div>}
                            </div>
                            {/* Provider + Category */}
                            <div className="row">
                                <div className="col-sm-6 mb-3">
                                    <label className="ai-label">
                                        AI Provider <span className="text-danger">*</span>
                                        <span className="ai-tooltip ms-1" title="The LLM provider this agent uses.">
                                            <i className="fa-solid fa-circle-info" />
                                        </span>
                                    </label>
                                    <select
                                        className={`form-control form-select ${errors.provider ? "is-invalid" : ""}`}
                                        name="provider" value={form.provider} onChange={handleInput}>
                                        <option value="">— Select provider —</option>
                                        {providers.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.provider_name} ({p.model})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.provider && <div className="invalid-feedback">{errors.provider}</div>}
                                </div>
                                <div className="col-sm-6 mb-3">
                                    <label className="ai-label">
                                        Category
                                        <span className="ai-tooltip ms-1" title="Logical group for organising this agent. Matched by category ID.">
                                            <i className="fa-solid fa-circle-info" />
                                        </span>
                                    </label>
                                    <select
                                        className="form-control form-select"
                                        name="category" value={form.category} onChange={handleInput}>
                                        <option value="">— None —</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            {/* System Prompt */}
                            <div className="mb-3">
                                <label className="ai-label">
                                    System Prompt <span className="text-danger">*</span>
                                    <span className="ai-tooltip ms-1" title="Base instruction for every request. Defines persona, scope, and behaviour.">
                                        <i className="fa-solid fa-circle-info" />
                                    </span>
                                </label>
                                <textarea
                                    className={`form-control ${errors.system_prompt ? "is-invalid" : ""}`}
                                    name="system_prompt" value={form.system_prompt} onChange={handleInput}
                                    rows={5}
                                    placeholder="You are a helpful assistant that…"
                                />
                                {errors.system_prompt && <div className="invalid-feedback">{errors.system_prompt}</div>}
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
                                        <span className="ai-tooltip ms-1" title="Vector store collection / index name"><i className="fa-solid fa-circle-info" /></span>
                                    </label>
                                    <input className="form-control" name="collection" value={vq.collection} onChange={handleVqInput} placeholder="e.g. knowledge_base" />
                                </div>
                                <div>
                                    <label className="ai-label">
                                        Search Text
                                        <span className="ai-tooltip ms-1" title="Default search text or template variable (e.g. {{userMessage}})"><i className="fa-solid fa-circle-info" /></span>
                                    </label>
                                    <input className="form-control" name="search_text" value={vq.search_text} onChange={handleVqInput} placeholder="{{userMessage}}" />
                                </div>
                                <div>
                                    <label className="ai-label">
                                        Top K
                                        <span className="ai-tooltip ms-1" title="Number of top results to retrieve"><i className="fa-solid fa-circle-info" /></span>
                                    </label>
                                    <input className="form-control" name="top_k" type="number" min={1} max={50} value={vq.top_k} onChange={handleVqInput} />
                                </div>
                            </div>
                        </div>
                        <div className="ai-modal-footer">
                            <button className="btn btn-outline-secondary btn-sm"
                                onClick={() => exportJson({ ...form, default_vector_query: JSON.stringify(vq) })}>
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

            {/* ── JSON Preview modal ──────────────────────────────────── */}
            {showJson && (
                <div className="ai-modal-overlay" onClick={e => e.target === e.currentTarget && setShowJson(null)}>
                    <div className="ai-modal ai-modal-lg">
                        <div className="ai-modal-header">
                            <h5><i className="fa-solid fa-code me-2" />Agent Definition — {showJson.agent_key}</h5>
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

            {testAgent.agent && (
                <div className="ai-modal-overlay" onClick={e => e.target === e.currentTarget && closeAgentTest()}>
                    <div className="ai-modal ai-modal-xl">
                        <div className="ai-modal-header">
                            <h5>
                                <i className="fa-solid fa-vial me-2" />
                                Test AI Agent
                            </h5>
                            <button className="ai-modal-close" onClick={closeAgentTest} disabled={testingAgent}>
                                <i className="fa-solid fa-xmark" />
                            </button>
                        </div>
                        <div className="ai-modal-body">
                            <div className="ai-agent-test-grid">
                                <div>
                                    <div className="mb-3">
                                        <label className="ai-label">Agent Name</label>
                                        <input
                                            className="form-control"
                                            value={`${testAgent.agent.agent_name || testAgent.agent.agent_key} (${testAgent.agent.agent_key})`}
                                            disabled
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="ai-label">
                                            Task <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            className={`form-control form-select ${testErrors.taskKey ? "is-invalid" : ""}`}
                                            value={testAgent.taskKey}
                                            onChange={e => {
                                                setTestAgent(prev => ({ ...prev, taskKey: e.target.value }));
                                                if (testErrors.taskKey) setTestErrors(prev => ({ ...prev, taskKey: "" }));
                                            }}
                                            disabled={testLoadingTasks}>
                                            <option value="">
                                                {testLoadingTasks ? "Loading tasks..." : "Select task"}
                                            </option>
                                            {testTasks.map(task => (
                                                <option key={task.id || task.task_key} value={task.task_key}>
                                                    {task.task_name || task.task_key}
                                                </option>
                                            ))}
                                        </select>
                                        {testErrors.taskKey && <div className="invalid-feedback">{testErrors.taskKey}</div>}
                                        {!testLoadingTasks && testTasks.length === 0 && (
                                            <small className="text-muted">No tasks are configured for this agent.</small>
                                        )}
                                    </div>
                                    <div className="mb-3">
                                        <label className="ai-label">Business Key</label>
                                        <input
                                            className="form-control"
                                            value={testAgent.businessKey}
                                            onChange={e => setTestAgent(prev => ({ ...prev, businessKey: e.target.value }))}
                                            placeholder="Optional business key"
                                        />
                                    </div>
                                    
                                    <div className="mb-3">
                                        <label className="ai-label">
                                            User Prompt <span className="text-danger">*</span>
                                        </label>
                                        <textarea
                                            className={`form-control ${testErrors.message ? "is-invalid" : ""}`}
                                            rows={3}
                                            value={testAgent.message}
                                            onChange={e => {
                                                setTestAgent(prev => ({ ...prev, message: e.target.value }));
                                                if (testErrors.message) setTestErrors(prev => ({ ...prev, message: "" }));
                                            }}
                                            placeholder="Enter prompt to send to this agent"
                                        />
                                        {testErrors.message && <div className="invalid-feedback">{testErrors.message}</div>}
                                    </div>
                                </div>
                                <div>
                                    <div className="mb-3">
                                        <label className="ai-label">Prompt and Response</label>
                                        <textarea
                                            className="form-control ai-agent-test-output"
                                            value={formatAgentTestTranscript()}
                                            readOnly
                                            placeholder="Run the test to see the user prompt and agent response."
                                        />
                                    </div>
                                    {/* <div className="ai-section-divider">Request Preview</div>
                                    <pre className="ai-json-preview ai-agent-test-preview">{JSON.stringify(buildAgentTestRequest(), null, 2)}</pre> */}
                                </div>
                            </div>
                        </div>
                        <div className="ai-modal-footer">
                            <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={exportAgentTestChat}
                                disabled={!testAgent.message && !testAgent.response && !testAgent.error}>
                                <i className="fa-solid fa-download me-1" /> Export Chat JSON
                            </button>
                            <button className="btn btn-secondary btn-sm ms-auto" onClick={closeAgentTest} disabled={testingAgent}>
                                Close
                            </button>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={submitAgentTest}
                                disabled={testingAgent || testLoadingTasks || testTasks.length === 0}>
                                {testingAgent
                                    ? <><i className="fa-solid fa-spinner fa-spin me-1" />Testing...</>
                                    : <><i className="fa-solid fa-paper-plane me-1" />Send Test</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AiAgents;
