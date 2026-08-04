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
    "#4f46e5","#16a34a","#9333ea","#ea580c",
    "#0891b2","#d97706","#dc2626","#7c3aed",
    "#0f766e","#be185d",
];
const getColor = i => PALETTE[i % PALETTE.length];

/* ── provider → icon mapping ────────────────────────────────────────────── */
const PROVIDER_ICONS = {
    openai:    "fa-brain",
    anthropic: "fa-robot",
    azure:     "fa-cloud",
    groq:      "fa-bolt",
    mistral:   "fa-wind",
    gemini:    "fa-circle-nodes",
    google:    "fa-circle-nodes",
    cohere:    "fa-network-wired",
    ollama:    "fa-server",
};
const providerIcon = (key = "") =>
    PROVIDER_ICONS[(key || "").toLowerCase()] || "fa-plug-circle-bolt";

/* ── initial form states ────────────────────────────────────────────────── */
const PROV_INIT = { id: "new", provider_name: "", provider_key: "", api_key: "" };
const CAT_INIT  = { id: "new", title: "", key: "" };

/* ════════════════════════════════════════════════════════════════════════ */
function AiServices() {
    const [providers,   setProviders]   = useState([]);
    const [agents,      setAgents]      = useState([]);
    const [categories,  setCategories]  = useState([]);
    const [isLoading,   setIsLoading]   = useState(true);
    const [schemaReady, setSchemaReady] = useState(false);

    /* ── Provider CRUD state ──────────────────────────────────────────── */
    const [provModal,    setProvModal]    = useState(false);
    const [selectedProv, setSelectedProv] = useState(PROV_INIT);
    const [provErrors,   setProvErrors]   = useState({});
    const [provSaving,   setProvSaving]   = useState(false);
    const [showApiKey,   setShowApiKey]   = useState(false);

    /* ── Category CRUD state ──────────────────────────────────────────── */
    const [catModal,    setCatModal]    = useState(false);
    const [selectedCat, setSelectedCat] = useState(CAT_INIT);
    const [catErrors,   setCatErrors]   = useState({});
    const [catSaving,   setCatSaving]   = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
        // Initialise DB tables for all four entities before loading any data
        Promise.all(
            ["ai_provider", "ai_agent", "ai_task", "ai_agent_category"].map(entity =>
                axios.post(API_URL + "?service.key=validate.schema", {
                    saveOrUpdate: "Yes",
                    datasource: "",
                    data: [{ formId: entity, entity, action: "update",
                             formData: { id: "new" }, mode: "formData", id: "new" }],
                }).catch(err => console.warn("validate.schema [" + entity + "]:", err))
            )
        ).finally(() => { setSchemaReady(true); loadAll(); });
    }, []);

    /* ── batch-load all data ────────────────────────────────────────────── */
    function loadAll() {
        setIsLoading(true);
        getData({
            keys: [
                { params: "", dataKey: "providers",  serviceKey: "ai.provider.list",   mode: "formData" },
                { params: "", dataKey: "agents",     serviceKey: "ai.agent.list",       mode: "formData" },
                { params: "", dataKey: "categories", serviceKey: "ai.agent.categories", mode: "formData" },
            ],
        })
        .then(res => {
            const d = res?.data?.C_DATA || {};
            setProviders(d.providers   || []);
            setAgents(d.agents         || []);
            setCategories(d.categories || []);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }

    /* ── counts (client-side) ───────────────────────────────────────────── */
    const agentCountForProvider = p => agents.filter(a => a.ai_provider === p.provider_key).length;
    const agentCountForCategory = c => agents.filter(a => a.category    === c.id).length;

    /* ── Provider CRUD ──────────────────────────────────────────────────── */
    function openAddProv()    { setSelectedProv({ ...PROV_INIT }); setProvErrors({}); setShowApiKey(false); setProvModal(true); }
    function openEditProv(p)  { setSelectedProv({ ...p });         setProvErrors({}); setShowApiKey(false); setProvModal(true); }

    function validateProv() {
        const errs = {};
        if (!selectedProv.provider_name?.trim()) errs.provider_name = "Provider name is required";
        if (!selectedProv.provider_key?.trim())  errs.provider_key  = "Provider key is required";
        if (!selectedProv.api_key?.trim())       errs.api_key       = "API key is required";
        setProvErrors(errs);
        return Object.keys(errs).length === 0;
    }

    function saveProv() {
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
    function openAddCat()    { setSelectedCat({ ...CAT_INIT }); setCatErrors({}); setCatModal(true); }
    function openEditCat(c)  { setSelectedCat({ ...c });        setCatErrors({}); setCatModal(true); }

    function validateCat() {
        const errs = {};
        if (!selectedCat.title?.trim()) errs.title = "Title is required";
        if (!selectedCat.key?.trim())   errs.key   = "Key is required";
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
                                        <i className="fa-solid fa-plug-circle-bolt" aria-hidden="true" />
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
                                        <code className="ais-key-badge">{p.provider_key}</code>
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
                                        <i className="fa-solid fa-brain" aria-hidden="true" />
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
                                            <i className="fa-solid fa-brain" aria-hidden="true" />
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
                    <div className="ai-modal-overlay" onClick={e => e.target === e.currentTarget && setProvModal(false)}>
                        <div className="ai-modal">
                            <div className="ai-modal-header">
                                <h5>
                                    <i className="fa-solid fa-plug-circle-bolt me-2" />
                                    {selectedProv.id === "new" ? "Add AI Provider" : "Edit AI Provider"}
                                </h5>
                                <button className="ai-modal-close" onClick={() => setProvModal(false)}>
                                    <i className="fa-solid fa-xmark" />
                                </button>
                            </div>
                            <div className="ai-modal-body">
                                <div className="mb-3">
                                    <label className="ai-label">
                                        Provider Name <span className="text-danger">*</span>
                                        <span className="ai-tooltip ms-1" title="Human-readable name (e.g. OpenAI, Anthropic, Groq)">
                                            <i className="fa-solid fa-circle-info" />
                                        </span>
                                    </label>
                                    <input
                                        className={`form-control ${provErrors.provider_name ? "is-invalid" : ""}`}
                                        name="provider_name"
                                        value={selectedProv.provider_name}
                                        onChange={e => setSelectedProv(p => ({ ...p, provider_name: e.target.value }))}
                                        placeholder="e.g. OpenAI"
                                    />
                                    {provErrors.provider_name && <div className="invalid-feedback">{provErrors.provider_name}</div>}
                                </div>
                                <div className="mb-3">
                                    <label className="ai-label">
                                        Provider Key <span className="text-danger">*</span>
                                        <span className="ai-tooltip ms-1" title="Lowercase identifier used in agent configs and workflows (e.g. openai, anthropic)">
                                            <i className="fa-solid fa-circle-info" />
                                        </span>
                                    </label>
                                    <input
                                        className={`form-control ${provErrors.provider_key ? "is-invalid" : ""}`}
                                        name="provider_key"
                                        value={selectedProv.provider_key}
                                        onChange={e => setSelectedProv(p => ({ ...p, provider_key: e.target.value }))}
                                        placeholder="e.g. openai"
                                    />
                                    {provErrors.provider_key && <div className="invalid-feedback">{provErrors.provider_key}</div>}
                                </div>
                                <div className="mb-1">
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
                                        />
                                        <button
                                            className="btn btn-outline-secondary"
                                            type="button"
                                            title={showApiKey ? "Hide" : "Show"}
                                            onClick={() => setShowApiKey(s => !s)}>
                                            <i className={`fa-solid ${showApiKey ? "fa-eye-slash" : "fa-eye"}`} />
                                        </button>
                                        {provErrors.api_key && <div className="invalid-feedback">{provErrors.api_key}</div>}
                                    </div>
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
                    <div className="ai-modal-overlay" onClick={e => e.target === e.currentTarget && setCatModal(false)}>
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
