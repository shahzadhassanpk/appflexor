import React, { useEffect, useRef, useState } from "react";
import { API_URL } from "../../../Config";
import { getData, handleSave, handleDelete } from "../../../components/CrudApiCall";
import { toastEmitter } from "../../../components/Toastify/Toastify";
import { filterArrayByTerms } from "../../../utils/utils";

const EMPTY = { id: "new", provider_name: "", provider_key: "", api_key: "" };

function AiProviders() {
    const [providers, setProviders] = useState([]);
    const [filtered, setFiltered]   = useState([]);
    const [form, setForm]           = useState(EMPTY);
    const [showForm, setShowForm]   = useState(false);
    const [errors, setErrors]       = useState({});
    const [showKey, setShowKey]     = useState(false);
    const [saving, setSaving]       = useState(false);
    const searchRef = useRef();

    useEffect(() => { load(); }, []);

    function load() {
        getData({
            keys: [{ params: "", dataKey: "providers", serviceKey: "ai.provider.list", mode: "formData" }],
        }).then(res => {
            const data = res?.data?.C_DATA?.providers || [];
            setProviders(data);
            setFiltered(data);
        }).catch(console.error);
    }

    function handleSearch(e) {
        const term = e.target.value.toLowerCase();
        if (!term) { setFiltered(providers); return; }
        setFiltered(filterArrayByTerms(providers, term, ["provider_name", "provider_key"]));
    }

    function openAdd() {
        setForm({ ...EMPTY });
        setErrors({});
        setShowKey(false);
        setShowForm(true);
    }

    function openEdit(p) {
        setForm({ ...p });
        setErrors({});
        setShowKey(false);
        setShowForm(true);
    }

    function handleInput(e) {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    }

    function validate() {
        const errs = {};
        if (!form.provider_name?.trim()) errs.provider_name = "Provider name is required";
        if (!form.provider_key?.trim())  errs.provider_key  = "Provider key is required";
        if (!form.api_key?.trim())       errs.api_key       = "API key is required";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    function save() {
        if (!validate()) return;
        setSaving(true);
        handleSave({ entity: "ai_provider", formData: form })
            .then(res => {
                if (res?.data?.C_STATUS === "SUCCESS") {
                    toastEmitter(form.id === "new" ? "Provider created" : "Provider updated", true);
                    setShowForm(false);
                    load();
                } else {
                    toastEmitter(res?.data?.C_MESSAGE || "Save failed", true, "warning");
                }
            })
            .finally(() => setSaving(false));
    }

    function remove(p) {
        if (!window.confirm(`Delete provider "${p.provider_name}"? This cannot be undone.`)) return;
        handleDelete({ entity: "ai_provider", url: API_URL + "?service.key=update.formData", arr: [p.id] })
            .then(res => {
                if (res?.data?.C_STATUS === "SUCCESS") {
                    toastEmitter("Provider deleted", true);
                    load();
                } else {
                    toastEmitter(res?.data?.C_MESSAGE || "Delete failed", true, "warning");
                }
            });
    }

    return (
        <div className="ai-tab-pane">
            {/* Toolbar */}
            <div className="ai-toolbar">
                <input
                    ref={searchRef}
                    className="form-control ai-search"
                    placeholder="Search providers…"
                    onChange={handleSearch}
                />
                <button className="btn btn-primary btn-sm" onClick={openAdd}>
                    <i className="fa-solid fa-plus me-1" /> Add Provider
                </button>
            </div>

            {/* Table */}
            <div className="table-responsive">
                <table className="table s2a-table ai-table table-hover mb-0">
                    <thead className="thead">
                        <tr>
                            <th style={{ width: 200 }}>Provider Name</th>
                            <th style={{ width: 200 }}>Provider Key</th>
                            {/* <th>API Key</th> */}
                            <th style={{ width: 200 }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={4}>
                                    <div className="ai-empty">
                                        <i className="fa-solid fa-plug-circle-bolt" />
                                        No providers found. Add one to get started.
                                    </div>
                                </td>
                            </tr>
                        )}
                        {filtered.map(p => (
                            <tr key={p.id}>
                                <td><strong>{p.provider_name}</strong></td>
                                <td><span>{p.provider_key}</span></td>
                                {/* <td>
                                    <span className="ai-masked-key" title="API key stored securely">
                                        {"•".repeat(24)}
                                    </span>
                                </td> */}
                                <td>
                                    <button
                                        className="btn btn-sm ai-action-btn me-1"
                                        title="Edit provider"
                                        onClick={() => openEdit(p)}>
                                        <i className="fa-solid fa-pen" />
                                    </button>
                                    <button
                                        className="btn btn-sm ai-action-btn ai-action-danger"
                                        title="Delete provider"
                                        onClick={() => remove(p)}>
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
                    <div className="ai-modal">
                        <div className="ai-modal-header">
                            <h5>
                                <i className="fa-solid fa-plug-circle-bolt me-2" />
                                {form.id === "new" ? "Add AI Provider" : "Edit AI Provider"}
                            </h5>
                            <button className="ai-modal-close" onClick={() => setShowForm(false)}>
                                <i className="fa-solid fa-xmark" />
                            </button>
                        </div>

                        <div className="ai-modal-body">
                            {/* Provider Name */}
                            <div className="mb-3">
                                <label className="ai-label">
                                    Provider Name <span className="text-danger">*</span>
                                    <span className="ai-tooltip ms-1" title="Human-readable name shown in the UI (e.g. OpenAI, Anthropic, Groq)">
                                        <i className="fa-solid fa-circle-info" />
                                    </span>
                                </label>
                                <input
                                    className={`form-control ${errors.provider_name ? "is-invalid" : ""}`}
                                    name="provider_name"
                                    value={form.provider_name}
                                    onChange={handleInput}
                                    placeholder="e.g. OpenAI"
                                />
                                {errors.provider_name && <div className="invalid-feedback">{errors.provider_name}</div>}
                            </div>

                            {/* Provider Key */}
                            <div className="mb-3">
                                <label className="ai-label">
                                    Provider Key <span className="text-danger">*</span>
                                    <span className="ai-tooltip ms-1" title="Short lowercase identifier used in agent configs and workflows (e.g. openai, anthropic, groq)">
                                        <i className="fa-solid fa-circle-info" />
                                    </span>
                                </label>
                                <input
                                    className={`form-control ${errors.provider_key ? "is-invalid" : ""}`}
                                    name="provider_key"
                                    value={form.provider_key}
                                    onChange={handleInput}
                                    placeholder="e.g. openai"
                                />
                                {errors.provider_key && <div className="invalid-feedback">{errors.provider_key}</div>}
                            </div>

                            {/* API Key */}
                            <div className="mb-3">
                                <label className="ai-label">
                                    API Key <span className="text-danger">*</span>
                                    <span className="ai-tooltip ms-1" title="Secret key from the provider's dashboard. Stored server-side and never re-displayed in full.">
                                        <i className="fa-solid fa-circle-info" />
                                    </span>
                                </label>
                                <div className="input-group">
                                    <input
                                        className={`form-control ${errors.api_key ? "is-invalid" : ""}`}
                                        name="api_key"
                                        type={showKey ? "text" : "password"}
                                        value={form.api_key}
                                        onChange={handleInput}
                                        placeholder="sk-…"
                                        autoComplete="new-password"
                                    />
                                    <button
                                        className="btn btn-outline-secondary"
                                        type="button"
                                        title={showKey ? "Hide key" : "Show key"}
                                        onClick={() => setShowKey(s => !s)}>
                                        <i className={`fa-solid ${showKey ? "fa-eye-slash" : "fa-eye"}`} />
                                    </button>
                                    {errors.api_key && <div className="invalid-feedback">{errors.api_key}</div>}
                                </div>
                            </div>
                        </div>

                        <div className="ai-modal-footer">
                            <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
                            <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
                                {saving
                                    ? <><i className="fa-solid fa-spinner fa-spin me-1" />Saving…</>
                                    : <><i className="fa-solid fa-floppy-disk me-1" />Save</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AiProviders;
