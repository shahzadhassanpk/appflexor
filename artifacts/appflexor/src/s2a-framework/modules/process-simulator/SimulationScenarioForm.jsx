import React, { useState } from "react";
import ModuleFormViewer from "../../components/ModuleFormViewer/ModuleFormViewer";

/* ════════════════════════════════════════════════════════════════════════════
   SimulationScenarioForm
   Add / edit a simulation scenario via the shared ModuleFormViewer modal.
   ════════════════════════════════════════════════════════════════════════════ */
const SCENARIO_INIT = {
    id: "",
    name: "",
    processKey: "",
    processTitle: "",
    description: "",
    notes: "",
};

function SimulationScenarioForm({ scenario, onSave, onCancel }) {
    const isEdit = !!(scenario?.id);
    const [form, setForm] = useState(
        scenario
            ? { ...SCENARIO_INIT, ...scenario }
            : { ...SCENARIO_INIT }
    );

    function set(field, value) {
        setForm(prev => ({ ...prev, [field]: value }));
    }

    function handleSave() {
        if (!form.name.trim()) return;
        onSave({ ...form, name: form.name.trim() });
    }

    const isValid = form.name.trim().length > 0;

    return (
        <ModuleFormViewer
            showModal={true}
            handleClose={onCancel}
            modalTitle={isEdit ? "Edit Scenario" : "New Simulation Scenario"}
            size="lg">

            <div className="col-12 form-background pt-2 pb-3 px-3">

                {/* Name */}
                <div className="mb-3">
                    <label className="fw-semibold mt-1">
                        Scenario Name <span className="text-danger">*</span>
                    </label>
                    <input
                        type="text"
                        className="form-control mt-1"
                        placeholder="e.g. Happy path — new customer onboarding"
                        value={form.name}
                        onChange={e => set("name", e.target.value)}
                    />
                </div>

                {/* Process key (free-text until DB is wired) */}
                <div className="mb-3">
                    <label className="fw-semibold mt-1">Target Process Key</label>
                    <input
                        type="text"
                        className="form-control mt-1"
                        placeholder="e.g. customer-onboarding"
                        value={form.processKey}
                        onChange={e => set("processKey", e.target.value)}
                    />
                    <small className="text-muted">
                        Process definition key from the Camunda engine.
                    </small>
                </div>

                {/* Process display title */}
                <div className="mb-3">
                    <label className="fw-semibold mt-1">Process Title</label>
                    <input
                        type="text"
                        className="form-control mt-1"
                        placeholder="e.g. Customer Onboarding"
                        value={form.processTitle}
                        onChange={e => set("processTitle", e.target.value)}
                    />
                </div>

                {/* Description */}
                <div className="mb-3">
                    <label className="fw-semibold mt-1">Description</label>
                    <textarea
                        className="form-control mt-1"
                        rows={3}
                        placeholder="Describe what this scenario tests…"
                        value={form.description}
                        onChange={e => set("description", e.target.value)}
                    />
                </div>

                {/* Notes */}
                <div className="mb-1">
                    <label className="fw-semibold mt-1">Notes</label>
                    <textarea
                        className="form-control mt-1"
                        rows={2}
                        placeholder="Internal notes or assumptions…"
                        value={form.notes}
                        onChange={e => set("notes", e.target.value)}
                    />
                </div>
            </div>

            {/* footer */}
            <div className="modal-footer pe-0">
                <button
                    type="button"
                    className="btn button-theme btn-sm me-2"
                    onClick={handleSave}
                    disabled={!isValid}>
                    <i className="fa-solid fa-floppy-disk pe-1" />
                    {isEdit ? "Update" : "Save"}
                </button>
                <button
                    type="button"
                    className="btn button-theme btn-sm"
                    onClick={onCancel}>
                    <i className="fa-solid fa-xmark pe-1" />
                    Cancel
                </button>
            </div>
        </ModuleFormViewer>
    );
}

export default SimulationScenarioForm;
