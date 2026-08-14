import React, { useState } from "react";
import SimulationScenarioList from "./SimulationScenarioList";
import SimulationScenarioForm from "./SimulationScenarioForm";
import ProcessModelViewer from "./ProcessModelViewer";
import "./process-simulator.css";

/* ════════════════════════════════════════════════════════════════════════════
   ProcessSimulator — module shell
   Mounted inside the Orchestrate FullScreenDialog (no backend calls yet).
   ════════════════════════════════════════════════════════════════════════════ */
function ProcessSimulator({ initialProcess = null }) {
    /* ── scenarios (local state until DB is wired) ─────────────────────── */
    const [scenarios, setScenarios] = useState([]);
    const [selectedScenario, setSelectedScenario] = useState(null);

    /* ── form (add / edit) ─────────────────────────────────────────────── */
    const [showForm, setShowForm] = useState(false);
    const [editingScenario, setEditingScenario] = useState(null);

    /* ── handlers ──────────────────────────────────────────────────────── */
    function handleAdd() {
        setEditingScenario(null);
        setShowForm(true);
    }

    function handleEdit(scenario) {
        setEditingScenario(scenario);
        setShowForm(true);
    }

    function handleDelete(scenario) {
        setScenarios(prev => prev.filter(s => s.id !== scenario.id));
        if (selectedScenario?.id === scenario.id) setSelectedScenario(null);
    }

    function handleSave(data) {
        if (data.id) {
            setScenarios(prev => prev.map(s => s.id === data.id ? data : s));
            if (selectedScenario?.id === data.id) setSelectedScenario(data);
        } else {
            const created = { ...data, id: `sim_${Date.now()}` };
            setScenarios(prev => [...prev, created]);
        }
        setShowForm(false);
        setEditingScenario(null);
    }

    function handleCancel() {
        setShowForm(false);
        setEditingScenario(null);
    }

    /* ── render ─────────────────────────────────────────────────────────── */
    return (
        <div className="psim-root">
            <div className="psim-layout">

                {/* ── LEFT: scenario list ──────────────────────────────── */}
                <div className="psim-col psim-col-left">
                    <SimulationScenarioList
                        scenarios={scenarios}
                        selectedScenario={selectedScenario}
                        onSelect={setSelectedScenario}
                        onAdd={handleAdd}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                </div>

                {/* ── RIGHT: process model viewer ──────────────────────── */}
                <div className="psim-col psim-col-right">
                    <ProcessModelViewer
                        scenario={selectedScenario}
                        initialProcess={initialProcess}
                    />
                </div>

            </div>

            {/* ── scenario form modal ──────────────────────────────────── */}
            {showForm && (
                <SimulationScenarioForm
                    scenario={editingScenario}
                    onSave={handleSave}
                    onCancel={handleCancel}
                />
            )}
        </div>
    );
}

export default ProcessSimulator;
