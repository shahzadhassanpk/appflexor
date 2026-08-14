import axios from "axios";
import React, { useEffect, useState } from "react";
import ModalBox from "../../components/Modal/Modal";
import Loading from "../../components/Loading/loading";
import { toastEmitter } from "../../components/Toastify/Toastify";
import { updateDeleteConfig } from "../../utils/utils";
import { API_URL } from "../../Config";
import SimulationScenarioList from "./SimulationScenarioList";
import SimulationScenarioForm from "./SimulationScenarioForm";
import ProcessModelViewer from "./ProcessModelViewer";
import "./process-simulator.css";

/* ════════════════════════════════════════════════════════════════════════════
   Helpers
   ════════════════════════════════════════════════════════════════════════════ */
const ENTITY = "simulation_scenarios";

function parseJson(val, fallback) {
    if (!val) return fallback;
    if (typeof val === "object" && !Array.isArray(val)) return val;
    try { return JSON.parse(val); } catch { return fallback; }
}

function hydrate(s) {
    return {
        ...s,
        parameters:  parseJson(s.parameters,  { taskDurations: [], resourcePools: [], gatewayProbs: [] }),
        metadata:    parseJson(s.metadata,    { author: "", description: "", tags: [], processTitle: "" }),
        constraints: parseJson(s.constraints, { maxTokens: "", timeHorizonValue: "", timeHorizonUnit: "hours" }),
    };
}

/* ════════════════════════════════════════════════════════════════════════════
   ProcessSimulator
   ════════════════════════════════════════════════════════════════════════════ */
function ProcessSimulator({ initialProcess = null }) {
    /* ── data ─────────────────────────────────────────────────────────────── */
    const [scenarios,       setScenarios]       = useState([]);
    const [isLoading,       setIsLoading]       = useState(true);
    const [loadError,       setLoadError]       = useState(false);

    /* ── view ─────────────────────────────────────────────────────────────── */
    const [selectedScenario, setSelectedScenario] = useState(null);

    /* ── form ─────────────────────────────────────────────────────────────── */
    const [showForm,         setShowForm]         = useState(false);
    const [editingScenario,  setEditingScenario]  = useState(null);
    const [saving,           setSaving]           = useState(false);

    /* ── delete ───────────────────────────────────────────────────────────── */
    const [deleteConfig, setDeleteConfig] = useState({ show: false, item: {} });

    /* ── mount ────────────────────────────────────────────────────────────── */
    useEffect(() => { getData(); }, []);

    /* ══════════════════════════════════════════════════════════════════════
       API
       ══════════════════════════════════════════════════════════════════════ */
    function getData() {
        setIsLoading(true);
        setLoadError(false);
        axios
            .post(`${API_URL}?service.key=masterKey.tenantData`, {
                dataKeys: [{
                    serviceParams: "",
                    dataKey:       "scenarios",
                    serviceKey:    "list.simulation.scenarios",
                    mode:          "formData",
                }],
            })
            .then(res => {
                if (res.data?.C_STATUS === "SUCCESS") {
                    setScenarios((res.data.C_DATA?.scenarios || []).map(hydrate));
                } else {
                    setLoadError(true);
                }
            })
            .catch(() => setLoadError(true))
            .finally(() => setIsLoading(false));
    }

    function saveScenario(formData) {
        const isNew = !formData.id;
        setSaving(true);
        axios
            .post(`${API_URL}?service.key=update.formData`, {
                data: [{
                    formId:   ENTITY,
                    entity:   ENTITY,
                    action:   "update",
                    id:       isNew ? "new" : formData.id,
                    formData: {
                        name:        formData.name,
                        model_ref:   formData.model_ref,
                        parameters:  JSON.stringify(formData.parameters  || {}),
                        metadata:    JSON.stringify(formData.metadata    || {}),
                        constraints: JSON.stringify(formData.constraints || {}),
                    },
                }],
            })
            .then(res => {
                if (res.data?.C_STATUS === "SUCCESS") {
                    const raw = res.data.C_DATA?.[0]?.formData || {};
                    const merged = hydrate({ ...formData, id: raw.id || formData.id, ...raw });
                    if (isNew) {
                        setScenarios(prev => [...prev, merged]);
                        toastEmitter("Scenario created", true);
                    } else {
                        setScenarios(prev => prev.map(s => s.id === merged.id ? merged : s));
                        if (selectedScenario?.id === merged.id) setSelectedScenario(merged);
                        toastEmitter("Scenario updated", true);
                    }
                    setShowForm(false);
                    setEditingScenario(null);
                } else {
                    toastEmitter("Failed to save scenario", false);
                }
            })
            .catch(() => toastEmitter("Failed to save scenario", false))
            .finally(() => setSaving(false));
    }

    function confirmDelete(item, isConfirmed) {
        if (!isConfirmed) { updateDeleteConfig(false, {}, setDeleteConfig); return; }
        axios
            .post(`${API_URL}?service.key=update.formData`, {
                data: [{ formId: ENTITY, entity: ENTITY, action: "delete", id: item.id }],
            })
            .then(res => {
                if (res.data?.C_STATUS === "SUCCESS") {
                    const gone = res.data.C_DATA?.[0]?.id || item.id;
                    setScenarios(prev => prev.filter(s => s.id !== gone));
                    if (selectedScenario?.id === gone) setSelectedScenario(null);
                    updateDeleteConfig(false, {}, setDeleteConfig);
                    toastEmitter("Scenario deleted", true);
                } else {
                    toastEmitter("Failed to delete scenario", false);
                }
            })
            .catch(() => toastEmitter("Failed to delete scenario", false));
    }

    /* ══════════════════════════════════════════════════════════════════════
       Handlers
       ══════════════════════════════════════════════════════════════════════ */
    const handleAdd    = ()         => { setEditingScenario(null);      setShowForm(true); };
    const handleEdit   = scenario   => { setEditingScenario(scenario);  setShowForm(true); };
    const handleOpen   = scenario   => setSelectedScenario(scenario);
    const handleRun    = ()         => toastEmitter("Token simulation coming in a future release.", false);
    const handleDelete = scenario   => updateDeleteConfig(true, scenario, setDeleteConfig);
    const handleCancel = ()         => { setShowForm(false); setEditingScenario(null); };

    /* ── loading ──────────────────────────────────────────────────────────── */
    if (isLoading) return (
        <div className="psim-root d-flex align-items-center justify-content-center" style={{ minHeight: 400 }}>
            <Loading />
        </div>
    );

    /* ── render ───────────────────────────────────────────────────────────── */
    return (
        <div className="psim-root">
            {/* delete confirmation */}
            <ModalBox
                state={deleteConfig}
                message="Delete this simulation scenario? This cannot be undone."
                operation={confirmDelete}
                header="Delete Scenario"
                setState={setDeleteConfig}
                modalType="deleteModal"
            />

            {/* load-error banner */}
            {loadError && (
                <div className="psim-banner psim-banner--error">
                    <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
                    <span>Could not load scenarios.</span>
                    <button className="orch-add-btn" onClick={getData}>
                        <i className="fa-solid fa-rotate-right" />Retry
                    </button>
                </div>
            )}

            <div className="psim-layout">
                {/* LEFT — scenario list */}
                <div className="psim-col psim-col-left">
                    <SimulationScenarioList
                        scenarios={scenarios}
                        selectedScenario={selectedScenario}
                        onAdd={handleAdd}
                        onOpen={handleOpen}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onRun={handleRun}
                    />
                </div>

                {/* RIGHT — BPMN viewer */}
                <div className="psim-col psim-col-right">
                    <ProcessModelViewer
                        scenario={selectedScenario}
                        initialProcess={initialProcess}
                    />
                </div>
            </div>

            {/* scenario form modal */}
            {showForm && (
                <SimulationScenarioForm
                    scenario={editingScenario}
                    saving={saving}
                    onSave={saveScenario}
                    onCancel={handleCancel}
                />
            )}
        </div>
    );
}

export default ProcessSimulator;
