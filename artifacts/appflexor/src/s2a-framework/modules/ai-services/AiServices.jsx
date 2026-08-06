import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../Config";
import { ErrorBoundary } from "../../utils/ErrorBoundry";
import Loading from "../../components/Loading/loading";
import { getData, handleSave, handleDelete } from "../../components/CrudApiCall";
import { toastEmitter } from "../../components/Toastify/Toastify";
import AiAgents from "./agents/AiAgents";
import "./ai-services.css";

/* ── colour palette ─────────────────────────────────────────────────────── */
const PALETTE = [
    "#4f46e5", "#16a34a", "#9333ea", "#ea580c",
    "#0891b2", "#d97706", "#dc2626", "#7c3aed",
    "#0f766e", "#be185d",
];
const getColor = i => PALETTE[i % PALETTE.length];

/* ── pre-defined providers ──────────────────────────────────────────────── */
const PROVIDERS = [
    { name: "AppFlexor AI", key: "appflexor", api_url: "" },
    // { name: "Open AI", key: "openai", api_url: "https://api.openai.com/v1/chat/completions" },
    // { name: "Ollama", key: "ollama", api_url: "" },
    // { name: "Anthropic",                key: "anthropic",   api_url: "https://api.anthropic.com/v1/messages" },
    // { name: "Google AI Studio (Gemini)",key: "googleai",    api_url: "https://generativelanguage.googleapis.com/v1beta/models" },
    // { name: "Groq",                     key: "groq",        api_url: "https://api.groq.com/openai/v1/chat/completions" },
    // { name: "OpenRouter",               key: "openrouter",  api_url: "https://openrouter.ai/api/v1/chat/completions" },
    // { name: "Mistral",                  key: "mistral",     api_url: "https://api.mistral.ai/v1/chat/completions" },
    // { name: "Cerebras",                 key: "cerebras",    api_url: "https://inference.cerebras.ai/v1/chat/completions" },
    // { name: "Together AI",              key: "togetherai",  api_url: "https://api.together.xyz/v1/chat/completions" },
    // { name: "Fireworks AI",             key: "fireworksai", api_url: "https://api.fireworks.ai/inference/v1/chat/completions" },
    // { name: "Hugging Face",             key: "huggingface", api_url: "https://api-inference.huggingface.co/models" },
];

/* ── provider → icon mapping ────────────────────────────────────────────── */
const PROVIDER_ICONS = {
    openai: "fa-brain",
    anthropic: "fa-robot",
    googleai: "fa-circle-nodes",
    groq: "fa-bolt",
    openrouter: "fa-route",
    mistral: "fa-wind",
    cerebras: "fa-microchip",
    togetherai: "fa-layer-group",
    fireworksai: "fa-fire",
    huggingface: "fa-cube",
    ollama: "fa-server",
};
const providerIcon = (key = "") =>
    PROVIDER_ICONS[(key || "").toLowerCase()] || "fa-brain";

/* ── initial form states ────────────────────────────────────────────────── */
const PROV_INIT = { id: "new", provider_name: "", provider_key: "", api_key: "", api_url: "", model: "" };
const CAT_INIT = { id: "new", title: "", key: "" };

/* ════════════════════════════════════════════════════════════════════════ */
function AiServices() {
    const [providers, setProviders] = useState([]);
    const [agents, setAgents] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [schemaReady, setSchemaReady] = useState(false);

    /* ── Provider CRUD state ──────────────────────────────────────────── */
    const [provModal, setProvModal] = useState(false);
    const [selectedProv, setSelectedProv] = useState(PROV_INIT);
    const [provErrors, setProvErrors] = useState({});
    const [provSaving, setProvSaving] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [modelOptions, setModelOptions] = useState([]);
    const [modelFetching, setModelFetching] = useState(false);
    const [modelError, setModelError] = useState("");

    /* ── Category CRUD state ──────────────────────────────────────────── */
    const [catModal, setCatModal] = useState(false);
    const [selectedCat, setSelectedCat] = useState(CAT_INIT);
    const [catErrors, setCatErrors] = useState({});
    const [catSaving, setCatSaving] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
        // Initialise DB tables for all four entities before loading any data
        Promise.all(
            ["ai_provider", "ai_agent", "ai_agent_task", "ai_agent_category"].map(entity =>
                axios.post(API_URL + "?service.key=validate.schema", {
                    saveOrUpdate: "Yes",
                    datasource: "",
                    data: [{
                        formId: entity, entity, action: "update",
                        formData: { id: "new" }, mode: "formData", id: "new"
                    }],
                }).catch(err => console.warn("validate.schema [" + entity + "]:", err))
            )
        ).finally(() => { setSchemaReady(true); loadAll(); });
    }, []);

    /* ── batch-load all data ────────────────────────────────────────────── */
    function loadAll() {
        setIsLoading(true);
        getData({
            keys: [
                { params: "", dataKey: "providers", serviceKey: "ai.provider.list", mode: "formData" },
                { params: "", dataKey: "agents", serviceKey: "ai.agent.list", mode: "formData" },
                { params: "", dataKey: "categories", serviceKey: "ai.agent.categories", mode: "formData" },
            ],
        })
            .then(res => {
                const d = res?.data?.C_DATA || {};
                setProviders(d.providers || []);
                setAgents(d.agents || []);
                setCategories(d.categories || []);
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }

    /* ── counts (client-side) ───────────────────────────────────────────── */
    const agentCountForProvider = p => agents.filter(a => a.provider === p.id).length;
    const agentCountForCategory = c => agents.filter(a => a.category === c.id).length;

    /* ── Provider CRUD ──────────────────────────────────────────────────── */
    function resetModelState() { setModelOptions([]); setModelError(""); setModelFetching(false); }

    function openAddProv() {
        setSelectedProv({ ...PROV_INIT });
        setProvErrors({});
        setShowApiKey(false);
        resetModelState();
        setProvModal(true);
    }
    function openEditProv(p) {
        const provDef = PROVIDERS.find(pd => pd.key === p.provider_key);
        setSelectedProv({ ...p, api_url: p.api_url || provDef?.api_url || "" });
        setProvErrors({});
        setShowApiKey(false);
        resetModelState();
        setProvModal(true);
    }

    function handleProviderSelect(e) {
        const provDef = PROVIDERS.find(pd => pd.key === e.target.value);
        setSelectedProv(prev => ({
            ...prev,
            provider_name: provDef?.name || "",
            provider_key: provDef?.key || "",
            api_url: provDef?.api_url || "",
            model: "",
        }));
        resetModelState();
        if (provErrors.provider_key) setProvErrors(prev => ({ ...prev, provider_key: "" }));
    }

    async function fetchModels(providerKey, apiKey) {
        if (!providerKey) return;
        setModelFetching(true);
        setModelError("");
        if (providerKey === "appflexor") {
            setModelOptions([
                { name: "Lite", id: "lite" },
                { name: "Economy", id: "economy" },
                { name: "Power", id: "power" },
            ]);
            setModelFetching(false);
            return;
        }
        setModelOptions([]);
        let models = [];
        let fallbackMsg = "";
        try {
            const bearer = { Authorization: `Bearer ${apiKey}` };
            switch (providerKey) {
                case "openai": {
                    const r = await fetch("https://api.openai.com/v1/models", { headers: bearer });
                    const d = await r.json();
                    models = (d.data || []).map(m => m.id)
                        .filter(id => /^(gpt|o1|o3|o4)/.test(id))
                        .sort();
                    break;
                }
                case "groq": {
                    const r = await fetch("https://api.groq.com/openai/v1/models", { headers: bearer });
                    const d = await r.json();
                    models = (d.data || []).map(m => m.id).sort();
                    break;
                }
                case "openrouter": {
                    const r = await fetch("https://openrouter.ai/api/v1/models", { headers: bearer });
                    const d = await r.json();
                    models = (d.data || []).map(m => m.id).sort();
                    break;
                }
                case "mistral": {
                    const r = await fetch("https://api.mistral.ai/v1/models", { headers: bearer });
                    const d = await r.json();
                    models = (d.data || []).map(m => m.id).sort();
                    break;
                }
                case "cerebras": {
                    const r = await fetch("https://inference.cerebras.ai/v1/models", { headers: bearer });
                    const d = await r.json();
                    models = (d.data || []).map(m => m.id).sort();
                    break;
                }
                case "togetherai": {
                    const r = await fetch("https://api.together.xyz/v1/models", { headers: bearer });
                    const d = await r.json();
                    models = (Array.isArray(d) ? d : (d.data || []))
                        .map(m => m.id || m.name).sort();
                    break;
                }
                case "fireworksai": {
                    const r = await fetch("https://api.fireworks.ai/inference/v1/models", { headers: bearer });
                    const d = await r.json();
                    models = (d.data || []).map(m => m.id).sort();
                    break;
                }
                case "googleai": {
                    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
                    const d = await r.json();
                    models = (d.models || [])
                        .map(m => m.name.replace("models/", ""))
                        .filter(n => n.toLowerCase().includes("gemini"))
                        .sort();
                    break;
                }
                case "anthropic": {
                    models = [
                        "claude-opus-4-5",
                        "claude-sonnet-4-5",
                        "claude-3-5-sonnet-20241022",
                        "claude-3-5-haiku-20241022",
                        "claude-3-opus-20240229",
                        "claude-3-sonnet-20240229",
                        "claude-3-haiku-20240307",
                    ];
                    break;
                }
                case "ollama": {
                    const r = await fetch(selectedProv.api_url + "/tags", { headers: bearer });
                    const d = await r.json();
                    models = (d.models || []).map(m => m.name).sort();
                    break;
                }
                case "huggingface": {
                    fallbackMsg = "Enter the model ID manually (e.g. mistralai/Mistral-7B-v0.1).";
                    break;
                }
                default:
                    fallbackMsg = "Model list not available for this provider. Enter the model name manually.";
            }
            if (models.length > 0) {
                setModelOptions(models);
            } else if (!fallbackMsg) {
                fallbackMsg = "No models returned. Check your API key or enter the model name manually.";
            }
        } catch {
            fallbackMsg = "Could not fetch models — check your API key and try again, or enter the model name manually.";
        } finally {
            if (fallbackMsg) setModelError(fallbackMsg);
            setModelFetching(false);
        }
    }

    function validateProv() {
        const errs = {};
        if (!selectedProv.provider_key?.trim()) errs.provider_key = "Please select a provider";
        if (selectedProv.provider_key !== 'appflexor' && !selectedProv.api_key?.trim()) errs.api_key = "API key is required";
        setProvErrors(errs);
        return Object.keys(errs).length === 0;
    }

    function saveProv() {
        debugger;
        if (!validateProv()) return;
        setProvSaving(true);
        handleSave({ entity: "ai_provider", formData: selectedProv })
            .then(res => {
                if (res?.data?.C_STATUS === "SUCCESS") {
                    toastEmitter(selectedProv.id === "new" ? "Provider created" : "Provider updated", true);
                    setProvModal(false);
                    loadAll();
                } else {
                    toastEmitter(res?.data?.C_MESSAGE || "Save failed", true, "warning");
                }
            })
            .finally(() => setProvSaving(false));
    }

    function deleteProv(p) {
        if (!window.confirm(`Delete provider "${p.provider_name}"?`)) return;
        handleDelete({ entity: "ai_provider", url: API_URL + "?service.key=update.formData", arr: [p.id] })
            .then(res => {
                if (res?.data?.C_STATUS === "SUCCESS") { toastEmitter("Provider deleted", true); loadAll(); }
                else toastEmitter(res?.data?.C_MESSAGE || "Delete failed", true, "warning");
            });
    }

    /* ── Category CRUD ──────────────────────────────────────────────────── */
    function openAddCat() { setSelectedCat({ ...CAT_INIT }); setCatErrors({}); setCatModal(true); }
    function openEditCat(c) { setSelectedCat({ ...c }); setCatErrors({}); setCatModal(true); }

    function validateCat() {
        const errs = {};
        if (!selectedCat.title?.trim()) errs.title = "Title is required";
        if (!selectedCat.key?.trim()) errs.key = "Key is required";
        setCatErrors(errs);
        return Object.keys(errs).length === 0;
    }

    function saveCat() {
        if (!validateCat()) return;
        setCatSaving(true);
        handleSave({ entity: "ai_agent_category", formData: selectedCat })
            .then(res => {
                if (res?.data?.C_STATUS === "SUCCESS") {
                    toastEmitter(selectedCat.id === "new" ? "Category created" : "Category updated", true);
                    setCatModal(false);
                    loadAll();
                } else {
                    toastEmitter(res?.data?.C_MESSAGE || "Save failed", true, "warning");
                }
            })
            .finally(() => setCatSaving(false));
    }

    function deleteCat(c) {
        if (!window.confirm(`Delete category "${c.title}"?`)) return;
        handleDelete({ entity: "ai_agent_category", url: API_URL + "?service.key=update.formData", arr: [c.id] })
            .then(res => {
                if (res?.data?.C_STATUS === "SUCCESS") { toastEmitter("Category deleted", true); loadAll(); }
                else toastEmitter(res?.data?.C_MESSAGE || "Delete failed", true, "warning");
            });
    }

    /* ── loading ────────────────────────────────────────────────────────── */
    if (!schemaReady || isLoading) return (
        <div className="ai-services static-module-bg container-fluid">
            <Loading message="Initialising AI Services…" />
        </div>
    );

    return (
        <ErrorBoundary>
            <div className="ai-services static-module-bg container-fluid">

                {/* ── page header ──────────────────────────────────────── */}
                <div className="row mb-3">
                    <div className="col-sm-12 datalist-viewer">
                        <div className="s2a-datalist-header">
                            <div className="s2a-dl-title-wrapper">
                                <div className="s2a-dl-title">
                                    <i className="fa-solid fa-robot me-2" />
                                    <span>AI Services</span>
                                </div>
                                <span>Configure AI providers, agent categories, agents, and task definitions for AI Services.</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── split layout ─────────────────────────────────────── */}
                <div className="ais-layout">

                    {/* LEFT — Agents accordion ───────────────────────── */}
                    <div className="ais-left">
                        <AiAgents
                            agents={agents}
                            providers={providers}
                            categories={categories}
                            onAgentsChanged={loadAll}
                        />
                    </div>

                    {/* RIGHT — Providers + Categories ────────────────── */}
                    <div className="ais-right">

                        {/* AI Providers */}
                        <div className="ais-panel mb-3">
                            <div className="ais-panel-header">
                                <div className="d-flex align-items-start gap-2 flex-1">
                                    <span className="ais-panel-icon">
                                        <i className="fa-solid fa-brain" aria-hidden="true" />
                                    </span>
                                    <div>
                                        <div className="ais-panel-title">AI Providers</div>
                                        <div className="ais-panel-desc">Configured LLM providers for agent execution</div>
                                    </div>
                                </div>
                                <button type="button" className="ais-add-btn" onClick={openAddProv}>
                                    <i className="fa-solid fa-plus" aria-hidden="true" /> Add Provider
                                </button>
                            </div>
                            <div className="ais-list">
                                {providers.length === 0 && (
                                    <div className="ais-list-empty">No providers configured yet</div>
                                )}
                                {providers.map((p, idx) => (
                                    <div key={p.id} className="ais-list-item">
                                        <span className="ais-entity-icon" style={{ background: `${getColor(idx)}22`, color: getColor(idx) }}>
                                            <i className={`fa-solid ${providerIcon(p.provider_key)}`} aria-hidden="true" />
                                        </span>
                                        <span className="ais-list-name">{p.provider_name}</span>
                                        <code className="ais-key-badge">{p.model}</code>
                                        <span className="ais-count-badge" style={{ background: `${getColor(idx)}18`, color: getColor(idx) }}>
                                            {agentCountForProvider(p)}
                                        </span>
                                        <div className="ais-list-actions">
                                            <button type="button" className="ais-icon-btn" title="Edit" onClick={() => openEditProv(p)}>
                                                <i className="fa-regular fa-pen-to-square" aria-hidden="true" />
                                            </button>
                                            <button type="button" className="ais-icon-btn danger" title="Delete" onClick={() => deleteProv(p)}>
                                                <i className="fa-regular fa-trash-can" aria-hidden="true" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* AI Categories */}
                        <div className="ais-panel">
                            <div className="ais-panel-header">
                                <div className="d-flex align-items-start gap-2 flex-1">
                                    <span className="ais-panel-icon">
                                        <i className="fa-solid fa-tag" aria-hidden="true" />
                                    </span>
                                    <div>
                                        <div className="ais-panel-title">AI Categories</div>
                                        <div className="ais-panel-desc">Logical groups for organising agents</div>
                                    </div>
                                </div>
                                <button type="button" className="ais-add-btn" onClick={openAddCat}>
                                    <i className="fa-solid fa-plus" aria-hidden="true" /> Add Category
                                </button>
                            </div>
                            <div className="ais-list">
                                {categories.length === 0 && (
                                    <div className="ais-list-empty">No categories yet</div>
                                )}
                                {categories.map((c, idx) => (
                                    <div key={c.id} className="ais-list-item">
                                        <span className="ais-cat-icon" style={{ color: getColor(idx + 2) }}>
                                            <i className="fa-solid fa-tag" aria-hidden="true" />
                                        </span>
                                        <span className="ais-list-name">{c.title}</span>
                                        <span className="ais-count-badge">{agentCountForCategory(c)}</span>
                                        <div className="ais-list-actions">
                                            <button type="button" className="ais-icon-btn" title="Edit" onClick={() => openEditCat(c)}>
                                                <i className="fa-regular fa-pen-to-square" aria-hidden="true" />
                                            </button>
                                            <button type="button" className="ais-icon-btn danger" title="Delete" onClick={() => deleteCat(c)}>
                                                <i className="fa-regular fa-trash-can" aria-hidden="true" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* ════════════ MODALS ══════════════════════════════════════ */}

                {/* Provider modal */}
                {provModal && (
                    <div className="ai-modal-overlay">
                        <div className="ai-modal">
                            <div className="ai-modal-header">
                                <h5>
                                    <i className="fa-solid fa-brain me-2" />
                                    {selectedProv.id === "new" ? "Add AI Provider" : "Edit AI Provider"}
                                </h5>
                                <button className="ai-modal-close" onClick={() => setProvModal(false)}>
                                    <i className="fa-solid fa-xmark" />
                                </button>
                            </div>
                            <div className="ai-modal-body">
                                {/* Provider select */}
                                <div className="mb-3">
                                    <label className="ai-label">
                                        Provider <span className="text-danger">*</span>
                                    </label>
                                    <select
                                        className={`form-control form-select ${provErrors.provider_key ? "is-invalid" : ""}`}
                                        value={selectedProv.provider_key}
                                        onChange={handleProviderSelect}>
                                        <option value="">— Select a provider —</option>
                                        {PROVIDERS.map(p => (
                                            <option key={p.key} value={p.key}>{p.name}</option>
                                        ))}
                                    </select>
                                    {provErrors.provider_key && <div className="invalid-feedback">{provErrors.provider_key}</div>}
                                    {selectedProv.provider_key === "openai" && (
                                        <div className="ais-url-hint">
                                            <i className="fa-solid fa-link me-1" aria-hidden="true" />
                                            {selectedProv.api_url}
                                        </div>
                                    )}
                                    {selectedProv.provider_key === "ollama" && (
                                        <div className="ais-url-hint">
                                            <label className="ai-label">
                                                <i className="fa-solid fa-link me-1" aria-hidden="true" /> Ollama Public API URL<span className="text-danger">*</span>
                                                <span className="ai-tooltip ms-1" title="Must be a valid Public Ollama API URL.">
                                                    <i className="fa-solid fa-circle-info" />
                                                </span>
                                            </label>
                                            <input
                                                list="ais-model-datalist"
                                                className="form-control"
                                                name="api_url"
                                                value={selectedProv.api_url || ""}
                                                onChange={e => setSelectedProv(p => ({ ...p, api_url: e.target.value }))}
                                                placeholder={selectedProv.provider_key ? "Ollama Public API URL…" : "Select a provider first"}
                                                disabled={!selectedProv.provider_key}
                                            />
                                        </div>
                                    )}
                                </div>
                                {/* API Key */}
                                {selectedProv.provider_key !== "appflexor" &&
                                    <div className="mb-3">
                                        <label className="ai-label">
                                            API Key <span className="text-danger">*</span>
                                            <span className="ai-tooltip ms-1" title="Stored server-side, never re-displayed in full.">
                                                <i className="fa-solid fa-circle-info" />
                                            </span>
                                        </label>
                                        <div className="input-group">
                                            <input
                                                className={`form-control ${provErrors.api_key ? "is-invalid" : ""}`}
                                                name="api_key"
                                                type={showApiKey ? "text" : "password"}
                                                value={selectedProv.api_key}
                                                onChange={e => setSelectedProv(p => ({ ...p, api_key: e.target.value }))}
                                                placeholder="sk-…"
                                                autoComplete="new-password"
                                                disabled={!selectedProv.provider_key}
                                            />
                                            <button
                                                className="btn btn-outline-secondary"
                                                type="button"
                                                title={showApiKey ? "Hide" : "Show"}
                                                onClick={() => setShowApiKey(s => !s)}
                                                disabled={!selectedProv.provider_key}>
                                                <i className={`fa-solid ${showApiKey ? "fa-eye-slash" : "fa-eye"}`} />
                                            </button>
                                            {provErrors.api_key && <div className="invalid-feedback">{provErrors.api_key}</div>}
                                        </div>
                                    </div>
                                }
                                {/* AI Model */}
                                <div className="mb-1">
                                    <label className="ai-label">
                                        AI Model
                                        <span className="ai-tooltip ms-1" title="The model used by this provider. Fetch available models from the API or enter a name manually.">
                                            <i className="fa-solid fa-circle-info" />
                                        </span>
                                    </label>
                                    <div className="ais-model-row">
                                        <div className="flex-1">
                                            <select
                                                className="form-control"
                                                name="model"
                                                value={selectedProv.model || ""}
                                                onChange={e =>
                                                    setSelectedProv(p => ({ ...p, model: e.target.value }))
                                                }
                                                disabled={!selectedProv.provider_key}
                                            >
                                                <option value="" disabled>
                                                    {selectedProv.provider_key
                                                        ? "Select a model…"
                                                        : "Select a provider first"}
                                                </option>
                                                {modelOptions.map(m => (
                                                    <option key={m.id} value={m.id}>
                                                        {m.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary btn-sm ais-fetch-btn"
                                            onClick={() => fetchModels(selectedProv.provider_key, selectedProv.api_key)}
                                            disabled={modelFetching || !selectedProv.provider_key}>
                                            {modelFetching
                                                ? <><i className="fa-solid fa-spinner fa-spin me-1" />Fetching…</>
                                                : <><i className="fa-solid fa-rotate me-1" />Fetch Models</>}
                                        </button>
                                    </div>
                                    {modelError && (
                                        <div className="ais-model-hint ais-model-hint--warn mt-1">
                                            <i className="fa-solid fa-triangle-exclamation me-1" />{modelError}
                                        </div>
                                    )}
                                    {modelOptions.length > 0 && !modelError && (
                                        <div className="ais-model-hint ais-model-hint--ok mt-1">
                                            <i className="fa-solid fa-circle-check me-1" />{modelOptions.length} models loaded
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="ai-modal-footer">
                                <button className="btn btn-secondary btn-sm" onClick={() => setProvModal(false)}>Cancel</button>
                                <button className="btn btn-primary btn-sm" onClick={saveProv} disabled={provSaving}>
                                    {provSaving
                                        ? <><i className="fa-solid fa-spinner fa-spin me-1" />Saving…</>
                                        : <><i className="fa-solid fa-floppy-disk me-1" />{selectedProv.id === "new" ? "Save" : "Update"}</>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Category modal */}
                {catModal && (
                    <div className="ai-modal-overlay">
                        <div className="ai-modal">
                            <div className="ai-modal-header">
                                <h5>
                                    <i className="fa-solid fa-brain me-2" />
                                    {selectedCat.id === "new" ? "Add Category" : "Edit Category"}
                                </h5>
                                <button className="ai-modal-close" onClick={() => setCatModal(false)}>
                                    <i className="fa-solid fa-xmark" />
                                </button>
                            </div>
                            <div className="ai-modal-body">
                                <div className="mb-3">
                                    <label className="ai-label">Title <span className="text-danger">*</span></label>
                                    <input
                                        className={`form-control ${catErrors.title ? "is-invalid" : ""}`}
                                        value={selectedCat.title}
                                        onChange={e => setSelectedCat(p => ({ ...p, title: e.target.value }))}
                                        placeholder="e.g. Customer Support"
                                    />
                                    {catErrors.title && <div className="invalid-feedback">{catErrors.title}</div>}
                                </div>
                                <div className="mb-1">
                                    <label className="ai-label">Key <span className="text-danger">*</span></label>
                                    <input
                                        className={`form-control ${catErrors.key ? "is-invalid" : ""}`}
                                        value={selectedCat.key}
                                        onChange={e => setSelectedCat(p => ({ ...p, key: e.target.value }))}
                                        placeholder="e.g. customer-support"
                                    />
                                    {catErrors.key && <div className="invalid-feedback">{catErrors.key}</div>}
                                </div>
                            </div>
                            <div className="ai-modal-footer">
                                <button className="btn btn-secondary btn-sm" onClick={() => setCatModal(false)}>Cancel</button>
                                <button className="btn btn-primary btn-sm" onClick={saveCat} disabled={catSaving}>
                                    {catSaving
                                        ? <><i className="fa-solid fa-spinner fa-spin me-1" />Saving…</>
                                        : <><i className="fa-solid fa-floppy-disk me-1" />{selectedCat.id === "new" ? "Save" : "Update"}</>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </ErrorBoundary>
    );
}

export default AiServices;
